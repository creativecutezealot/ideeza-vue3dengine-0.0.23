/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from '../component'

export default class FemaleHeader {
  constructor(scene, metadata) {
    this.scene = scene
    this.metadata = metadata

    // for nr of legs
    this.metadata['pinsNr'] = 0

    this.metadata['size'] = []
    this.metadata['sizeL1'] = []
    this.metadata['Fsize'] = []
    this.metadata['layer1'] = []
    this.metadata['layer21'] = []

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

    this.pins = []
    this.layer1 = null
    this.layer21 = null

    // schematic
    this.sc = null
    // 2d
    this.dn = null
    // 3d
    this.td = null

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
    const body = await Component.import3dObject('user-15d380324913466aa3a6868f6bb1a5c9.glb', this.scene)
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
    const pin1 = await Component.import3dObject('user-2c7f6b2a4baa490d87dee8ac66feed72.glb', this.scene) // pin normal
    const pin2 = await Component.import3dObject('user-601c23dd06ef4611996d09d523ab0a6a.glb', this.scene) // pin link
    const pin3 = await Component.import3dObject('user-ff4fb3447fcf404489ee465bd8b046ac.glb', this.scene) // pin body
    if (!pin1 || !pin2 || !pin3) {
      console.log('Error on import pin')
    }

    pin1.name = pin1.id = 'assets'
    pin2.name = pin2.id = 'assets'
    pin3.name = pin3.id = 'assets'
    pin1.isVisible = false
    pin2.isVisible = false
    pin3.isVisible = false
    pin1.rotationQuaternion = null
    pin2.rotationQuaternion = null
    pin3.rotationQuaternion = null

    if (pin1.material) {
      pin1.material.dispose()
    }
    if (pin2.material) {
      pin2.material.dispose()
    }
    if (pin3.material) {
      pin3.material.dispose()
    }

    this.assets.push(pin1, pin2, pin3)
    ////// pins ////////
  }

  _updatePackage () {
    this._update3d()
    this._update2d()
    this._updateSchematic()

    this._getElectronicData()
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

  _update3d () {
    if (this.td) {
      this.td.dispose(false, true)
    }

    this.td = new BABYLON.TransformNode('td_root_', this.scene)

    // create body
    const body = this._createBody()
    body.setParent(this.td)

    this._updatePins()
  }

  _createBody () { 
    if (this.assets.length === 0) {
      return
    }

    const xLength = parseInt(this.metadata['package_pin']['e_number_pins'])
    const zLength = parseInt(this.metadata['package_pin']['d_number_pins'])
    const height = parseInt(this.metadata['dimensions']['maximum_height'])

    const e = parseFloat(this.metadata['package_pin']['e_pitch'])
    const e1 = parseFloat(this.metadata['package_pin']['e1_pitch'])

    let meshes = []
    for (let i = 0; i < xLength; i++) {
      for (let j = 0; j < zLength; j++) {
        let box = this.assets[0].clone('bodyMesh' + i + j)
        box.isVisible = true
        box.scaling.x = e
        box.scaling.y = e1
        box.scaling.z = height

        box.rotation.x = -Math.PI / 2
        
        let offsetX = 0
        if (zLength % 2 === 0) {
          offsetX = (e / 2) * (xLength - 1)
        }
        else {
          offsetX = e * ((xLength - 1) / 2)
        }
        let offsetY = 0
        if (xLength % 2 === 0) {
          offsetY = e1 / 2 * (zLength - 1)
        }
        else {
          offsetY = e1 * ((zLength - 1) / 2)
        }

        box.position.x = i * e - offsetX
        box.position.z = j * e1 - offsetY

        meshes.push(box)
      }
    }

    let body
    if (meshes.length !== 0) {
      body = BABYLON.Mesh.MergeMeshes(meshes, true)
      body.name = body.id = 'td_Body'
      body.material = Component.createMaterial(this.scene, 'plastic', '#555555')
      body.material.name = body.material.id = 'MaterialBody'
      
      // show menu for material
      const _this = this
      body.actionManager = new BABYLON.ActionManager(this.scene)
      body.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (evt) => {
        _this.selected = evt.source
        _this.tooltip.isVisible = !_this.tooltip.isVisible
      }))
    }

