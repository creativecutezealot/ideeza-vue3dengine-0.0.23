/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from '../component'
import { DrawText } from '../../general/Utils'

export default class NRF24 {
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
      'best_sc': [0,0,0],   // position2d.x, position2d.y, rotation.y - for schematic
      'thole': 0            // diameter of hole need to be created on the board, only for TH parts
    }

    // footrint settings
    this.footPrint = {
      bodyPlus: 0.05,
      shadowPlus: 0.05,
      holePlus: 0.1,
      whiteBorderPlus: 0.15,
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
    this.drill = null
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
    const body = await this._createBody3D()
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
    const pin = await this._getPin()
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

    const width = parseFloat(this.metadata['dimensions']['e_max_body_span'])
    const depth = parseFloat(this.metadata['dimensions']['d_max_body_span'])
    const height = parseFloat(this.metadata['dimensions']['maximum_height'])

    const body = this._createBody3D()
    body.isVisible = true
    body.name = body.id = 'Body'
    body.material = Component.createMaterial(this.scene, 'plastic', '#555555')
    body.material.name = body.material.id = 'MaterialBody'
    body.material.sideOrientation = 1
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

    const size = (width > depth) ? depth : width
    this.name = new BABYLON.Mesh.CreateGround('decal', size, size, 4, this.scene)
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
    this.name.position.y = height / 2 + 0.01

    if (this.drill) {
      this.drill.dispose(false, true)
    }

    // const bodyDim = this.body.getBoundingInfo().boundingBox
    // this.drill = BABYLON.MeshBuilder.CreateBox('drill', { width: bodyDim.extendSize.x * 2, depth: bodyDim.extendSize.z * 2, height: 0.5}, this.scene)
    this.drill = new BABYLON.Mesh.CreatePlane('drill', 1, this.scene)
    this.drill.setParent(this.body)
    this.drill.setEnabled(false)
    // this.drill.position.y = height / 2 - 0.25
    this.drill.position.y = height / 2
    this.drill.rotation.x = Math.PI / 2
  }

  _updatePins () {
    if (this.assets.length === 0) {
      return
    }

    for (let i = 0; i < this.pins.length; i++) {
      this.pins[i].dispose(false, true)
    }
    this.pins = []

    // const width = parseFloat(this.metadata['dimensions']['e_max_body_span']) / 2  
    // const depth = parseFloat(this.metadata['dimensions']['d_max_body_span']) / 2 
    const height = parseFloat(this.metadata['dimensions']['maximum_height']) / 2

    const xLength = parseInt(this.metadata['package_pin']['e_number_pins'])
    const zLength = parseInt(this.metadata['package_pin']['d_number_pins'])

    let box
    for (let i = 0; i < xLength; i++) {
      for (let j = 0; j < zLength; j++) {
        box = this._getPin()
        box.isVisible = true

        var boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

        box.position.y -= (height + boxbbInfo.y)
        let offsetX = 0
        if (parseInt(this.metadata['package_pin']['d_number_pins']) % 2 === 0) {
          offsetX = (parseFloat(this.metadata['package_pin']['e1_pitch']) / 2) * (parseInt(this.metadata['package_pin']['e_number_pins']) - 1)
        }
        else {
          offsetX = parseFloat(this.metadata['package_pin']['e1_pitch']) * ((parseInt(this.metadata['package_pin']['e_number_pins']) - 1) / 2)
        }
        let offsetY = 0
        if (parseInt(this.metadata['package_pin']['e_number_pins']) % 2 === 0) {
          offsetY = parseFloat(this.metadata['package_pin']['e_pitch']) / 2 * (parseInt(this.metadata['package_pin']['d_number_pins']) - 1)
        }
        else {
          offsetY = parseFloat(this.metadata['package_pin']['e_pitch']) * ((parseInt(this.metadata['package_pin']['d_number_pins']) - 1) / 2)
        }

        box.position.x = i * parseFloat(this.metadata['package_pin']['e1_pitch']) - offsetX
        box.position.z = j * parseFloat(this.metadata['package_pin']['e_pitch']) - offsetY

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
      
        if (i === 0 && j === 0) {
          this.startedPin = box
        }

        this.pins.push(box)
      }
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

    const width = parseFloat(this.metadata['package_pin']['max_lead_range'])
    const length = width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus + this.footPrint.shadowPlus
    for (let i = 0; i < totalPins; i++) {
      this.pins[i].metadata = {
        Fwidth: length,
        Flength: length
      }

      // shadows
      let box1 = Component._create2DShape(0, width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus + this.footPrint.shadowPlus, width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus + this.footPrint.shadowPlus, 0.001, this.scene)
      const box2 = Component._create2DShape(0, width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus, width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus, 0.001, this.scene)
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
      let box3 = Component._create2DShape(0, width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus, width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus, 0.001, this.scene)
      const box4 = Component._create2DShape(1, width + this.footPrint.holePlus, width + this.footPrint.holePlus, 0.001, this.scene)

      box3 = Component._createHoles(box3, box4, this.scene)

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

    this.metadata['transform']['thole'] = width + this.footPrint.holePlus
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
 
    const x = dimensions[0] / 2 + parseFloat(this.metadata['silkscreen']['LineWidth'])
    const z = dimensions[2] / 2 + parseFloat(this.metadata['silkscreen']['LineWidth'])

    let silks = []
    const path = [[new BABYLON.Vector3(-x, 0, z), new BABYLON.Vector3(-x, 0, -z)],
      [new BABYLON.Vector3(-x, 0, -z), new BABYLON.Vector3(x, 0, -z)],
      [new BABYLON.Vector3(x, 0, -z), new BABYLON.Vector3(x, 0, z)],
      [new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(-x, 0, z)]]

    this.path2d = path
    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = Component._createLine(path[i][0], path[i][1], parseFloat(this.metadata['silkscreen']['LineWidth']), this.scene)
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
    this._addFsize()

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
      diff = new BABYLON.Vector3(parseFloat(Number(this.startedPin.getAbsolutePosition().x + x - this.startedPin.metadata.Flength / 2).toFixed(4)), 0, parseFloat(Number(this.startedPin.getAbsolutePosition().z + z - this.startedPin.metadata.Fwidth / 2).toFixed(4)))
    }
    
    this.metadata.transform['pivot'] = [-(x - diff.x), -(z - diff.z)]

    for (let i = 0; i < pins.length; i++) {
      arrayPins.push([1, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(this.footPrint.resolution)), 0, 0])
    }

    const path = this.path2d
    arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[0][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[0][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[0][1].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
      [parseFloat(Number(path[1][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[1][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[1][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[1][1].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
      [parseFloat(Number(path[2][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[2][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[2][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[2][1].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
      [parseFloat(Number(path[3][0].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[3][0].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(Number(path[3][1].x + x - diff.x).toFixed(this.footPrint.resolution)), parseFloat(Number(path[3][1].z + z - diff.z).toFixed(this.footPrint.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0]]

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

  _addFsize () {
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

    const height = parseFloat(this.metadata['dimensions']['maximum_height']) + 0.05

    this.body.position.y = height / 2
    for (let i = 0; i < this.pins.length; i++) {
      this.pins[i].position.y += height / 2
    }
    
    // console.log(this.layer1.position, this.metadata['transform']['position'][1], this.pins[0].scaling.y, height)
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
    let sortPins = []
    if (this.metadata.isClockwise) {
      let auxPinsArray = []
      for (let i = 0; i < this.pins.length; i++) {
        if (i < this.pins.length / 2) {
          sortPins.push(this.pins[i])
        }
        else {
          auxPinsArray.push(this.pins[i])
        }
      }

      auxPinsArray.reverse()
      for (let i = 0; i < auxPinsArray.length; i++) {
        sortPins.push(auxPinsArray[i])
      }
    }
    else {
      let auxPinsArray = []
      for (let i = 0; i < this.pins.length; i++) {
        if (i >= this.pins.length / 2) {
          sortPins.push(this.pins[i])
        }
        else {
          auxPinsArray.push(this.pins[i])
        }
      }

      const auxPins2 = auxPinsArray.reverse()
      sortPins = auxPins2.concat(sortPins)
    }

    this.pins = sortPins
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

  _createBody3D () {
    var options = {
      width: parseFloat(this.metadata['dimensions']['e_max_body_span']),
      height: parseFloat(this.metadata['dimensions']['maximum_height']),
      depth: parseFloat(this.metadata['dimensions']['d_max_body_span'])
    }

    const box = BABYLON.MeshBuilder.CreateBox('body', options, this.scene)
  
    return box
  }

  _getPin () {
    const length = parseFloat(this.metadata['package_pin']['max_lead_range'])
    const height = parseFloat(this.metadata['package_pin']['max_lead_height'])

    const box = Component._create2DShape(1, length, length, height, this.scene)
    
    box.metadata = {
      'width': length,
      'length': length
    }

    box.isVisible = false
    return box
  }
}