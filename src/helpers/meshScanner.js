/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'

export default class MeshScanner {
    constructor(items, options, scene) {
      this.items = items
      this.scene = scene
      this.scannedMeshes = {}
      this.options = options

      this.init()
    }
  
    init () {
      // remove previous scan
      const scanMesh = this.scene.getMeshByName('customScanMesh')
      if (scanMesh) {
        scanMesh.dispose(false, true)
      }

      const parent = new BABYLON.Mesh('parent', this.scene)

      // let originPosition = BABYLON.Vector3.Zero()
      for (let i = 0; i < this.items.length; i++) {
        // originPosition = this.items[i].position.clone()
        this.items[i].parent = parent
        // this.items[i].position = BABYLON.Vector3.Zero() // used for autocreated box only
      }

      // parent.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5)

      const bnds = parent.getHierarchyBoundingVectors(true)
      // const dimensions = [Math.ceil(bnds.max.x), Math.ceil(bnds.max.y), Math.ceil(bnds.max.z)]
      const dimensions = [Math.max(Math.ceil(bnds.max.x), Math.ceil(Math.abs(bnds.min.x))), Math.max(Math.ceil(bnds.max.y), Math.ceil(Math.abs(bnds.min.y))), Math.max(Math.ceil(bnds.max.z), Math.ceil(Math.abs(bnds.min.z)))]
      console.log(dimensions)

      const e1 = Date.now()
      let res = parseFloat(this.options.gridRes)
      const values = this.scanMesh(dimensions, res, (res / 3)) // 0.5 cm - resolution , 0.2 cm - ray
      const e2 = Date.now()
      console.log(((e2-e1) / 1000))
      console.log(JSON.stringify(values))

      for (let i = 0; i < this.items.length; i++) {
        this.items[i].parent = null
        // this.items[i].position = originPosition
        this.items[i].setEnabled(false)
        // this.items[i].visibility = 0.5
      }
    }

    // dimensions of matrix
    // grid resolution - 
    // rayLength - 
    scanMesh (dimensions, gridRes, rayLength) {
      let values = []
      let intersect = false
  
      let m = 0
      for (let k = -dimensions[0]; k <= dimensions[0]; k+= gridRes) {
        values[m] = []
        let n = 0
        for (let j = -dimensions[1]; j <= dimensions[1]; j+= gridRes) {
          values[m][n] = []
          let o = 0
          this.scannedMeshes = {}
          for (let i = -dimensions[2]; i <= dimensions[2]; i+= gridRes) {
            intersect = this.checkIntersection2(k, j, i, rayLength)
            if (intersect === true) {
              values[m][n][o] = 2 // surface
            }
            else {
              let noIntersect = true
              for (var key in this.scannedMeshes) {
                if (this.scannedMeshes.hasOwnProperty(key)) {
                  // console.log(this.scannedMeshes[key])
                  if (this.scannedMeshes[key] !== 0 && this.scannedMeshes[key] % 2 !== 0) {
                    noIntersect = false
                    values[m][n][o] = 0 // exterior
                  }
                }
              }
              if (noIntersect) {
                values[m][n][o] = 1 // interior
              }
            }
            o++
          }
          n++
        }
        m++
      }

      this.addDotsToDebug(values, dimensions, gridRes)
      
      console.log(values)
      return values
    }

    addDotsToDebug (values, dimensions, gridRes) {
      const positions = []
      const colors = []
      let m2 = 0
      for (let k = -dimensions[0]; k <= dimensions[0]; k+= gridRes) {
        let n2 = 0
        for (let j = -dimensions[1]; j <= dimensions[1]; j+= gridRes) {
          let o2 = 0
          for (let i = -dimensions[2]; i <= dimensions[2]; i+= gridRes) {  
            switch (values[m2][n2][o2]) {
              case 2:
                if (parseInt(this.options.view) === 1 || parseInt(this.options.view) === 0) break

                colors.push(1, 0, 0) // BORDER
                positions.push(k, j, i)
                break
              case 1:
                if (parseInt(this.options.view) === 1 || parseInt(this.options.view) === 2) break

                colors.push(0, 1, 0) // OUTSIDE
                positions.push(k, j, i)
                break
              case 0:
                if (parseInt(this.options.view) === 0 || parseInt(this.options.view) === 2) break

                colors.push(0, 0, 1) // INSIDE
                positions.push(k, j, i)
                break
            }
            o2++
          }
          n2++
        }
        m2++
      }
      /*
      var customMesh = new BABYLON.Mesh('customScanMesh', this.scene)
    
      var vertexData = new BABYLON.VertexData()
  
      //Assign positions
      vertexData.positions = positions
      vertexData.colors = colors
  
      //Apply vertexData to custom mesh
      vertexData.applyToMesh(customMesh);
  
      var mat = new BABYLON.StandardMaterial('mat', this.scene)
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1)
      mat.disableLighting = true
      mat.pointsCloud = true
      mat.pointSize = 4
  
      customMesh.material = mat
      */

      var myPositionFunction = function(particle, index) {
        particle.position.x = positions[index]
        particle.position.y = positions[index + 1]
        particle.position.z = positions[index + 2]
        particle.color = new BABYLON.Color4(colors[index],colors[index + 1],colors[index + 2],1)
      }
  
      // model 
      var model = new BABYLON.Mesh.CreateBox("m", 0.1, this.scene)
    
      // SPS creation
      var SPS = new BABYLON.SolidParticleSystem('SPS', this.scene, { isPickable: true })
      SPS.addShape(model, positions.length)
      SPS.buildMesh()
      // dispose the model
      model.dispose()
      
      // SPS init
      SPS.initParticles = function () {
        for (var p = 0; p < SPS.nbParticles; p+=3) {
          myPositionFunction(SPS.particles[p], p)
        }
      }

      SPS.initParticles() // compute particle initial status
      SPS.setParticles() // updates the SPS mesh and draws it
      SPS.refreshVisibleSize() // updates the BBox for pickability
      
      // Optimizers after first setParticles() call
      // This will be used only for the next setParticles() calls
      SPS.computeParticleTexture = false
    }