    const name = Component.addText({
      scene: this.scene,
      name: 'td_name',
      scaling: new BABYLON.Vector3(xLength * e, height, 1),
      position: new BABYLON.Vector3(0, 0, -(zLength * e1 / 2 + 0.01)),
      rotation: new BABYLON.Vector3(0, 0, 0),
      materialName: 'MaterialName3',
      text: this.metadata['name'],
      font: this.metadata['nameFontSize'],
      background: 'transparent',
      color: '#ffffff'
    })
    name.material.zOffset = -1
    name.setParent(body)

    const drill = new BABYLON.Mesh.CreatePlane('drill', 1, this.scene)
    drill.setEnabled(false)
    drill.position.y = height / 2
    drill.rotation.x = Math.PI / 2
    drill.setParent(body)

    return body
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
    const xLength = parseInt(this.metadata['package_pin']['e_number_pins'])
    const zLength = parseInt(this.metadata['package_pin']['d_number_pins'])
    const height = parseInt(this.metadata['dimensions']['maximum_height'])

    const e = parseFloat(this.metadata['package_pin']['e_pitch'])
    const e1 = parseFloat(this.metadata['package_pin']['e1_pitch'])

    const pinX = parseFloat(this.metadata['package_pin']['max_lead_width'])
    const pinY = parseFloat(this.metadata['package_pin']['max_lead_height'])
    const pinZ = parseFloat(this.metadata['package_pin']['max_lead_length'])

    let box
    for (let i = 0; i < xLength; i++) {
      for (let j = 0; j < zLength; j++) {
        if (parseInt(this.metadata['package_pin']['type']) === 0) {
          box = clone.clone(`Pin_` + (i + j))
          
          box.isVisible = true
          box.scaling.x = pinX
          box.scaling.y = pinZ
          box.scaling.z = pinY

          box.rotation.x = -Math.PI / 2
        }
        else {
          box = this.buildPin(j)
        }
        
        let offsetX = 0
        if (zLength % 2 === 0) {
          offsetX = (e / 2) * (xLength - 1)
        }
        else {
          offsetX = e * ((xLength - 1) / 2)
        }
        let offsetY = 0
        if (xLength % 2 === 0) {
          offsetY = e1 / 2 * (zLength - 1)
        }
        else {
          offsetY = e1 * ((zLength - 1) / 2)
        }

        box.position.x = i * e - offsetX
        box.position.z = j * e1 - offsetY

        if (parseInt(this.metadata['package_pin']['type']) === 0) {
          box.position.y = -(height / 2 + pinY / 2 - 0.06 * height - 0.1)
        }
        else {
          box.position.y = -(height / 2 + (pinY + (zLength - 1 - j) * e1) / 2 - 0.06 * height - 0.1)
        }

        box.material = Component.createMaterial(this.scene, 'metalic', '#f5f5f5')

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
      this.pins[i].name = this.pins[i].id = `td_Pin_` + (i + 1)
      this.pins[i].material.name = this.pins[i].material.id = 'MaterialPin_' + i
      this.pins[i].setParent(this.td)
    }

    this.metadata['pinNumber'] = this.pins.length
  }

  _update2d () {
    if (this.dn) {
      this.dn.dispose(false, true)
    }

    this.dn = new BABYLON.TransformNode('dn_root_', this.scene)

    // create body
    const body = this._createBody2d()
    body.setParent(this.dn)

    this._updatePins2d()
  }

