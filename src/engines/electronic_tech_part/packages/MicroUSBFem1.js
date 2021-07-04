/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from '../component'
import { DrawText } from '../../general/Utils'

export default class MicroUSBFem1 {
  constructor(scene, metadata) {
    this.scene = scene
    this.metadata = metadata

    // for nr of legs
    this.metadata['pinsNr'] = 0

    // for positioning and rotation on addComponent
    this.metadata['transform'] = {
      'position': [0,0,0],  // position 3d
      'rotation': [0,0,0],  // rotation 3d
      'pivot': [0,0],       // bottom left corner, need for placement
      'best_p': [0,0,0,0],  // position2d.x, position2d.y, rotation.y, layer
      'best_sc': [0,0,0]    // position2d.x, position2d.y, rotation.y - for schematic
    }

    // footrint settings
    this.footPrint = {
      bodyPlus: 0.05,
      shadowPlus: 0.05,
      pinWidthPlus: 0.05,
      pinLengthPlus: 0.05,
      resolution: 16
    }

    // used to scale electronic data
    this.startedPin = null
    this.path2d = null

    this.body = null
    this.pins = []
    this.layer1 = null
    this.layer21 = null

    this.name = null
    this.name2d = null
    this.sc = null
    
    this.selected = null
    this.tooltip = null
    
    this.assets = []
    
    this._init()
  }

  async _init () {
    // load 3d objects
    await this._load3dObjects()

    if (Object.keys(this.metadata).length <= 3) {
      console.log('%c Not enought data ', 'background: #222; color: #bada55')
      return
    }

    // update body and pins
    this._updatePackage()

    // show 3d / hide 2d and schematic by default on init
    this.view3D(true)
    this.view2D(false)
    this.viewSchematic(false)

    this.tooltip = Component.addTooltip(this)
  }

  async _load3dObjects () {
    ////// body ////////
    const body = await Component.import3dObject('user-4cf2d69a60c44719933544489fe586ea.glb', this.scene)
    if (!body) {
      console.log('Error on import body')
    }

    body.name = body.id = 'assets'
    body.isVisible = false
    body.rotationQuaternion = null
    if (body.material) {
      body.material.dispose()
    }

    this.assets.push(body)
    ////// body ////////

    ////// pins ////////
  }

  _updatePackage () {
    // console.log(this.metadata, this.assets)
    this._updateBody()
    this._updatePins()
  
    // console.log(this.scene.meshes.length, this.scene.materials.length, this.scene.textures.length)

    // rebuild electronic data
    this._getElectronicData()
    this._updateSchematic()
  }

  _updateSchematic () {
    if (this.sc) {
      this.sc.dispose(false, true)
    }

    this.sc = Component.createSch({
      scene: this.scene,
      nrOfPins: this.pins.length,
      pitch: 0.7,
      name2d: this.metadata['name2d'],
      name: this.metadata['name']
    })
  }

