/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from '../component'
import { DrawText } from '../../general/Utils'

export default class ProtoPack {
  constructor(scene) {
    this.scene = scene
    this.metadata = {}

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
    /*  
    if (Object.keys(this.metadata).length <= 3) {
      console.log('%c Not enought data ', 'background: #222; color: #bada55')
      return
    }
    */
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
    const body = new BABYLON.Mesh.CreateBox('body', 1, this.scene)
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
    const pin = BABYLON.MeshBuilder.CreateBox('pin', { width: 0.6, height: 1.01, depth: 0.4 }, this.scene)
    if (!pin) {
      console.log('Error on import pin')
    }

    pin.name = pin.id = 'assets'
    pin.isVisible = false
    pin.rotationQuaternion = null

    if (pin.material) {
      pin.material.dispose()
    }

    this.assets.push(pin)
  }

  _updatePackage () {
    if (!this.metadata['noOfPins']) {
      this.metadata['noOfPins'] = 4
    }
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

    // w h d
    const nrOfPins = parseFloat(this.metadata['noOfPins'])
    const pitch = 0.75
    const size = (nrOfPins * pitch) / 2 + 1
    this.assets[0].scaling = new BABYLON.Vector3(size, 1, size)
    
    const body = this.assets[0].clone('Body')
    body.isVisible = true
    body.name = body.id = 'Body'
    body.material = Component.createMaterial(this.scene, 'plastic', '#555555')
    body.material.sideOrientation = 1
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

    this.name = new BABYLON.Mesh.CreateGround('decal', size, size, 4, this.scene)
    this.name.material = Component.createMaterial(this.scene, 'plastic')
    this.name.material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND
    this.name.material.name = this.name.material.id = 'MaterialName'
    this.name.material.sideOrientation = 1
    this.name.material.zOffset = -2
    const texture = new DrawText(this.scene, this.metadata['name'] || 'Name', {
      color: '#ffffff',
      background: 'transparent',
      invertY: true,
      font: 0,
      rotation: -Math.PI / 2
    })
    this.name.material.albedoTexture = texture
    this.name.material.opacityTexture = texture
    this.name.setParent(this.body)
    this.name.position.y = 0.51
  }

  _updatePins () {
    if (this.assets.length === 0) {
      return
    }

    for (let i = 0; i < this.pins.length; i++) {
      this.pins[i].dispose(false, true)
    }
    this.pins = []

    const clone = this.assets[1]
    const nrOfPins = this.metadata['noOfPins']
    const pitch = 0.75
    let box
    for (let i = 0; i < nrOfPins; i++) {
      box = clone.clone(`Pin_` + i)
      box.isVisible = true

      const k = parseFloat(nrOfPins / 2)
      if (k % 2 !== 0) {
        box.position.z = (i % k) * pitch - pitch * ((k / 2 < 1) ? 0 : parseInt(k / 2))
      }
      else {
        box.position.z = (i % k) * pitch + pitch / 2 - pitch * (k / 2)
      }

      box.position.x = ((i < k) ? -1 : 1) * (((nrOfPins * pitch) / 2 + 1) / 2)
    
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
    
    for (let i = 0; i < this.pins.length; i++) {
      this.pins[i].name = this.pins[i].id = `Pin_` + (i + 1)
      this.pins[i].material.name = this.pins[i].material.id = 'MaterialPin_' + i
    }

    this.metadata['pinsNr'] = this.pins.length
  }

  _createLayer1 () {
    if (this.pins.length === 0 || !this.body) {
      return
    }

    if (this.layer1) {
      this.layer1.dispose(false, true)
    }

    this.layer1 = new BABYLON.Mesh('Layer1', this.scene)
    this.layer1.name = this.layer1.id = 'Layer1'

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

    this.layer21 = new BABYLON.Mesh('Layer1', this.scene)
    this.layer21.name = this.layer21.id = 'Layer21'
    this.layer21.position.y = 0

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
      font: 0,
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
 
    this.metadata['layer1'] = ['Layer 1', []]
    this.metadata['layer21'] = ['Layer 21', []]

    for (let i = 0; i < this.scene.meshes.length; i++) {
      console.log(i, this.scene.meshes[i].name, this.scene.meshes[i].id)
    }
    console.log(this.metadata)
    console.log('size', JSON.stringify(this.metadata['size']))
    console.log('Fsize', JSON.stringify(this.metadata['Fsize']))
    console.log('sizeL1', JSON.stringify(this.metadata['sizeL1']))
    console.log('layer1', JSON.stringify(this.metadata['layer1']))
    console.log('layer21', JSON.stringify(this.metadata['layer21']))

    this.metadata['transform']['position'][1] = 0.51 
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

  updateObjPrototype (json) {
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