  buildPin (index) {
    const pinX = parseFloat(this.metadata['package_pin']['max_lead_width'])
    const pinY = parseFloat(this.metadata['package_pin']['max_lead_height'])
    const pinY2 = parseFloat(this.metadata['package_pin']['max_lead_height90'])
    const pinZ = parseFloat(this.metadata['package_pin']['max_lead_length'])
    const zLength = parseInt(this.metadata['package_pin']['d_number_pins'])

    const p1 = this.assets[1].clone('randomp1')
    const p2 = this.assets[2].clone('randomp2')
    const p3 = this.assets[3].clone('randomp3')

    p3.isVisible = true
    p3.scaling.x = pinY + (zLength - 1 - index) * parseFloat(this.metadata['package_pin']['e1_pitch'])
    p3.scaling.y = pinX
    p3.scaling.z = pinZ
    p3.rotation.z = Math.PI / 2

    p2.isVisible = true
    p2.scaling.x = pinZ
    p2.scaling.y = pinX
    p2.scaling.z = pinZ
    
    p2.position.y = -(p2.position.y + p3.scaling.x / 2)
    p2.rotation.z = Math.PI / 2
    p2.rotation.y = Math.PI
    
    p1.isVisible = true
    p1.scaling.x = pinZ
    p1.scaling.y = pinX
    p1.scaling.z = pinY2 + (zLength - 1 - index) * parseFloat(this.metadata['package_pin']['e1_pitch'])

    p1.position.y = p2.position.y
    p1.position.z = p1.scaling.z / 2
    p1.rotation.z = -Math.PI / 2
    p1.rotation.y = Math.PI

    return BABYLON.Mesh.MergeMeshes([p1, p2, p3], true)
  }

  _updatePins2d () {
    if (this.pins.length === 0) {
      return
    }

    const totalPins = this.pins.length
    
    const pinX = parseFloat(this.metadata['package_pin']['max_lead_width'])
    const pinZ = parseFloat(this.metadata['package_pin']['max_lead_length'])
    const width = (pinX > pinZ) ? pinX : pinZ
    const length = width + this.footPrint.holePlus + this.footPrint.whiteBorderPlus + this.footPrint.shadowPlus
    for (let i = 0; i < totalPins; i++) {
      this.pins[i].metadata = {
        Fwidth: length,
        Flength: length
      }
  
      const pin =  BABYLON.MeshBuilder.CreatePlane('dn_pin_' + (i + 1), { sideOrientation: BABYLON.Mesh.DOUBLESIDE, width: this.pins[i].metadata.Fwidth, height: this.pins[i].metadata.Flength }, this.scene)
      pin.rotation.x = Math.PI / 2
      const pos = this.pins[i].getAbsolutePosition()
      pin.position = pos.clone()
      pin.position.y = 0.01
      pin.rotation.y = this.pins[i].rotation.y

      this.pins[i].metadata['position'] = pin.position.clone()
      
      var mat1 = new BABYLON.PBRMaterial('dnMatPin_' + i, this.scene)
      mat1.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND
      
      var textureGround = new BABYLON.DynamicTexture("dt" + i, {width: length * 64, height: length * 64}, this.scene) 
      textureGround.hasAlpha = true
      var textureContext = textureGround.getContext()
     
      textureContext.rect(0, 0, length * 64, length * 64)
      textureContext.fillStyle = "white"
      textureContext.fill()
      textureContext.lineWidth = 3
      textureContext.strokeStyle = "#444444"
      textureContext.stroke()
      textureContext.globalCompositeOperation = 'xor'
      textureContext.beginPath()
      textureContext.arc(length * 32, length * 32, (width + this.footPrint.holePlus) * 32, 0, 2 * Math.PI)
      textureContext.fill()
      
      textureGround.update()
      mat1.albedoTexture = textureGround
      mat1.metallic = 0
      mat1.roughness = 1
      pin.material = mat1
 
      pin.setParent(this.dn)
      this.metadata['transform']['thole'] = width + this.footPrint.holePlus
    }
  }

  _createBody2d () {
    if (this.pins.length === 0) {
      return
    }

    const parent = new BABYLON.AbstractMesh('parent', this.scene)
    const kids = this.td.getChildren()
    for (let i = 0; i < kids.length; i++) {
      kids[i].parent = parent
    }
    
    let bnds = parent.getHierarchyBoundingVectors(true)
    const dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]

    this.metadata['size'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[1]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]
 
    const x = dimensions[0] / 2 + 2 * parseFloat(this.metadata['silkscreen']['LineWidth'])
    const z = dimensions[2] / 2 + 2 * parseFloat(this.metadata['silkscreen']['LineWidth'])
    