    scan4 (dimensions, gridRes, rayLength) {
      let values = []
      let intersect = false
  
      let m = 0
      for (let i = -dimensions[2]; i <= dimensions[2]; i+= gridRes) {
        values[m] = []
        let n = 0
        for (let j = -dimensions[1]; j <= dimensions[1]; j+= gridRes) {
          values[m][n] = []
          let o = 0
          this.scannedMeshes = {}
          for (let k = -dimensions[0]; k <= dimensions[0]; k+= gridRes) {
            intersect = this.checkIntersection(k, j, i, rayLength)
            if (intersect === true) {
              values[m][n][o] = 1 // surface
            }
            else {
              let noIntersect = true
              for (var key in this.scannedMeshes) {
                if (this.scannedMeshes.hasOwnProperty(key)) {
                  if (this.scannedMeshes[key] !== 2) {
                    noIntersect = false
                    values[m][n][o] = 1 // interior
                  }
                }
              }
              if (noIntersect) {
                values[m][n][o] = 0 // exterior
              }
            }
            o++
          }
  
          this.scannedMeshes = {}
          for (let k = dimensions[0] + 1; k >= -dimensions[0]; k-= gridRes) {
            intersect = this.checkIntersection(k, j, i, rayLength)
            if (intersect === true) {
              if (values[m][n][o] === 1) {
                values[m][n][o] = 2 // for surface even if it is inside
              }
              else {
                values[m][n][o] = 0 // exterior
              }
            }
            else {
              for (let key in this.scannedMeshes) {
                if (this.scannedMeshes.hasOwnProperty(key)) {
                  if (this.scannedMeshes[key] !== 2) {
                    if (values[m][n][o] === 1) {
                      // const sum = (1 - Math.abs(i) / dimensions[2] + 1 - Math.abs(j) / dimensions[1] + 1 - Math.abs(k) / dimensions[0]) / 3
                      values[m][n][o] = 1 // parseFloat(Number(sum).toFixed(2))
                    }
                    else {
                      values[m][n][o] = 0 // exterior
                    }
                  }
                }
              }
            }
            o--
          }
          n++
        }
        m++
      }
  
      // const pcts = [[10, 45, 80], [0, 0, 0]]
      // const radius = Math.min.apply(Math, dimensions)
      // const maxDist = this.getMaxDist(pcts[0], dimensions)
   
      const positions = []
      const colors = []
      let m2 = 0
      for (let i = -dimensions[2]; i <= dimensions[2]; i+= gridRes) {
        let n2 = 0
        for (let j = -dimensions[1]; j <= dimensions[1]; j+= gridRes) {
          let o2 = 0
          for (let k = -dimensions[0]; k <= dimensions[0]; k+= gridRes) {
            switch (values[m2][n2][o2]) {
              case 2:
                colors.push(1, 0, 0, 1)
                positions.push(k, j, i)
                break
              case 0:
                colors.push(0, 1, 0, 1)
                positions.push(k, j, i)
                break
              default:
                if (values[m2][n2][o2] === 1) {
                  // values[m2][n2][o2] = 0
                  colors.push(0, 0, 1, 1)
                  positions.push(k, j, i)
                  break
                }
  
                // const dist = BABYLON.Vector3.Distance(new BABYLON.Vector3(pcts[0][0], pcts[0][1], pcts[0][2]), new BABYLON.Vector3(k,j,i))
                // values[m2][n2][o2] = parseFloat(Number(1 - dist/ maxDist).toFixed(2))
                /*
                for (let f = 0; f < pcts.length; f++) {
                  const dist = BABYLON.Vector3.Distance(new BABYLON.Vector3(pcts[f][0], pcts[f][1], pcts[f][2]), new BABYLON.Vector3(k,j,i))
                  if (dist <= radius) {
                    values[m2][n2][o2] = parseFloat(Number(1 - dist/ radius).toFixed(2))
                  }
                }
                colors.push(values[m2][n2][o2], values[m2][n2][o2], values[m2][n2][o2], 1)
                positions.push(k, j, i)
                */
            }
            o2++
          }
          n2++
        }
        m2++
      }
  
      var customMesh = new BABYLON.Mesh('custom', this.scene)
    
      var vertexData = new BABYLON.VertexData()
  
      //Assign positions
      vertexData.positions = positions
      vertexData.colors = colors
  
      //Apply vertexData to custom mesh
      vertexData.applyToMesh(customMesh);
  
      var mat = new BABYLON.StandardMaterial('mat', this.scene)
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1)
      mat.disableLighting = true
      mat.pointsCloud = true
      mat.pointSize = 4
  
