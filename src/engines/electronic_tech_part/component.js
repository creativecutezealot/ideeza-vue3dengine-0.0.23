/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import 'babylonjs-loaders'
import * as Exporter from 'babylonjs-serializers'
import { attachImgToId } from '../../helpers/getImg'
import { GridMaterial } from 'babylonjs-materials'
import { DrawText } from '../general/Utils'

export default class Component {

  /*
  * return loaded meshes
  * url - to import
  * scene - babylonjs scene
  */
  static async import3dObject (url, scene) {
    const decode = await attachImgToId(url, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    let meshes = []
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, scene, null, '.glb')).meshes
      // console.log(meshes)
    }

    meshes[1].setParent(null)
    meshes[0].dispose()
    return meshes[1]
  }

  /*
  * show index of pin on hover pin
  * pin - 3d object
  * visible - show/hide tooltip
  */
  // Obsolete in dev
  static togglePinIndex (pin, visible) {
    const scene = pin._scene
    const split = pin.name.split('_')
    let pinIndex = split[split.length - 1]
    if (pin.metadata && pin.metadata.indexPin) {
      pinIndex = pin.metadata.indexPin
    }

    if (visible) {
      const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', { width: 30, height: 30 }, scene, true)
      dynamicTexture.drawText(pinIndex, 5, 20, 'bold 20px Arial', 'white', 'black', true, true)

      const plane = BABYLON.MeshBuilder.CreatePlane('billboard', { height: 1, width: 1 }, scene, true)
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
      plane.renderingGroupId = 1
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', scene)
      plane.material.backFaceCulling = false
      plane.position = pin.getAbsolutePosition().clone()

      plane.material.diffuseTexture = dynamicTexture

      pin.tooltip = plane
    }
    else {
      if (pin.tooltip) {
        pin.tooltip.dispose(false, true)
        delete pin.tooltip
      }
    }
  }

  /*
  * add tool for material
  * comp - entire package
  */
  static addTooltip (comp) {
    let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')

    let tooltip = new GUI.Rectangle('tooltip')
    tooltip.width = '150px'
    tooltip.height = '120px'
    tooltip.color = 'white'
    tooltip.thickness = 0
    tooltip.horizontalAlignment = 0
    tooltip.verticalAlignment = 0
    tooltip.background = 'transparent'
    tooltip.isVisible = false

    var panel = new GUI.StackPanel();
    panel.width = "100px";
    panel.fontSize = "12px";
    panel.isVertical = true;
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    var textBlock = new GUI.TextBlock();
    textBlock.text = "Color";
    textBlock.height = "20px";
    panel.addControl(textBlock);     

    var picker = new GUI.ColorPicker();
    picker.value = BABYLON.Color3.FromHexString('#555555');
    picker.height = "100px";
    picker.width = "100px";
    picker.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    picker.onValueChangedObservable.add(function(value) { // value is a color3
      comp.changeMat(value);
    });

    panel.addControl(picker);  

    var panel2 = new GUI.StackPanel();
    panel2.width = "50px";
    panel2.fontSize = "12px";
    panel2.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel2.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    var header2 = new GUI.TextBlock();
    header2.text = "Transp";
    header2.height = "20px";
    panel2.addControl(header2); 

    var slider = new GUI.Slider();
    slider.minimum = 0;
    slider.maximum = 1;
    slider.value = 1;
    slider.isVertical = true;
    slider.height = "100px";
    slider.width = "20px";
    slider.onValueChangedObservable.add(function(value) {
      comp.changeOpacity(value);
    });
    panel2.addControl(slider);   

    tooltip.addControl(panel);
    tooltip.addControl(panel2);

    advancedTexture.addControl(tooltip);

    return tooltip
  }

  /*
   * create the schematic shape 
   */
  static createSch (options) {
    const nrOfPins = options.nrOfPins || 2
    const pitch = options.pitch || 0.7
    const size = (nrOfPins * pitch) / 2
    let size2 = 2
    if (size < size2) {
      size2 = size
    }

    const s1 = size2/2 - 0.025
    const s2 = size/2 - 0.025

    // GLOBAL PARENT
    const sc = new BABYLON.TransformNode('sc_root_', options.scene)

    // BODY
    const clickablebody = BABYLON.MeshBuilder.CreatePlane('sc_body', { sideOrientation: BABYLON.Mesh.DOUBLESIDE, size: 1 }, options.scene)
    clickablebody.scaling = new BABYLON.Vector3(size2 - 0.1, size - 0.1, 1)
    clickablebody.position.y = 0.005
    clickablebody.rotation.x = Math.PI / 2
    clickablebody.material = new BABYLON.StandardMaterial('Materialclickablebody', options.scene)
    clickablebody.material.alpha = 0.02
    clickablebody.setParent(sc)

    // OUTLINE BODY
    const path = [[new BABYLON.Vector3(-s1, 0, s2), new BABYLON.Vector3(-s1, 0, -s2)],
      [new BABYLON.Vector3(-s1, 0, -s2), new BABYLON.Vector3(s1, 0, -s2)],
      [new BABYLON.Vector3(s1, 0, -s2), new BABYLON.Vector3(s1, 0, s2)],
      [new BABYLON.Vector3(s1, 0, s2), new BABYLON.Vector3(-s1, 0, s2)]]

    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = this._createLine(path[i][0], path[i][1], 0.05, options.scene)
      lines.push(line)
    }

    let body
    if (lines.length > 0) {
      body = BABYLON.Mesh.MergeMeshes(lines, true)
      body.name = 'sc_layer21'

      body.material = new BABYLON.StandardMaterial('MaterialName', options.scene)
      body.material.diffuseColor = new BABYLON.Color3(1,0,0)
      body.material.specularColor = new BABYLON.Color3(0,0,0)

      body.setParent(sc)
    }

    // NAME1
    const name1 = this.addText({
      scene: options.scene,
      name: 'sc_name2d',
      scaling: new BABYLON.Vector3(size2-0.1, (size-0.1) / 2, 1),
      position: new BABYLON.Vector3(0, 0, (size-0.1) / 4),
      rotation: new BABYLON.Vector3(Math.PI / 2, 0, 0),
      materialName: 'MaterialName1',
      text: options.name2d,
      background: '#ffffff'
    })
    name1.setParent(sc)

    // NAME2
    const name2 = Component.addText({
      scene: options.scene,
      name: 'sc_name',
      scaling: new BABYLON.Vector3(size2-0.1, (size-0.1) / 2, 1),
      position: new BABYLON.Vector3(0, 0, -(size-0.1) / 4),
      rotation: new BABYLON.Vector3(Math.PI / 2, 0, 0),
      materialName: 'MaterialName2',
      text: options.name,
      background: '#ffffff'
    })
    name2.setParent(sc)

    // PINS
    for (let i = 0; i < nrOfPins; i++) {
      var box = BABYLON.MeshBuilder.CreatePlane('sc_pin_' + (i + 1), { sideOrientation: BABYLON.Mesh.DOUBLESIDE, width: 0.1, height: 0.4 }, options.scene)
      box.rotation.x = Math.PI / 2
      box.rotation.y = Math.PI / 2

      const k = parseFloat(nrOfPins / 2)
      if (k % 2 !== 0) {
        box.position.z = (i % k) * pitch - pitch * ((k / 2 < 1) ? 0 : parseInt(k / 2))
      }
      else {
        box.position.z = (i % k) * pitch + pitch / 2 - pitch * (k / 2)
      }

      box.position.x = ((i < k) ? -1 : 1) * ((size2 + 0.4) / 2)
    
      box.material = new BABYLON.StandardMaterial('scMatPin_' + (i + 1), options.scene)
      box.material.diffuseColor = new BABYLON.Color3(1,0,0)
      box.material.specularColor = new BABYLON.Color3(0,0,0)

      box.setParent(sc)

      // NAME2
      const pinPos = box.position.clone()
      pinPos.z += 0.2
      const namePin = Component.addText({
        scene: options.scene,
        name: 'sc_namePin_' + (i + 1),
        scaling: new BABYLON.Vector3(0.4, 0.3, 1),
        position: pinPos,
        rotation: new BABYLON.Vector3(Math.PI / 2, 0, 0),
        materialName: 'MaterialNamePin' + (i + 1),
        text: (i + 1).toString(),
        font: 1,
        background: '#ffffff',
        donotwrap: true
      })
      namePin.setParent(box)
    }
    
    sc.position.y = 0.01

    return sc
  }

  /*
  * add text as dynamicTexture
  * options
  */
  static addText (options) {
    const text = BABYLON.MeshBuilder.CreatePlane(options.name, { sideOrientation: BABYLON.Mesh.DOUBLESIDE, width: options.scaling.x, height: options.scaling.y }, options.scene)
    text.position = options.position || new BABYLON.Vector3(0,0,0)
    text.rotation = options.rotation || new BABYLON.Vector3(0,0,0)
    text.material = new BABYLON.PBRMaterial(options.materialName, options.scene)
    if (options.background === 'transparent') {
      text.material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND
    }
    text.material.metallic = 0
    text.material.roughness = 1

    const texture = new DrawText(this.scene, options.text, {
      color: options.color || '#000000',
      background: options.background,
      invertY: options.invertY || true,
      font: options.font || 0,
      rotation: options.rotationY || -Math.PI / 2,
      scaling: [options.scaling.x, options.scaling.y]
    }, options.donotwrap)
    text.material.albedoTexture = texture
    if (options.background === 'transparent') {
      text.material.opacityTexture = texture
    }
    
    return text
  }
  
  /*
  * create material for glb objects
  * scene - bbjs scene
  * type - type of material metalic or plastic
  * color - color of material, optional
  */
  static createMaterial (scene, type, color = null) {
    const material = new BABYLON.PBRMaterial('material', scene)
    material.sideOrientation = 0

    if (color) {
      material.albedoColor = BABYLON.Color3.FromHexString(color).toLinearSpace()   
    }
    
    switch (type) {
      case 'metalic':
        material.metallic = 1
        material.roughness = 0.2
        break
      case 'plastic':
        material.metallic = 1
        material.roughness = 0.5
        break
    }
    // console.log('uuuuu ', material)
    return material
  }

  /*
  * fit package to canvas dimensions
  * comp (this) - entire package
  */
  static fitToView (comp) {
    const engine = comp.scene.getEngine()
    const objToFit = comp.object3D
    objToFit.computeWorldMatrix(true)
    let radius = objToFit.getBoundingInfo().boundingSphere.radiusWorld
    if (!isFinite(radius)) {
      return
    }
    let aspectRatio = engine.getAspectRatio(comp.scene.activeCamera)
    let halfMinFov = comp.scene.activeCamera.fov / 2
    if (aspectRatio < 1) {
      halfMinFov = Math.atan(aspectRatio * Math.tan(comp.scene.activeCamera.fov / 2))
    }
    let viewRadius = Math.abs(radius / Math.sin(halfMinFov))
    comp.scene.activeCamera.lowerRadiusLimit = comp.scene.activeCamera.upperRadiusLimit = comp.scene.activeCamera.radius = viewRadius
  }

  /*
  * show 2d object, hide 3d
  * comp (this) - entire package
  * value - show/hide
  */
  static To2D (comp, value) {
    // engine.resize()
    comp.scene.activeCamera.alpha = -Math.PI / 2
    comp.scene.activeCamera.beta = 0
    comp.scene.activeCamera.radius = 10
    // comp.scene.activeCamera.detachControl(canvas)

    if (comp.dn) {
      comp.dn.setEnabled(value)
    }
  }

  /*
  * show 3d object, hide 2d
  * comp (this) - entire package
  * value - show/hide
  */
  static To3D (comp, value) {
    // engine.resize()
    comp.scene.activeCamera.alpha = -Math.PI / 2
    comp.scene.activeCamera.beta = 0
    comp.scene.activeCamera.radius = 10
    // comp.scene.activeCamera.attachControl(canvas, false)

    if (comp.td) {
      comp.td.setEnabled(value)
    }
  }

  /*
  * show 2d object, hide 3d
  * comp (this) - entire package
  * value - show/hide
  */
  static ToSchematic (comp, value) {
    // engine.resize()
    comp.scene.activeCamera.alpha = -Math.PI / 2
    comp.scene.activeCamera.beta = 0
    comp.scene.activeCamera.radius = 10
    // comp.scene.activeCamera.detachControl(canvas)

    if (comp.sc) {
      comp.sc.setEnabled(value)
    }
  }

  /*
  * return a blob for saveing package
  * comp (this) - entire package
  */
  static async save3D (comp) {
    Component.To3D(comp, true)
    Component.To2D(comp, true)
    Component.ToSchematic(comp, true)

    const scene = comp.scene

    // 3d object
    let options = {
      shouldExportNode : (transformNode) => {
        return (transformNode.name.indexOf('td_') !== -1)
      }
    }
    const glblob = await Exporter.GLTF2Export.GLBAsync(scene, '3dobject', options)
    
    // 2d object
    let options2 = {
      shouldExportNode : (transformNode) => {
        return (transformNode.name.indexOf('dn_') !== -1)
      }
    }
    const glblob2 = await Exporter.GLTF2Export.GLBAsync(scene, '2dobject', options2)

    // schematic object
    let options3 = {
      shouldExportNode : (transformNode) => {
        return (transformNode.name.indexOf('sc_') !== -1)
      }
    }
    const glblob3 = await Exporter.GLTF2Export.GLBAsync(scene, 'schematic', options3)

    // Component.doDownload('3dobject.glb', glblob.glTFFiles['3dobject.glb'])
    // Component.doDownload('2dobject.glb', glblob2.glTFFiles['2dobject.glb'])
    // Component.doDownload('schematic.glb', glblob3.glTFFiles['schematic.glb'])

    return [glblob.glTFFiles['3dobject.glb'], glblob2.glTFFiles['2dobject.glb'], glblob3.glTFFiles['schematic.glb']]
  }

  /*
  * download the package
  * filename (string) - name of package
  * blob (blob)
  */
  static doDownload (filename, blob) {
    var objectUrl = (window.webkitURL || window.URL).createObjectURL(blob)

    var link = window.document.createElement('a')
    link.href = objectUrl
    link.download = filename
    var click = document.createEvent('MouseEvents')
    click.initEvent('click', true, false)
    link.dispatchEvent(click)

    window.URL.revokeObjectURL(objectUrl)
  }

  /*
  * dispose entire engine from packages
  * comp (this) - entire package
  */
  static disposeEngine (comp) {
    let _engine = null
    if (comp.tooltip) {
      comp.tooltip.dispose()
    }
    if (comp.scene) {
      _engine = comp.scene.getEngine()
      for (let i = comp.scene.meshes.length - 1; i >= 0; i--) {
        if (comp.scene.meshes[i]) {
          comp.scene.meshes[i].dispose(false, true)
        }
      }
      comp.scene.dispose()
      delete comp.scene
    }
    if (_engine) {
      _engine.stopRenderLoop()
      _engine.clear(BABYLON.Color3.White(), true, true, true)
      _engine.dispose()
    }
  }

  /*
  * return a 3d object result from subtracting 2 different meshes
  * mesh1 (BABYLON.Mesh) - biger mesh, from this is subtracted second mesh
  * mesh2 (BABYLON.Mesh) - smaler mesh, this is subtracted from first mesh
  * scene - babylonjs scene
  */
  static _createHoles (mesh1, mesh2, scene) {
    const name = mesh1.name
    const innerCSG = BABYLON.CSG.FromMesh(mesh2)
    const outerCSG = BABYLON.CSG.FromMesh(mesh1)

    mesh1.dispose()
    mesh2.dispose()

    const subCSG = outerCSG.subtract(innerCSG)

    scene.removeMesh(innerCSG)
    scene.removeMesh(outerCSG)

    mesh1 = subCSG.toMesh(name, null, scene)
    scene.removeMesh(subCSG)

    return mesh1
  }

  /*
  * return a 3d object (a line) from point p1 to point p2 with width of width
  * p1 (BABYLON.Vector3) - begin point
  * p2 (BABYLON.Vector3) - end point
  * width (float) - width of line
  * scene - babylonjs scene
  */
  static _createLine (p1, p2, width, scene) {
    var line = BABYLON.MeshBuilder.CreatePlane('footprint', {height: 1, width: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene)
    var dist = parseFloat(Number(BABYLON.Vector3.Distance(p1, p2)).toFixed(2))
    var rotAngle = Math.atan((p1.x - p2.x) / (p1.z - p2.z))

    line.position = BABYLON.Vector3.Center(p1, p2)
    line.rotation = new BABYLON.Vector3(Math.PI / 2, rotAngle + Math.PI / 2, 0)
    line.scaling.y = width
    line.scaling.x = dist + width / 2

    return line
  }

  /*
  * return a 3d shape with dimension specified
  * typeofShape (int) - type of shape 0 - plane/rectangle, 1 - circle/cylinder
  * width : object width
  * depth : object depth
  * height : object height
  * scene - babylonjs scene
  * ! - for cylinder/circle width and depth should be the same
  */
  static _create2DShape (typeofShape, width, depth, height, scene) {
    switch (typeofShape) {
      case 0:
        var faceUV = new Array(6)
        for (let i = 0; i < 6; i++) {
          faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0)
        }
        faceUV[4] = new BABYLON.Vector4(0, 0, 1, 1)
        faceUV[5] = new BABYLON.Vector4(0, 0, 1, 1)
    
        var options = {
          width: width,
          height: height,
          depth: depth,
          faceUV: faceUV
        }

        return BABYLON.MeshBuilder.CreateBox('pin', options, scene)
      case 1:
        var faceUV2 = new Array(6)
        for (let i = 0; i < 6; i++) {
          faceUV2[i] = new BABYLON.Vector4(0, 0, 0, 0)
        }
        faceUV2[0] = new BABYLON.Vector4(0, 0, 1, 1)
    
        var options2 = {
          diameterTop: width,
          diameterBottom: depth,
          height: height,
          tessellation: 32,
          faceUV: faceUV2
        }

        return BABYLON.MeshBuilder.CreateCylinder('pin', options2, scene)
    }
  }

  /*
  * return a single 3d object used as footprint
  * meshes (array) - all meshes need for create 2d footprint
  * scene - babylonjs scene
  */
  static _get2DFootprint (meshes, scene) {
    var mat1 = new BABYLON.PBRMaterial('mat1', scene)
    mat1.albedoColor = BABYLON.Color3.FromHexString('#f5f5f5').toLinearSpace()   
    mat1.metallic = 1
    mat1.roughness = 0.2
    var mat2 = new BABYLON.PBRMaterial('mat2', scene)
    mat2.albedoColor = BABYLON.Color3.FromHexString('#adadad').toLinearSpace() 
    mat2.metallic = 1
    mat2.roughness = 0.2

    var multimat = new BABYLON.MultiMaterial('MaterialLayer1', scene)
    multimat.subMaterials.push(mat1)
    multimat.subMaterials.push(mat2)

    const box = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, true)
    // box.metadata = { isFootprint: true }
    box.material = multimat
    // box.material = mat1
    for (let i = 0; i < box.subMeshes.length; i++) {
      if (i % 2 === 0) {
        box.subMeshes[i].materialIndex = 1
      }
    }

    return box
  }

  /*
  * show some 3d objects based on arrays send to moshe, and axis
  * axisLength (float) - length of axis
  * layer1 (array) - layer1 from package
  * layer21 (array) - layer21 from package
  * size3D (array) - x,y,z values
  * size2D (array) - x,z values
  * scene - babylonjs scene
  */
  static _showMarkers (axisLength, layer1, layer21, size3D, size2D, Ypos, Yrot, scene) {
    Component._showAxis(axisLength, scene)
    if (layer1 && layer1.length !== 0) {
      const path3 = layer1[1]
      for (let i = 0; i < path3.length; i++) {
        const box = BABYLON.Mesh.CreateBox('box' + i, 1, scene)
        box.metadata = { marker: true }
        if (path3[i][0] === 0) {
          box.scaling = new BABYLON.Vector3(path3[i][3], 0.01, path3[i][4])
        }
        else {
          box.scaling = new BABYLON.Vector3(path3[i][3], 0.01, path3[i][3])
        }
        box.position = new BABYLON.Vector3(path3[i][1], 0, path3[i][2])
      }
    }
    
    if (layer21 && layer21.length !== 0) {
      const path2 = layer21[1]
      let path = []
      for (let i = 0; i < path2.length; i++) {
        path.push([new BABYLON.Vector3(path2[i][0], 0, path2[i][1]), new BABYLON.Vector3(path2[i][2], 0, path2[i][3])])
      }

      for (let i = 0; i < path.length; i++) {
        const box = Component._createLine(path[i][0], path[i][1], 0.05, scene)
        box.metadata = { marker: true }
      }
    }

    if (size3D && size3D.length !== 0) {
      const points = [new BABYLON.Vector3(-size3D[0] / 2, 0, -size3D[2] / 2),
        new BABYLON.Vector3(size3D[0] / 2, 0, size3D[2] / 2),
        new BABYLON.Vector3(-size3D[0] / 2, 0, size3D[2] / 2),
        new BABYLON.Vector3(size3D[0] / 2, 0, -size3D[2] / 2)
      ]

      for (let i = 0; i < points.length; i++) {
        const box = BABYLON.Mesh.CreateSphere('sphere' + i, 16, 0.05, scene)
        box.metadata = { marker: true }
        box.position = points[i]
        box.material = new BABYLON.StandardMaterial('std', scene)
        box.material.diffuseColor = BABYLON.Color3.Red()
      }
    }

    if (size2D && size2D.length !== 0) {
      const points2 = [new BABYLON.Vector3(-size2D[0] / 2, 0, -size2D[1] / 2),
        new BABYLON.Vector3(size2D[0] / 2, 0, size2D[1] / 2),
        new BABYLON.Vector3(-size2D[0] / 2, 0, size2D[1] / 2),
        new BABYLON.Vector3(size2D[0] / 2, 0, -size2D[1] / 2)
      ]

      for (let i = 0; i < points2.length; i++) {
        const box = BABYLON.Mesh.CreateBox('box2' + i, 0.05, scene)
        box.metadata = { marker: true }
        box.position = points2[i]
        box.material = new BABYLON.StandardMaterial('std2', scene)
        box.material.diffuseColor = BABYLON.Color3.Blue()
      }
    }

    // create a grid
    const board = new BABYLON.Mesh.CreateGround('name2d', 10, 10, 4, scene)
    board.metadata = { marker: true }
    board.material = new GridMaterial('material', scene)
    board.material.backFaceCulling = false
    board.material.majorUnitFrequency = 0.2
    board.material.gridRatio = 0.2
    board.material.mainColor = BABYLON.Color3.Black()
    board.material.lineColor = BABYLON.Color3.White()
    if (Yrot !== 0) {
      board.position.z = Ypos
      board.rotation.x = -Yrot * Math.PI / 180
    }
    else {
      board.position.y = -Ypos
    }
  }

  /*
  * hide some 3d objects based on arrays send to moshe, and axis
  * scene - babylonjs scene
  */
  static _hideMarkers(scene) {
    for (let i = scene.meshes.length - 1; i >= 0; i--) {
      if (scene.meshes[i].metadata && scene.meshes[i].metadata.marker) {
        scene.meshes[i].dispose(false, true)
      }
    }
  }

  /*
  * create axis
  * size (float) - length of axis
  * scene - babylonjs scene
  */
  static _showAxis (size, scene) {
    var makeTextPlane = function (text, color, size) {
      var dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, scene, true)
      dynamicTexture.hasAlpha = true
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true)
      var plane = new BABYLON.Mesh.CreatePlane('TextPlane', size, scene, true)
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', scene)
      plane.material.backFaceCulling = false
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0)
      plane.material.diffuseTexture = dynamicTexture
      return plane
    }

    var axisX = BABYLON.Mesh.CreateLines('axisX', [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], this.scene)
    axisX.metadata = { marker: true }
    axisX.color = new BABYLON.Color3(1, 0, 0)
    var xChar = makeTextPlane('X', 'red', size / 10)
    xChar.metadata = { marker: true }
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0)
    var axisY = BABYLON.Mesh.CreateLines('axisY', [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], this.scene)
    axisY.metadata = { marker: true }
    axisY.color = new BABYLON.Color3(0, 1, 0)
    var yChar = makeTextPlane('Y', 'green', size / 10)
    yChar.metadata = { marker: true }
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size)
    var axisZ = BABYLON.Mesh.CreateLines('axisZ', [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], this.scene)
    axisZ.metadata = { marker: true }
    axisZ.color = new BABYLON.Color3(0, 0, 1)
    var zChar = makeTextPlane('Z', 'blue', size / 10)
    zChar.metadata = { marker: true }
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size)
  }

  /*
  * upload custom body
  * comp (this) - entire package
  * event - upload event
  */
  static uploadCustomBody (comp, event) {
    const scene = comp.scene
    const engine = scene.getEngine()

    // OBJFileLoader.OPTIMIZE_WITH_UV = true
    BABYLON.FilesInput.FilesToLoad = []
    var filesInput = new BABYLON.FilesInput(engine, null, null, null, null, null, function () { BABYLON.Tools.ClearLogCache() }, function () {}, null)
    filesInput.onProcessFileCallback = (function (file, name, extension) {
      BABYLON.FilesInput.FilesToLoad[name] = file
      if (['obj', 'STL', 'stl'].includes(extension)) {
        let ext = '.obj'
        if (name.indexOf('.stl') !== -1 || name.indexOf('.STL') !== -1) {
          ext = '.stl'
        }

        BABYLON.SceneLoader.ImportMesh('', 'file:', file.correctName, scene, function(loadedMeshes) {
          for (let i = 0; i < loadedMeshes.length; i++) {
            if (loadedMeshes[i].name.indexOf('body') !== -1) {
              console.log('body', loadedMeshes[i])
            }
            else {
              if (loadedMeshes[i].name.indexOf('pin') !== -1) {
                console.log('pin', loadedMeshes[i])
              }
              else {
                console.log('different mesh', loadedMeshes[i])
              }
            }
          }
        }, null, null, ext)
      }
    })

    filesInput.loadFiles(event)
  }

  /*
  * return 2 blobs for saveing package electronic and cover
  * comp (this) - entire package
  */
  static save_both (comp) {
    if (comp.object3D) {
      const kid = comp.object3D
      kid.isVisible = true
      const kids = kid.getChildren()
      for (let i = 0; i < kids.length; i++) {
        kids[i].setEnabled(true)
      }
      kids[kids.length - 1].isVisible = false

      var myser = BABYLON.SceneSerializer.SerializeMesh(comp.object3D, false, true)
      var jsonData = JSON.stringify(myser)

      // Component.doDownload('part.babylon', new Blob([jsonData], { type: 'octet/stream' }))
      return [new Blob([jsonData], { type: 'octet/stream' }), new Blob([jsonData], { type: 'octet/stream' })]
    }
  }
}
