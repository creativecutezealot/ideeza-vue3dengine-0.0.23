import * as BABYLON from 'babylonjs'

export default {
  // Exports the geometrys of a Mesh array in .OBJ file format (text)
  OBJ: function (mesh, materials, matlibname, globalposition) {
    var output = []
    var v = 1
    if (materials) {
      if (!matlibname) {
        matlibname = 'mat'
      }
      output.push('mtllib ' + matlibname + '.mtl')
    }
    for (var j = 0; j < mesh.length; j++) {
      // output.push('g '+mesh[j].name)
      output.push('o ' + mesh[j].name)

      // Uses the position of the item in the scene, to the file (this back to normal in the end)
      var lastMatrix = null
      if (globalposition) {
        var newMatrix = BABYLON.Matrix.Translation(mesh[j].position.x, mesh[j].position.y, mesh[j].position.z)
        lastMatrix = BABYLON.Matrix.Translation(-(mesh[j].position.x), -(mesh[j].position.y), -(mesh[j].position.z))
        mesh[j].bakeTransformIntoVertices(newMatrix)
      }
      // TODO: submeshes (groups)
      // TODO: smoothing groups (s 1, s off)
      if (materials) {
        var mat = mesh[j].material
        if (mat) {
          output.push('usemtl ' + mat.id)
        }
      }
      var g = mesh[j].geometry
      if (!g) {
        continue
      }

      // glb files need to flip faces
      mesh[j].flipFaces(false)

      var trunkVerts = g.getVerticesData('position')
      var trunkNormals = g.getVerticesData('normal')
      var trunkUV = g.getVerticesData('uv')
      var trunkFaces = g.getIndices()
      var curV = 0
      
      // add custom UV is mesh doesn't have
      if (!trunkUV) {
        trunkUV = []

        var maxIndice = 0
        for (let i = 0; i < trunkFaces.length; i++) {
          maxIndice = Math.max(maxIndice, trunkFaces[i])
        }
        for (let i = 0; i <= maxIndice; i++) {
          trunkUV.push(0,0)
        }
      }

      if (!trunkVerts || !trunkNormals || !trunkUV || !trunkFaces) {
        continue
      }
      for (var i = 0; i < trunkVerts.length; i += 3) {
        if (isNaN(trunkVerts[i])) {
          trunkVerts[i] = 0
        }
        if (isNaN(trunkVerts[i + 1])) {
          trunkVerts[i + 1] = 0
        }
        if (isNaN(trunkVerts[i + 2])) {
          trunkVerts[i + 2] = 0
        }

        output.push('v ' + trunkVerts[i] + ' ' + trunkVerts[i + 1] + ' ' + trunkVerts[i + 2])
        curV++
      }
      for (i = 0; i < trunkNormals.length; i += 3) {
        if (isNaN(trunkNormals[i])) {
          trunkNormals[i] = 0
        }
        if (isNaN(trunkNormals[i + 1])) {
          trunkNormals[i + 1] = 0
        }
        if (isNaN(trunkNormals[i + 2])) {
          trunkNormals[i + 2] = 0
        }

        output.push('vn ' + trunkNormals[i] + ' ' + trunkNormals[i + 1] + ' ' + trunkNormals[i + 2])
      }
      for (i = 0; i < trunkUV.length; i += 2) {
        output.push('vt ' + trunkUV[i] + ' ' + trunkUV[i + 1])
      }
      for (i = 0; i < trunkFaces.length; i += 3) {
        output.push('f ' + (trunkFaces[i + 2] + v) + '/' + (trunkFaces[i + 2] + v) + '/' + (trunkFaces[i + 2] + v) +
        ' ' + (trunkFaces[i + 1] + v) + '/' + (trunkFaces[i + 1] + v) + '/' + (trunkFaces[i + 1] + v) +
        ' ' + (trunkFaces[i] + v) + '/' + (trunkFaces[i] + v) + '/' + (trunkFaces[i] + v))
      }
      // back de previous matrix, to not change the original mesh in the scene
      if (globalposition && lastMatrix) {
        mesh[j].bakeTransformIntoVertices(lastMatrix)
      }
      v += curV
    }
    var text = output.join('\n')
    return (text)
  },
  // Exports the material(s) of a mesh in .MTL file format (text)
  // TODO: Export the materials of mesh array
  MTL: function (mesh) {
    var output = []
    for (var j = 0; j < mesh.length; j++) {
      var m = mesh[j].material

      if (m) {
        output.push('newmtl ' + m.id)
        output.push('  Ns ' + (!m.specularPower) ? m.specularIntensity.toFixed(4) : m.specularPower.toFixed(4))
        output.push('  Ni 1.5000')
        output.push('  d ' + m.alpha.toFixed(4))
        output.push('  Tr 0.0000')
        output.push('  Tf 1.0000 1.0000 1.0000')
        output.push('  illum 2')
        output.push('  Ka ' + m.ambientColor.r.toFixed(4) + ' ' + m.ambientColor.g.toFixed(4) + ' ' + m.ambientColor.b.toFixed(4))
        if (m.diffuseColor) {
          output.push('  Kd ' + m.diffuseColor.r.toFixed(4) + ' ' + m.diffuseColor.g.toFixed(4) + ' ' + m.diffuseColor.b.toFixed(4))
        }
        else {
          output.push('  Kd ' + m.albedoColor.r.toFixed(4) + ' ' + m.albedoColor.g.toFixed(4) + ' ' + m.albedoColor.b.toFixed(4))
        }
        
        if (m.specularColor) {
          output.push('  Ks ' + m.specularColor.r.toFixed(4) + ' ' + m.specularColor.g.toFixed(4) + ' ' + m.specularColor.b.toFixed(4))
        }
        
        output.push('  Ke ' + m.emissiveColor.r.toFixed(4) + ' ' + m.emissiveColor.g.toFixed(4) + ' ' + m.emissiveColor.b.toFixed(4))
        // TODO: uv scale, offset, wrap
        // TODO: UV mirrored in Blender? second UV channel? lightMap? reflection textures?
        var uvscale = ''
        if (m.ambientTexture) {
          output.push('  map_Ka ' + uvscale + m.ambientTexture.name)
        }
        if (m.diffuseTexture) {
          output.push('  map_Kd ' + uvscale + m.diffuseTexture.name)
          // TODO: alpha testing, opacity in diffuse texture alpha channel (diffuseTexture.hasAlpha -> map_d)
        }
        else {
          if (m.albedoTexture) {
            output.push('  map_Kd ' + uvscale + m.albedoTexture.name)
          }
        }
        if (m.specularTexture) {
          output.push('  map_Ks ' + uvscale + m.specularTexture.name)
          /* TODO: glossiness = specular highlight component is in alpha channel of specularTexture. (???)
          if (m.useGlossinessFromSpecularMapAlpha)  {
            output.push('  map_Ns '+uvscale + m.specularTexture.name)
          } */
        }
        /* TODO: emissive texture not in .MAT format (???)
        if (m.emissiveTexture) {
          output.push('  map_d '+uvscale+m.emissiveTexture.name)
        } */
        if (m.bumpTexture) {
          output.push('  map_bump -imfchan z ' + uvscale + m.bumpTexture.name)
        }
        if (m.opacityTexture) {
          output.push('  map_d ' + uvscale + m.opacityTexture.name)
        }
        output.push('\n')
      }
    }
    var text = output.join('\n')
    return text
  }
}