      customMesh.material = mat
    
      return values
    }
  
    getMaxDist (pct, dimensions) {
      let dists = []
      const vects = [new BABYLON.Vector3(-dimensions[0], -dimensions[1], -dimensions[2]),
        new BABYLON.Vector3(dimensions[0], dimensions[1], dimensions[2]),
        new BABYLON.Vector3(-dimensions[0], dimensions[1], dimensions[2]),
        new BABYLON.Vector3(dimensions[0], -dimensions[1], dimensions[2]),
        new BABYLON.Vector3(dimensions[0], dimensions[1], -dimensions[2]),
        new BABYLON.Vector3(-dimensions[0], -dimensions[1], dimensions[2]),
        new BABYLON.Vector3(-dimensions[0], dimensions[1], -dimensions[2]),
        new BABYLON.Vector3(dimensions[0], -dimensions[1], -dimensions[2])]
  
      for (let i = 0; i < vects.length; i++) {
        dists.push(BABYLON.Vector3.Distance(new BABYLON.Vector3(pct[0], pct[1], pct[2]), vects[i]))
      }
  
      return Math.max.apply(Math, dists)
    }
  
    scan2 (dimensions, gridRes, rayLength) {
      let values = []
      let intersect = false
  
      // let m = 0
      const positions = []
      const colors = []
      for (let i = -dimensions[2]; i <= dimensions[2]; i+= gridRes) {
        // values[m] = []
        // let n = 0
        for (let j = -dimensions[1]; j <= dimensions[1]; j+= gridRes) {
          //values[m][n] = []
          // let o = 0
          this.scannedMeshes = {}
          // let inside = false
          for (let k = -dimensions[0]; k <= dimensions[0]; k+= gridRes) {
            intersect = this.checkIntersection(k, j, i, rayLength)
            // positions.push(k, j, i)
            // console.log(0, 0, k, intersect)
            if (intersect === true) {
              // inside = !inside
              
              // values[m][n][o] = 1
              colors.push(1,0,0,1)
              positions.push(k, j, i)
            }
            else {
              for (var key in this.scannedMeshes) {
                if (this.scannedMeshes.hasOwnProperty(key)) {
                  // console.log(key)
                  if (this.scannedMeshes[key] !== 2) {
                    // console.log('yes')
                    colors.push(1,0,0,1)
                    positions.push(k, j, i)
                  }
                }
              }
            }
            // console.log(inside)
            // o++
          }
          // console.log(this.scannedMeshes)
         //  n++
        }
        // m++
      }
  
      var customMesh = new BABYLON.Mesh('custom', this.scene)
    
      var vertexData = new BABYLON.VertexData()
  
      //Assign positions
      vertexData.positions = positions
      vertexData.colors = colors
  
      //Apply vertexData to custom mesh
      vertexData.applyToMesh(customMesh);
  
      var mat = new BABYLON.StandardMaterial('mat', this.scene)
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1)
      mat.disableLighting = true
      mat.pointsCloud = true
      mat.pointSize = 2
  
      customMesh.material = mat
    
      return values
    }
  
    scan (dimensions, gridRes, rayLength) {
      let values = []
      let intersect = false
  
      let m = 0
      const positions = []
      const colors = []
      for (let i = -dimensions[0]; i <= dimensions[0]; i+= gridRes) {
          values[m] = []
          let n = 0
          for (let j = -dimensions[1]; j <= dimensions[1]; j+= gridRes) {
              values[m][n] = []
              let o = 0
              this.scannedMeshes = {}
              // let inside = false
              for (let k = -dimensions[2]; k <= dimensions[2]; k+= gridRes) {
                  intersect = this.checkIntersection(i, j, k, rayLength)
                  positions.push(i, j, k)
                  // console.log(0, 0, k, intersect)
                  if (intersect === true) {
                    // inside = !inside
                    
                    values[m][n][o] = 1
                    colors.push(1,1,0,1)
                    // positions.push(0, 0, k)
                  }
                  else {
                    values[m][n][o] = 0
                    // if (inside) {
                      // const scMeshes = this.scannedMeshes.map(invoice => invoice.value == 2)
                      // console.log(this.scannedMeshes.length)
                      colors.push(0,1,0,1)
                      // positions.push(0, 0, k)
                    // }
                    // colors.push(0,1,0,1)
                  }
                  // console.log(inside)
                  o++
              }
              n++
          }
          m++
      }
  
      var customMesh = new BABYLON.Mesh('custom', this.scene)
    
      var vertexData = new BABYLON.VertexData()
  
      //Assign positions
      vertexData.positions = positions
      vertexData.colors = colors
  
      //Apply vertexData to custom mesh
      vertexData.applyToMesh(customMesh);
  
      var mat = new BABYLON.StandardMaterial('mat', this.scene)
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1)
      mat.disableLighting = true
      mat.pointsCloud = true
      mat.pointSize = 2
  
      customMesh.material = mat
    
      return values
    }
  
    checkIntersection2 (i, j, k, rayLength) {
                          // new BABYLON.Vector3(1, 0, 0)
      const directions2 = [new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1)]
      const origins2 = [new BABYLON.Vector3(i - rayLength, j, k), new BABYLON.Vector3(i, j - rayLength, k), new BABYLON.Vector3(i, j, k - rayLength)]
      var m = 0
      // for (let m = 0; m < 3; m++) {
        var ray1 = new BABYLON.Ray(origins2[m], directions2[m], 2 * rayLength)
        // BABYLON.RayHelper.CreateAndShow(ray1, this.scene, new BABYLON.Color3(1, 0.1, 1))
        // console.log(m, ray1.direction)
        // var hit = this.scene.pickWithRay(ray1, function (mesh) {
        var hit2 = this.scene.multiPickWithRay(ray1, function (mesh) {
          return (['check', 'ray', 'plane', 'parent'].indexOf(mesh.name) === -1)
        })
  
        if (hit2.length !== 0) {
          for (let n = 0; n < hit2.length; n++) {
            if (this.scannedMeshes[hit2[n].pickedMesh.name]) {
              this.scannedMeshes[hit2[n].pickedMesh.name] += 1
            }
            else {
              this.scannedMeshes[hit2[n].pickedMesh.name] = 1
            }
            // console.log(hit2[n].pickedMesh.name)
          }
          // console.log(this.scannedMeshes)
          return true
        }
        
        // console.log(this.scannedMeshes)
        // const box = new BABYLON.Mesh.CreateBox('check', rayLength, this.scene)
        // box.position = new BABYLON.Vector3(i, j, k)
      // }
      return false
    }

    checkIntersection (i, j, k, rayLength) {
      const directions2 = [new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1)]
      const origins2 = [new BABYLON.Vector3(i - rayLength, j, k), new BABYLON.Vector3(i, j - rayLength, k), new BABYLON.Vector3(i, j, k - rayLength)]
      
      for (let m = 0; m < 3; m++) {
        var ray1 = new BABYLON.Ray(origins2[m], directions2[m], 2 * rayLength)
        // BABYLON.RayHelper.CreateAndShow(ray1, this.scene, new BABYLON.Color3(1, 0.1, 1))
  
        // var hit = this.scene.pickWithRay(ray1, function (mesh) {
        var hit2 = this.scene.multiPickWithRay(ray1, function (mesh) {
          return (['check', 'ray', 'plane','axisX', 'axisY', 'axisZ', 'X', 'Y', 'Z', 'parent', 'shape1', 'shape2'].indexOf(mesh.name) === -1)
        })
  
        // console.log(hit2)
        if (hit2.length !== 0) {
          for (let m = 0; m < hit2.length; m++) {
            if (this.scannedMeshes[hit2[m].pickedMesh.name]) {
              this.scannedMeshes[hit2[m].pickedMesh.name] += 1
            }
            else {
              this.scannedMeshes[hit2[m].pickedMesh.name] = 1
            }
            // console.log(hit2[m].pickedMesh.name)
          }
  
          // const box = new BABYLON.Mesh.CreateBox('check', rayLength, this.scene)
          // box.position = new BABYLON.Vector3(i, j, k)
          return true
        }
      }
      return false
    }

    dispose () {
      this.items = []
      this.scene = null

      delete this
    }
  }