  _updateBody () { 
    if (this.assets.length === 0) {
      return
    }
   
    if (this.body) {
      this.body.dispose(false, true)
    }

    const body = this.assets[0].clone('Body')
    body.isVisible = true
    body.name = body.id = 'Body'
    body.material = Component.createMaterial(this.scene, 'plastic', '#555555')
    body.material.name = body.material.id = 'MaterialBody'
    this.body = body

    // show menu for material
    const _this = this
    body.actionManager = new BABYLON.ActionManager(this.scene)
    body.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (evt) => {
      _this.selected = evt.source
      _this.tooltip.isVisible = !_this.tooltip.isVisible
    }))

    if (this.name) {
      this.name.dispose(false, true)
    }
    
    this.name = new BABYLON.Mesh.CreateGround('decal', 4, 4, 4, this.scene)
    this.name.material = Component.createMaterial(this.scene, 'plastic')
    this.name.material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND
    this.name.material.name = this.name.material.id = 'MaterialName'
    this.name.material.sideOrientation = 1
    this.name.material.zOffset = -2
    const texture = new DrawText(this.scene, this.metadata['name'], {
      color: '#ffffff',
      background: 'transparent',
      invertY: true,
      font: this.metadata['nameFontSize'] || 0,
      rotation: -Math.PI / 2
    })
    this.name.material.albedoTexture = texture
    this.name.material.opacityTexture = texture
    this.name.setParent(this.body)
    this.name.position.y = 0.125
    this.name.position.z = -0.05
  }

  _updatePins () {
    if (this.assets.length === 0) {
      return
    }

    for (let i = 0; i < this.pins.length; i++) {
      this.pins[i].dispose(false, true)
    }
    this.pins = []

    const arrayPos = [[-1.3, 1.375, 0.2, 1.15], [-0.65, 1.375, 0.2, 1.15], [0, 1.375, 0.2, 1.15], [0.65, 1.375, 0.2, 1.15], [1.3, 1.375, 0.2, 1.15]]
    for (let i = 0; i < arrayPos.length; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(`Pin_` + this.pins.length, { width: arrayPos[i][2], depth: arrayPos[i][3], height: 0.1 }, this.scene)
      
      box.position.y = -1.3
      box.position.x = arrayPos[i][0]
      box.position.z = arrayPos[i][1]

      box.material = Component.createMaterial(this.scene, 'metalic', '#f5f5f5')
      box.material.sideOrientation = 1

      // add action manager for hover
      const _this = this
      box.actionManager = new BABYLON.ActionManager(this.scene)
      box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (evt) => {
        Component.togglePinIndex(evt.source, true)
      }))
      box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, (evt) => {
        Component.togglePinIndex(evt.source, false)
      }))

      // show menu for material
      box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (evt) => {
        _this.selected = evt.source
        _this.tooltip.isVisible = !_this.tooltip.isVisible
      }))

      if (i === 0) {
        // this.startedPin = box
      }

      this.pins.push(box)
    }

    const arrayPos2 = [[-3.2, 1.15, 1.4, 1.2], [3.2, 1.15, 1.4, 1.2], [-3.425, -1.3, 1.25, 1.1], [3.425, -1.3, 1.25, 1.1], [-1.2, -1.3, 1.7, 1.7], [1.2, -1.3, 1.7, 1.7]]
    for (let i = 0; i < arrayPos2.length; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(`Pin_` + this.pins.length, { width: arrayPos2[i][2], depth: arrayPos2[i][3], height: 0.1 }, this.scene)
    
      box.position.y = -1.3
      box.position.x = arrayPos2[i][0]
      box.position.z = arrayPos2[i][1]
      console.log(' box ', box, i)
      box.material = Component.createMaterial(this.scene, 'metalic', '#f5f5f5')
      box.material.sideOrientation = 1

      // add action manager for hover
      const _this = this
      box.actionManager = new BABYLON.ActionManager(this.scene)
      box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (evt) => {
        Component.togglePinIndex(evt.source, true)
      }))
      box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, (evt) => {
        Component.togglePinIndex(evt.source, false)
      }))

      // show menu for material
      box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (evt) => {
        _this.selected = evt.source
        _this.tooltip.isVisible = !_this.tooltip.isVisible
      }))

      this.pins.push(box)
    }

    this._sortPins()
    this._resortOnClick()

    for (let i = 0; i < this.pins.length; i++) {
      this.pins[i].name = this.pins[i].id = `Pin_` + (i + 1)
      this.pins[i].material.name = this.pins[i].material.id = 'MaterialPin_' + i
    }

    this.metadata['pinNumber'] = this.pins.length
  }

  _createLayer1 () {
    if (this.pins.length === 0 || !this.body) {
      return
    }

    if (this.layer1) {
      this.layer1.dispose(false, true)
    }

    // let meshes = []

    this.layer1 = new BABYLON.AbstractMesh("Layer1", this.scene)
    this.layer1.name = this.layer1.id = 'Layer1'

    const totalPins = this.pins.length
    
    for (let i = 0; i < totalPins; i++) {
      const bbInfo = this.pins[i].getBoundingInfo().boundingBox.extendSize
      const width = parseFloat(bbInfo.x * 2)
      const length = parseFloat(bbInfo.z * 2)
      this.pins[i].metadata = {
        Fwidth: (width + this.footPrint.pinWidthPlus + this.footPrint.shadowPlus),
        Flength: (length + this.footPrint.pinLengthPlus + this.footPrint.shadowPlus)
      }
  
      // shadows
      let box1 = Component._create2DShape(0, width + this.footPrint.pinWidthPlus + this.footPrint.shadowPlus, length + this.footPrint.pinLengthPlus + this.footPrint.shadowPlus, 0.001, this.scene)
      const box2 = Component._create2DShape(0, width + this.footPrint.pinWidthPlus, length + this.footPrint.pinLengthPlus, 0.001, this.scene)
      box1 = Component._createHoles(box1, box2, this.scene)
      
      const pos = this.pins[i].getAbsolutePosition()
      box1.position = pos.clone()
      box1.position.y = 0
      box1.rotation.y = this.pins[i].rotation.y

      this.pins[i].metadata['position'] = box1.position.clone()
     
      var mat1 = new BABYLON.PBRMaterial('mat1', this.scene)
      mat1.albedoColor = BABYLON.Color3.FromHexString('#adadad').toLinearSpace()   
      mat1.metallic = 1
      mat1.roughness = 0.2
      box1.material = mat1
      box1.name = box1.id = 'Layer1_primitive0' + i
      box1.parent = this.layer1

      // meshes.push(box1)

      // PINS
      const box3 = Component._create2DShape(0, width + this.footPrint.pinWidthPlus, length + this.footPrint.pinLengthPlus, 0.001, this.scene)

      box3.position = box1.position.clone()
      box3.rotation.y = box1.rotation.y

      var mat2 = new BABYLON.PBRMaterial('mat2', this.scene)
      mat2.albedoColor = BABYLON.Color3.FromHexString('#f5f5f5').toLinearSpace() 
      mat2.metallic = 1
      mat2.roughness = 0.2
      box3.material = mat2
      box3.name = box3.id = 'Layer1_primitive1' + i
      box3.parent = this.layer1

      // meshes.push(box3)
    }

    
    // this.layer1 = Component._get2DFootprint(meshes, this.scene)
    // this.layer1.name = this.layer1.id = 'Layer1'

    // meshes = []
    this.layer1.position.y = 0
  }

  _createLayer21 () {
    if (this.pins.length === 0 || !this.body) {
      return
    }

    if (this.layer21) {
      this.layer21.dispose(false, true)
    }

    const parent = new BABYLON.AbstractMesh('parent', this.scene)
    
    // calculate size of part for layer21
    this.body.setParent(parent)
    this.layer1.setParent(parent)

    let bnds = parent.getHierarchyBoundingVectors(true)
    const dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]

    this.metadata['size'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[1]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]

    const x = dimensions[0] / 2
    const z = dimensions[2] / 2
    
    let silks = []
    const path = [[new BABYLON.Vector3(-x, 0, z), new BABYLON.Vector3(-x, 0, -z)],
      [new BABYLON.Vector3(-x, 0, -z), new BABYLON.Vector3(x, 0, -z)],
      [new BABYLON.Vector3(x, 0, -z), new BABYLON.Vector3(x, 0, z)],
      [new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(-x, 0, z)]]

    this.path2d = path
    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = Component._createLine(path[i][0], path[i][1], 0.05, this.scene)
      lines.push(line)
    }

    if (lines.length > 0) {
      silks.push(BABYLON.Mesh.MergeMeshes(lines, true))
    }

    if (silks.length > 0) {
      this.layer21 = BABYLON.Mesh.MergeMeshes(silks, true)
      this.layer21.name = this.layer21.id = 'Layer21'
      this.layer21.material = new BABYLON.PBRMaterial('MaterialLayer21', this.scene)
      this.layer21.material.albedoColor = BABYLON.Color3.White()
      this.layer21.material.reflectivityColor = new BABYLON.Color3(0.2,0.2,0.2)
      this.layer21.material.microSurface = 0.3
      this.layer21.position.y = 0
    }

    this.body.setParent(null)
    this.layer1.setParent(null)
    parent.dispose()

    //add name2d
    this.name2d = new BABYLON.Mesh.CreateGround('name2d', 1, 1, 4, this.scene)
    this.name2d.material = Component.createMaterial(this.scene, 'plastic')
    this.name2d.material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND
    this.name2d.material.name = this.name2d.material.id = 'MaterialName2d'
    this.name2d.material.sideOrientation = 1
    const texture = new DrawText(this.scene, this.metadata['name2d'], {
      color: '#ffffff',
      background: 'transparent',
      invertY: true,
      font: this.metadata['nameFontSize'] || 0,
      rotation: -Math.PI / 2
    })
    this.name2d.material.albedoTexture = texture
    this.name2d.material.opacityTexture = texture

    this.name2d.setParent(this.layer21)
    // console.log(this.name2d)
  }

  _getElectronicData () {
    this.metadata['size'] = []
    this.metadata['sizeL1'] = []
    this.metadata['Fsize'] = []
    this.metadata['layer1'] = []
    this.metadata['layer21'] = []

    this._createLayer1()
    this._createLayer21()
    this._addFSize()
    
    const pins = this.pins
    if (pins.length === 0) {
      return
    }

    let arrayPins = []
    let arrayPins2 = []

    const x = this.metadata['size'][0] / 2
    const z = this.metadata['size'][2] / 2

    let diff = new BABYLON.Vector3(0, 0, 0)
    if (this.startedPin) {
      diff = new BABYLON.Vector3(parseFloat(Number(this.startedPin.metadata['position'].x + x - this.startedPin.metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(this.startedPin.metadata['position'].z + z - this.startedPin.metadata.Flength / 2).toFixed(4)))
    }

    this.metadata.transform['pivot'] = [-(x - diff.x), -(z - diff.z)]
 
    for (let i = 0; i < pins.length; i++) {
      arrayPins.push([0, parseFloat(Number(pins[i].metadata['position'].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(pins[i].metadata['position'].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(this.footPrint.resolution)), parseFloat(Number(pins[i].metadata.Flength).toFixed(this.footPrint.resolution)), 0])
    }

    const path = this.path2d
    arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[0][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[0][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[0][1].z + z - diff.z).toFixed(this.footPrint.resolution)), 0.05, 0],
      [parseFloat(Number(path[1][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[1][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[1][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[1][1].z + z - diff.z).toFixed(this.footPrint.resolution)), 0.05, 0],
      [parseFloat(Number(path[2][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[2][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[2][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[2][1].z + z - diff.z).toFixed(this.footPrint.resolution)), 0.05, 0],
      [parseFloat(Number(path[3][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[3][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[3][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[3][1].z + z - diff.z).toFixed(this.footPrint.resolution)), 0.05, 0]]

    this.metadata['layer1'] = ['Layer 1', arrayPins]
    this.metadata['layer21'] = ['Layer 21', arrayPins2]

    for (let i = 0; i < this.scene.meshes.length; i++) {
      console.log(i, this.scene.meshes[i].name, this.scene.meshes[i].id)
    }
    console.log(this.metadata)
    console.log('size', JSON.stringify(this.metadata['size']))
    console.log('Fsize', JSON.stringify(this.metadata['Fsize']))
    console.log('sizeL1', JSON.stringify(this.metadata['sizeL1']))
    console.log('layer1', JSON.stringify(this.metadata['layer1']))
    console.log('layer21', JSON.stringify(this.metadata['layer21']))
  }

  _addFSize () {
    if (this.pins.length === 0) {
      return
    }

    const parent = new BABYLON.AbstractMesh('parent', this.scene)

    this.layer1.setParent(parent)
    this.layer21.setParent(parent)

    // calculate size of entire part
    let bnds = parent.getHierarchyBoundingVectors(true)
    let dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]

    this.metadata['Fsize'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]

    this.layer21.setParent(null)

    // calculate size of layer1   
    bnds = parent.getHierarchyBoundingVectors(true)
    dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]

    this.metadata['sizeL1'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]
    
    this.layer1.setParent(null)

    parent.dispose()

    const height = -1.375
    this.layer1.position.y = height + 0.01
    this.layer21.position.y = height + 0.01
  
    this.metadata['transform']['position'][1] = -height 
  }

  _resortOnClick () {
    // console.log(this.metadata['PinStartAt'])
    let sortPins = []
    let auxPinsArray = []
    for (let i = 0; i < this.pins.length; i++) {
      if (i >= (this.metadata['PinStartAt'] - 1)) {
        sortPins.push(this.pins[i])
      }
      else {
        auxPinsArray.push(this.pins[i])
      }
    }

    if (auxPinsArray.length > 0) {
      sortPins = sortPins.concat(auxPinsArray)
    }
    this.pins = sortPins
  }

  _sortPins () {
    if (this.metadata.isClockwise) {
      this.pins.reverse()
    }
  }

  view2D (param) {
    Component.To2D(this, param)
  }

  view3D (param) {
    Component.To3D(this, param)
  }

  viewSchematic (param) {
    Component.ToSchematic(this, param)
  }
  
  checkPosition (param) {
    if (param) {
      Component._showMarkers(5, this.metadata['layer1'], this.metadata['layer21'], this.metadata['size'], this.metadata['sizeL1'], this.metadata['transform']['position'][1], this.metadata['transform']['rotation'][0], this.scene)
    }
    else {
      Component._hideMarkers(this.scene)
    }
  }
  
  save3D () {
    return Component.save3D(this)
  }

  getData () {
    return this.metadata
  }

  disposeEngine () {
    Component.disposeEngine(this)
  }

  updateObject (json) {
    for (let key in json) {
      this.metadata[key] = json[key]
    }

    this._updatePackage()
  }

  changeMat (value) {
    this.selected.material.albedoColor.copyFrom(value);
  }

  changeOpacity (value) {
    this.selected.material.alpha = value;
  }
}

/*
export default function (scene, metadata) {
  this.scene = scene
  this.data = metadata
  this.metadata = this.data
  this.showHelper = false
  this.scaleFromLayer1 = true // false - first option for sending data to moshe, with pivot on bottom left layer21
  // true - 2nd options, with pivot on bottom left of layer1
  if (!this.metadata) {
    console.log('Error: No input data')
    return
  }
  this.metadata['size'] = []
  this.metadata['Fsize'] = []
  this.metadata['layer1'] = []
  this.metadata['layer21'] = []

  this.object3D = null

  this._initMicroUSBFem1 = function () {
    //  add Marian - need to come from formMicroUSBFem1
    this.metadata['rotY'] = true
    this.metadata['rotZ'] = false
    this.metadata['boundScaleX'] = 0.1
    this.metadata['boundScaleY'] = 0
    this.metadata['boundScaleZ'] = 0.1
    this.metadata['pinsNr'] = 0
    this.metadata['componentName'] = ''
    this.metadata['isPart'] = true
    this.metadata['text'] = {
      'name': '', // this.metadata['name'], // maybe come from somewhere or technician put it
      'settings': [512, 400, 0, 60, true, '#555555', '#ffffff'] // size, maxWidth, rotation, font-size, invertY, backgroundColor, and text color
    }

    this.body = null
    this._createBody()
    this.bodyPlus = 0.1 / 2 // 0.05
    this.shadowPlus = 0.1
    this.pinWidthPlus = 0.1
    this.pinLengthPlus = 0.1
    this.holePlus = 0.2
    this.offsetX = 1
    this.offsetZ = -2
    this.resolution = 16
    this.startedPin = null

    this.object3D = this._createMicroUSBFem13D()
    this.object3D.metadata = this.metadata

    this.sendData()

    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this)
    }
  }

  //  CREATE 3D MicroUSBFem1 OBJECT
  this._createMicroUSBFem13D = function () {
    var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
    // bodymaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3)
    bodymaterial.diffuseTexture = new DrawText(this.scene, this.metadata['text'].name, this.metadata['text'].settings) 
    
    const box = this.body
    box.material = bodymaterial

    this._addPinsMicroUSBFem1Comp(box)

    this._createMicroUSBFem12D(box)

    // create an empty mesh to hold the entire components
    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = 'MicroUSBFem1' // this.metadata['name'] + this.metadata['part'] + this.metadata['id']
    box.setParent(mesh)

    return mesh
  }

  this._createBody = function () {
    BABYLON.SceneLoader.ShowLoadingScreen = false
    const that = this
    
    BABYLON.SceneLoader.ImportMesh('', '', 'data:' + strData, scene, function (m, p, s) {
      m[0].bakeCurrentTransformIntoVertices()
      // m[0].position.z = 1.3
      that.body = m[0]
    })

  
  }

  //  ADD PINS MicroUSBFem1 COMPONENT
  this._addPinsMicroUSBFem1Comp = function (comp) {
    comp.pins = []
    
    var bbInfo = comp.getBoundingInfo().boundingBox.extendSize
    const arrayPos = [[-1.3, 1.375, 0.2, 1.15], [-0.65, 1.375, 0.2, 1.15], [0, 1.375, 0.2, 1.15], [0.65, 1.375, 0.2, 1.15], [1.3, 1.375, 0.2, 1.15]]
    for (let i = 0; i < arrayPos.length; i++) {
      const box1 = BABYLON.MeshBuilder.CreateBox('pin', { width: arrayPos[i][2], depth: arrayPos[i][3], height: 0.1 }, this.scene)
      box1.metadata = {
        'width': arrayPos[i][2],
        'length': arrayPos[i][3]
      }

      box1.position.y = -bbInfo.y + 0.1
      box1.position.x = arrayPos[i][0]
      box1.position.z = arrayPos[i][1]

      box1.material = new BABYLON.StandardMaterial('pinMaterial_' + i, this.scene)
      comp.pins.push(box1)
    }

    comp.pins = this._sortPins(comp.pins)
    comp.pins = this._resortOnClick(comp.pins)

    for (let i = 0; i < comp.pins.length; i++) {
      comp.pins[i].material.diffuseTexture = new DrawText(this.scene, (i + 1).toString(), [64, 64, 0, 16, true, '#cfcfcf', '#000000'], true)
      const metadata = Object.assign({}, comp.pins[i].metadata, {'indexPin': (i + 1)})
      comp.pins[i].metadata = metadata
      comp.pins[i].setParent(comp)
    }

    // first pin for this package is top left
    this.metadata.pinsNr = comp.pins.length

    const arrayPos2 = [[-3.2, 1.15, 1.4, 1.2], [3.2, 1.15, 1.4, 1.2], [-3.425, -1.3, 1.25, 1.1], [3.425, -1.3, 1.25, 1.1], [-1.2, -1.3, 1.7, 1.7], [1.2, -1.3, 1.7, 1.7]]
    for (let i = 0; i < arrayPos2.length; i++) {
      const box1 = BABYLON.MeshBuilder.CreateBox('pin', { width: arrayPos2[i][2], depth: arrayPos2[i][3], height: 0.1 }, this.scene)
      box1.metadata = {
        'width': arrayPos2[i][2],
        'length': arrayPos2[i][3]
      }

      box1.position.y = -bbInfo.y + 0.1
      box1.position.x = arrayPos2[i][0]
      box1.position.z = arrayPos2[i][1]

      box1.material = new BABYLON.StandardMaterial('pin2Material_' + i, this.scene)
      comp.pins.push(box1)
      box1.setParent(comp)
    }
  }

  this._resortOnClick = function (data) {
    // console.log(this.metadata['PinStartAt'])
    let sortPins = []
    let auxPinsArray = []
    for (let i = 0; i < data.length; i++) {
      if (i >= (this.metadata['PinStartAt'] - 1)) {
        sortPins.push(data[i])
      }
      else {
        auxPinsArray.push(data[i])
      }
    }

    if (auxPinsArray.length > 0) {
      sortPins = sortPins.concat(auxPinsArray)
    }

    return sortPins
  }

  this._sortPins = function (data) {
    let sortPins = []
    if (this.metadata.isClockwise) {
      sortPins = data
    }
    else {
      sortPins = data.reverse()
    }

    return sortPins
  }

  //  CREATE 2D MicroUSBFem1 OBJECT
  this._createMicroUSBFem12D = function (comp) {
    let meshes = []
    meshes.push(this._createBorder(comp))

    for (let i = 0; i < comp.pins.length; i++) {
      const width = comp.pins[i].metadata.width
      const length = comp.pins[i].metadata.length

      comp.pins[i].metadata['Fwidth'] = width + this.pinWidthPlus + this.shadowPlus
      comp.pins[i].metadata['Flength'] = length + this.pinLengthPlus + this.shadowPlus

      // shadows
      let box1 = Component._create2DShape(0, width + this.pinWidthPlus + this.shadowPlus, length + this.pinLengthPlus + this.shadowPlus, 0.001, this.scene)
      const box2 = Component._create2DShape(0, width + this.pinWidthPlus, length + this.pinLengthPlus, 0.001, this.scene)
      box1 = Component._createHoles(box1, box2, this.scene)
      
      box1.position = comp.pins[i].getAbsolutePosition()
      box1.position.y = 0
      box1.rotation.y = comp.pins[i].rotation.y

      meshes.push(box1)
 
      // PINS
      const box3 = Component._create2DShape(0, width + this.pinWidthPlus, length + this.pinLengthPlus, 0.001, this.scene)

      box3.position = box1.position
      box3.rotation.y = box1.rotation.y

      meshes.push(box3)
    }

    const box = Component._get2DFootprint(meshes, this.scene)

    const yPos = comp.getHierarchyBoundingVectors(true)
    box.position.y = yPos.min.y + 0.01
    box.setParent(comp)

    // console.log('x: ', parseFloat(this.metadata['dimensions']['e_max_body_span']), parseInt(this.metadata['package_pin']['e_number_pins']), parseFloat(this.metadata['package_pin']['e1_pitch']))
    // console.log('z: ', parseFloat(this.metadata['dimensions']['d_max_body_span']), parseInt(this.metadata['package_pin']['d_number_pins']), parseFloat(this.metadata['package_pin']['e_pitch']))
  }

  // create 2d body - pink interior
  this._createBorder = function (comp) {
    const bnds = comp.getHierarchyBoundingVectors(true)
    const dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]
    
    this.metadata['size'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[1]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]

    let silks = []
    const path = [[new BABYLON.Vector3(-3.75, 0.1, -1.075 - 1.3), new BABYLON.Vector3(-3.75, 0.1, -1.45 - 1.3)],
      [new BABYLON.Vector3(3.75, 0.1, -1.075 - 1.3), new BABYLON.Vector3(3.75, 0.1, -1.45 - 1.3)],
      [new BABYLON.Vector3(-3.75, 0.1, 1.675 - 1.3), new BABYLON.Vector3(-3.75, 0.1, 0.875 - 1.3)],
      [new BABYLON.Vector3(3.75, 0.1, 1.675 - 1.3), new BABYLON.Vector3(3.75, 0.1, 0.875 - 1.3)],
      [new BABYLON.Vector3(3.75, 0.1, -1.45 - 1.3), new BABYLON.Vector3(-3.75, 0.1, -1.45 - 1.3)]]

    comp.path2d = path
    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = Component._createLine(path[i][0], path[i][1], 0.1, this.scene)
      lines.push(line)
    }

    if (lines.length > 0) {
      silks.push(BABYLON.Mesh.MergeMeshes(lines, true))
    }

    if (silks.length > 0) {
      return BABYLON.Mesh.MergeMeshes(silks, true)
    }

    return null
  }

  this._getPin = function () {
    const width = 0.6 // parseFloat(this.metadata['package_pin']['max_lead_width'])
    const length = 1.5 // parseFloat(this.metadata['package_pin']['max_lead_length'])

    const box = Component._create2DShape(0, width, length, 0.1, this.scene)
    box.material = new BABYLON.StandardMaterial('pinMaterial', this.scene)
    
    box.metadata = {
      'width': width,
      'length': length
    }

    box.isVisible = false
    return box
  }

  this.sendData = function () {
    let bnds = this.object3D.getHierarchyBoundingVectors(true)
    const xSize = Math.abs(bnds.max.x) + Math.abs(bnds.min.x)
    const zSize = Math.abs(bnds.max.z) + Math.abs(bnds.min.z)

    this.metadata['boundScaleX'] += parseFloat(Number(xSize / 2).toFixed(4))
    this.metadata['boundScaleY'] += parseFloat(bnds.max.y - 0.1 / 2) // pins height -0.1 / 2
    this.metadata['boundScaleZ'] += parseFloat(Number(zSize / 2).toFixed(4))

    // this.object3D.getChildren()[0]._boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-this.metadata.boundScaleX, -this.metadata.boundScaleY, -this.metadata.boundScaleZ), new BABYLON.Vector3(this.metadata.boundScaleX, this.metadata.boundScaleY, this.metadata.boundScaleZ))
    // this.object3D.getChildren()[0].showBoundingBox = true
    // console.log(this.object3D.getChildren()[0])
    console.log(this.metadata)
    const pins = this.object3D.getChildren()[0].pins
 
    let arrayPins = []
    let arrayPins2 = []

    const x = xSize / 2
    const z = zSize / 2

    const diff = new BABYLON.Vector3(parseFloat(Number(pins[7].getAbsolutePosition().x + x - pins[7].metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(pins[9].getAbsolutePosition().z + z - pins[9].metadata.Flength / 2).toFixed(4)))

    if (this.scaleFromLayer1) {
      for (let i = 0; i < pins.length; i++) {
        arrayPins.push([0, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(4)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(4)), parseFloat(Number(pins[i].metadata.Flength).toFixed(4)), 0])
      }

      const path = this.object3D.getChildren()[0].path2d
      arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[0][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][1].z + z - diff.z).toFixed(4)), 0.1, 0],
        [parseFloat(Number(path[1][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[1][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][1].z + z - diff.z).toFixed(4)), 0.1, 0],
        [parseFloat(Number(path[2][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[2][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][1].z + z - diff.z).toFixed(4)), 0.1, 0],
        [parseFloat(Number(path[3][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[3][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][1].z + z - diff.z).toFixed(4)), 0.1, 0]]
    }
    else {
      console.log('Does not exist')
    }

    this.metadata['Fsize'] = [parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4))]
    this.metadata['layer1'] = ['Layer 1', arrayPins]
    this.metadata['layer21'] = ['Layer 21', arrayPins2]

    console.log(this.metadata)
    console.log('size', JSON.stringify(this.metadata['size']))
    console.log('Fsize', JSON.stringify(this.metadata['Fsize']))
    console.log('layer1', JSON.stringify(this.metadata['layer1']))
    console.log('layer21', JSON.stringify(this.metadata['layer21']))

    if (this.showHelper) {
      Component._showMarkers(10, this.metadata['layer1'], this.metadata['layer21'], this.metadata['size'], this.metadata['Fsize'], this.scene)
    }
  }

  this.view2D = function (param) {
    this.scene.is3D = param
    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this)
    }
  }

  this.save3D = function () {
    return Component.save3D(this)
  }

  this.getData = function () {
    return this.data
  }

  this.disposeEngine = function () {
    Component.disposeEngine(this)
  }

  this.updateObject = function (json) {
    Component.dispose(this)
    this.data = json
    this.metadata = this.data
    this._initMicroUSBFem1()
  }

  this._initMicroUSBFem1()

  return this
}
*/