    this.metadata['Fsize'] = [parseFloat(Number( 2 * x + parseFloat(this.metadata['silkscreen']['LineWidth'])).toFixed(4)), parseFloat(Number(2 * z + parseFloat(this.metadata['silkscreen']['LineWidth'])).toFixed(4))]

    // BODY
    const clickablebody = BABYLON.MeshBuilder.CreatePlane('dn_body', { sideOrientation: BABYLON.Mesh.DOUBLESIDE, size: 1 }, this.scene)
    clickablebody.scaling = new BABYLON.Vector3(2*x, 2*z, 1)
    clickablebody.position.y = 0.005
    clickablebody.rotation.x = Math.PI / 2
    clickablebody.material = new BABYLON.StandardMaterial('Material1clickablebody', this.scene)
    clickablebody.material.alpha = 0.02
    clickablebody.setParent(this.dn)

    // OUTLINE BODY
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

    let body
    if (lines.length > 0) {
      body = BABYLON.Mesh.MergeMeshes(lines, true)
      body.name = 'dn_layer21'

      body.material = new BABYLON.StandardMaterial('Materia1lName', this.scene)
      body.material.diffuseColor = new BABYLON.Color3(1,1,1)
      body.material.specularColor = new BABYLON.Color3(0,0,0)
      body.position.y = 0.005
      body.setParent(this.dn)
    }

    for (let i = 0; i < kids.length; i++) {
      kids[i].setParent(this.td)
    }
    parent.dispose()

    const width = parseFloat(this.metadata['package_pin']['e_pitch'])
    const depth = parseFloat(this.metadata['package_pin']['e1_pitch'])
    const name = Component.addText({
      scene: this.scene,
      name: 'dn_name',
      scaling: new BABYLON.Vector3(width, depth, 1),
      position: new BABYLON.Vector3(0, 0.01, 0),
      rotation: new BABYLON.Vector3(Math.PI / 2, 0, 0),
      materialName: 'MaterialName4',
      text: this.metadata['name2d'],
      font: this.metadata['nameFontSize'],
      background: 'transparent',
      color: '#ffffff'
    })
    name.material.zOffset = -1
    name.setParent(body)
 
    return body
  }

  _getElectronicData () {
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

  _addFSize () {
    if (this.pins.length === 0) {
      return
    }

    const kids2d = this.dn.getChildren()
    const parent = new BABYLON.AbstractMesh('parent', this.scene)
    
    for (let i = 2; i < kids2d.length; i++) {
      kids2d[i].parent = parent
    }

    // calculate size of layer21   
    const bnds = parent.getHierarchyBoundingVectors(true)
    const dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]

    this.metadata['sizeL1'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]
    
    for (let i = 2; i < kids2d.length; i++) {
      kids2d[i].setParent(this.dn)
    }

    const height = parseFloat(this.metadata['dimensions']['maximum_height']) + 0.05

    if (parseInt(this.metadata['package_pin']['type']) === 0) {
      this.metadata['transform']['position'][1] = height / 2 
    }
    else {
      const dist = parseInt(this.metadata['package_pin']['d_number_pins']) * parseFloat(this.metadata['package_pin']['e1_pitch'])
      this.metadata['transform']['position'][1] = dist / 2
      this.metadata['transform']['rotation'][0] = -90
    }
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
    const zLength = parseInt(this.metadata['package_pin']['d_number_pins'])

    let arrOfArray = []
    for (let i = 0; i < this.pins.length; i += zLength) {
      let j = 0
      while (j < zLength) {
        if (!arrOfArray[j]) {
          arrOfArray[j] = []
        }
        arrOfArray[j].push(this.pins[i + j])
        j++
      }
    }

    if (arrOfArray.length > 1) {
      for (let i = 1; i < arrOfArray.length; i+=2) {
        arrOfArray[i].reverse()
      }
    }

    this.pins = []
    for (let i = 0; i < arrOfArray.length; i++) {
      this.pins = this.pins.concat(arrOfArray[i])
    }

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