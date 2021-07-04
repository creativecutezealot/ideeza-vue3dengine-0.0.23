/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from '../component'
// import { DrawText } from '../../general/Utils'

export default function (scene, metadata) {
  this.scene = scene
  this.data = metadata
  this.metadata = this.data
  if (!this.metadata) {
    console.log('Error: No input data')
    return
  }
  this.metadata['size'] = []
  this.metadata['layer1'] = []
  this.metadata['layer21'] = []

  this._layerColor = ['#ff00ff', '#0000ff', '#ffffff', '#000000', '#ff00ff', '#0000ff', '#ffffff', '#000000', '#ff00ff', '#0000ff', '#ffffff', '#000000', '#ff00ff', '#0000ff', '#ffffff', '#000000']

  if (!this.metadata) {
    console.log('Error: No input data')
    return
  }

  this.object3D = null
  this.object2D = null

  this._initQFN = function () {
    //  add Marian - need to come from formQFN
    this.metadata['rotY'] = true
    this.metadata['rotZ'] = false
    this.metadata['boundScaleX'] = 0.6
    this.metadata['boundScaleZ'] = 0.6
    this.metadata['pinsNr'] = 0
    this.metadata['componentName'] = ''
    this.metadata['isPart'] = true

    this.object3D = this._createQFN3D()
    this.object3D.metadata = this.metadata
    this.object2D = this._createQFN2D()

    // todo: see how to update data.js or who will update it
    this.calculate()

    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this)
    }

    // QFN footprint description
    this.metadata['name'] = this.metadata['footprint_description']['suggestedName']
  }

  //  CREATE 3D QFN OBJECT
  this._createQFN3D = function () {
    var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
    bodymaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3)

    var box = BABYLON.Mesh.CreateBox('body', 1.0, this.scene)

    if (this.metadata['courtyard']['isCompBodyCalculated'] === true) {
      box.scaling.x = parseFloat(this.metadata['dimensions']['e_max_body_span'])
      box.scaling.z = parseFloat(this.metadata['dimensions']['d_max_body_span'])
    }
    else {
      box.scaling.x = parseFloat(this.metadata['courtyard']['addCompWidth'])
      box.scaling.z = parseFloat(this.metadata['courtyard']['addCompLength'])
    }
    box.scaling.y = parseFloat(this.metadata['dimensions']['maximum_height'])

    if (parseFloat(this.metadata['dimensions']['chamfered_corner']) !== 0) {
      box = this._addCornersQFNComp(box)
    }

    this._addPinsQFNComp(box)
    this._addTermalPadQFNComp(box)
    this.createFootprint(box)

    box.material = bodymaterial

    // create an empty mesh to hold the entire components
    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = this.metadata['name'] + this.metadata['part'] + this.metadata['id']
    box.setParent(mesh)

    return mesh
  }

  //  ADD CORNERS QFN COMPONENT
  this._addCornersQFNComp = function (comp) {
    var bbInfo = comp.getBoundingInfo().boundingBox.vectorsWorld
    var vectors = []
    for (let i = 0; i < bbInfo.length; i++) {
      if (bbInfo[i].y > 0) {
        vectors.push(new BABYLON.Vector3(bbInfo[i].x * comp.scaling.x, bbInfo[i].y * comp.scaling.y, bbInfo[i].z * comp.scaling.z))
      }
    }

    var csg = []
    for (let i = 0; i < vectors.length; i++) {
      var mesh = BABYLON.Mesh.CreateBox('box', parseFloat(this.metadata['dimensions']['chamfered_corner']) * Math.sqrt(2), this.scene)
      mesh.position = vectors[i]
      mesh.rotation.y = Math.PI / 4
      mesh.scaling.y = (parseFloat(this.metadata['dimensions']['chamfered_corner']) < 1) ? 20 : 10 * parseFloat(this.metadata['dimensions']['maximum_height'])
      csg.push(mesh)
    }

    for (let i = 0; i < csg.length; i++) {
      var innerCSG = BABYLON.CSG.FromMesh(csg[i])
      var outerCSG = BABYLON.CSG.FromMesh(comp)

      comp.dispose()
      csg[i].dispose()

      var subCSG = outerCSG.subtract(innerCSG)

      scene.removeMesh(innerCSG)
      scene.removeMesh(outerCSG)

      comp = subCSG.toMesh('body', null, this.scene)
      comp.createNormals(false)

      this.scene.removeMesh(subCSG)
    }

    return comp
  }

  //  ADD PINS QFN COMPONENT
  this._addPinsQFNComp = function (comp) {
    comp.pins = []
    var pinmaterial = new BABYLON.StandardMaterial('pinMaterial', this.scene)
    pinmaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.0)

    var totalPins = 2 * parseInt(this.metadata['package_pin']['e_number_pins']) + 2 * parseInt(this.metadata['package_pin']['d_number_pins'])

    var posArray = []
    for (var i = 0; i < totalPins; i++) {
      if (i < parseInt(this.metadata['package_pin']['d_number_pins'])) {
        posArray.push('d_number_pins')
      }
      else if (i < (parseInt(this.metadata['package_pin']['e_number_pins']) + parseInt(this.metadata['package_pin']['d_number_pins']))) {
        posArray.push('e_number_pins')
      }
      else if (i < (parseInt(this.metadata['package_pin']['e_number_pins']) + 2 * parseInt(this.metadata['package_pin']['d_number_pins']))) {
        posArray.push('d_number_pins')
      }
      else {
        posArray.push('e_number_pins')
      }
    }

    let side = -1
    let k, box
    const clone = this._getPin()
    for (let i = 0; i < totalPins; i++) {
      box = clone.clone()
      box.isVisible = true

      var bbInfo = comp.getBoundingInfo().boundingBox.extendSize
      var boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

      box.position.y -= (bbInfo.y * comp.scaling.y + boxbbInfo.y * box.scaling.y + parseFloat(this.metadata['dimensions']['min_standoff']))

      if (i === 0 || (i > 0 && posArray[i] !== posArray[i - 1])) {
        side++
        if (parseInt(this.metadata['package_pin'][posArray[i]]) % 2 === 0) {
          k = parseInt(this.metadata['package_pin'][posArray[i]]) / 2
        }
        else {
          k = (parseInt(this.metadata['package_pin'][posArray[i]]) - 1) / 2
        }
      }
      else {
        k = k - 1
      }

      if (posArray[i] === 'd_number_pins') {
        box.position.x = ((side === 0) ? -1 : 1) * bbInfo.x * comp.scaling.x
        box.position.z = ((side === 0) ? 1 : -1) * (k * parseFloat(this.metadata['package_pin']['e1_pitch']) - ((parseInt(this.metadata['package_pin']['d_number_pins']) % 2 === 0) ? parseFloat(this.metadata['package_pin']['e1_pitch']) / 2 : 0))
        box.rotation.y = ((side === 0) ? -1 : 1) * Math.PI / 2
      }
      else {
        box.position.z = ((side === 1) ? -1 : 1) * bbInfo.z * comp.scaling.z
        box.position.x = ((side === 1) ? -1 : 1) * (k * parseFloat(this.metadata['package_pin']['e_pitch']) - ((parseInt(this.metadata['package_pin']['e_number_pins']) % 2 === 0) ? parseFloat(this.metadata['package_pin']['e_pitch']) / 2 : 0))
      }

      if (this.metadata['solder_filters']['isDefault'] !== true) {
        box = this._adjustPin(box)
      }

      box.material = pinmaterial
      comp.pins.push(box)
    }
    clone.dispose()

    //  if center of E, recreate array
    if (parseInt(this.metadata['dimensions']['pin_location']) === 1) {
      var auxArrayPins = []
      var nrofPins = 0
      if (parseInt(this.metadata['package_pin']['e_number_pins']) % 2 === 0) {
        nrofPins = parseInt(this.metadata['package_pin']['e_number_pins']) / 2
      }
      else {
        nrofPins = (parseInt(this.metadata['package_pin']['e_number_pins']) + 1) / 2
      }
      var fromVal = comp.pins.length - nrofPins

      for (let i = fromVal; i < comp.pins.length; i++) {
        auxArrayPins.push(comp.pins[i])
      }
      var newLength = comp.pins.length - auxArrayPins.length
      for (let i = 0; i < newLength; i++) {
        auxArrayPins.push(comp.pins[i])
      }
      comp.pins = auxArrayPins
      auxArrayPins = []
    }

    for (let i = 0; i < comp.pins.length; i++) {
      comp.pins[i].setParent(comp)
      comp.pins[i].metadata = {
        'indexPin': i
      }
    }

    this.metadata.pinsNr = comp.pins.length
  }

  this._adjustPin = function (comp) {
    return comp
  }

  //  ADD QFN TERMAL PAD
  this._addTermalPadQFNComp = function (comp) {
    var termalmaterial = new BABYLON.StandardMaterial('pinMaterial', this.scene)
    termalmaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.0)

    var box = BABYLON.Mesh.CreateBox('termalpad', 1.0, this.scene)
    box.scaling.x = parseFloat(this.metadata['package_pin']['e2_max_thermal_range'])
    box.scaling.y = 0.01
    box.scaling.z = parseFloat(this.metadata['package_pin']['d2_max_thermal_range'])

    if (this.metadata['package_power_pins']['add_power_and_ground'] === true) {
      box = this._addPowerPadDimensions(box)
    }

    var bbInfo = comp.getBoundingInfo().boundingBox.extendSize
    var boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

    box.position.y -= (bbInfo.y * comp.scaling.y + boxbbInfo.y * box.scaling.y + parseFloat(this.metadata['dimensions']['min_standoff']))

    box.material = termalmaterial
    box.setParent(comp)
  }

  this._addPowerPadDimensions = function (box) {
    if (parseFloat(this.metadata['package_power_pins']['l2_width']) !== 0) {
      let xpower = null
      let zpower = null
      if (parseFloat(this.metadata['package_power_pins']['b2_power_bar']) !== 0 || parseFloat(this.metadata['package_power_pins']['b3_ground_bar']) !== 0) {
        const z = (parseFloat(this.metadata['package_power_pins']['b2_power_bar']) > parseFloat(this.metadata['package_power_pins']['b3_ground_bar'])) ? parseFloat(this.metadata['package_power_pins']['b2_power_bar']) : parseFloat(this.metadata['package_power_pins']['b3_ground_bar'])
        xpower = BABYLON.Mesh.CreateBox('power', 1.0, this.scene)
        xpower.scaling.x = box.scaling.x + 2 * parseFloat(this.metadata['package_power_pins']['l2_width'])
        xpower.scaling.y = 0.1
        xpower.scaling.z = z
      }
      if (parseFloat(this.metadata['package_power_pins']['b4_power_bar']) !== 0 || parseFloat(this.metadata['package_power_pins']['b5_ground_bar']) !== 0) {
        const x = (parseFloat(this.metadata['package_power_pins']['b4_power_bar']) > parseFloat(this.metadata['package_power_pins']['b5_ground_bar'])) ? parseFloat(this.metadata['package_power_pins']['b4_power_bar']) : parseFloat(this.metadata['package_power_pins']['b5_ground_bar'])
        zpower = BABYLON.Mesh.CreateBox('power', 1.0, this.scene)
        zpower.scaling.x = x
        zpower.scaling.y = 0.1
        zpower.scaling.z = box.scaling.z + 2 * parseFloat(this.metadata['package_power_pins']['l2_width'])
      }

      if (xpower !== null && zpower !== null) {
        return BABYLON.Mesh.MergeMeshes([xpower, zpower, box], true)
      }
      if (xpower === null && zpower !== null) {
        return BABYLON.Mesh.MergeMeshes([zpower, box], true)
      }
      if (xpower !== null && zpower === null) {
        return BABYLON.Mesh.MergeMeshes([xpower, box], true)
      }
    }
    return box
  }

  this._generatePath = function (x, z, diff, onlyCorners = false, index = -1) {
    let path = []
    if (diff === 0) {
      path = [[new BABYLON.Vector3(-x, 0, z), new BABYLON.Vector3(-x, 0, -z)],
        [new BABYLON.Vector3(-x, 0, -z), new BABYLON.Vector3(x, 0, -z)],
        [new BABYLON.Vector3(x, 0, -z), new BABYLON.Vector3(x, 0, z)],
        [new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(-x, 0, z)]]
    }
    else {
      path = [[new BABYLON.Vector3(-x + diff, 0, z), new BABYLON.Vector3(-x, 0, z - diff)],
        [new BABYLON.Vector3(-x, 0, z - diff), new BABYLON.Vector3(-x, 0, -z + diff)],
        [new BABYLON.Vector3(-x, 0, -z + diff), new BABYLON.Vector3(-x + diff, 0, -z)],
        [new BABYLON.Vector3(-x + diff, 0, -z), new BABYLON.Vector3(x - diff, 0, -z)],
        [new BABYLON.Vector3(x - diff, 0, -z), new BABYLON.Vector3(x, 0, -z + diff)],
        [new BABYLON.Vector3(x, 0, -z + diff), new BABYLON.Vector3(x, 0, z - diff)],
        [new BABYLON.Vector3(x, 0, z - diff), new BABYLON.Vector3(x - diff, 0, z)],
        [new BABYLON.Vector3(x - diff, 0, z), new BABYLON.Vector3(-x + diff, 0, z)]]
    }

    if (onlyCorners === true) {
      const offsetX = Math.abs(x / 2)
      const offsetZ = Math.abs(z / 2)

      switch (index) {
        case 0:
          path = [[new BABYLON.Vector3(x, 0, z - offsetZ), new BABYLON.Vector3(x, 0, z - diff)],
            [new BABYLON.Vector3(x, 0, z - diff), new BABYLON.Vector3(x - diff, 0, z)],
            [new BABYLON.Vector3(x - diff, 0, z), new BABYLON.Vector3(x - offsetX, 0, z)]]
          break
        case 1:
          path = [[new BABYLON.Vector3(x, 0, z - offsetZ), new BABYLON.Vector3(x, 0, z - diff)],
            [new BABYLON.Vector3(x, 0, z - diff), new BABYLON.Vector3(x + diff, 0, z)],
            [new BABYLON.Vector3(x + diff, 0, z), new BABYLON.Vector3(x + offsetX, 0, z)]]
          break
        case 2:
          path = [[new BABYLON.Vector3(x, 0, z + offsetZ), new BABYLON.Vector3(x, 0, z + diff)],
            [new BABYLON.Vector3(x, 0, z + diff), new BABYLON.Vector3(x - diff, 0, z)],
            [new BABYLON.Vector3(x - diff, 0, z), new BABYLON.Vector3(x - offsetX, 0, z)]]
          break
        case 3:
          path = [[new BABYLON.Vector3(x, 0, z + offsetZ), new BABYLON.Vector3(x, 0, z + diff)],
            [new BABYLON.Vector3(x, 0, z + diff), new BABYLON.Vector3(x + diff, 0, z)],
            [new BABYLON.Vector3(x + diff, 0, z), new BABYLON.Vector3(x + offsetX, 0, z)]]
          break
      }
    }
    return path
  }

  this.createFootprint = function (comp) {
    const x = parseFloat(this.metadata['dimensions']['e_max_body_span']) / 2
    const z = parseFloat(this.metadata['dimensions']['d_max_body_span']) / 2
    let diff = parseFloat(this.metadata['dimensions']['chamfered_corner'])

    let path = this._generatePath(x, z, diff)

    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = this._createLine(path[i][0], path[i][1], 0.05)
      lines.push(line)
    }

    path = []
    const width = parseFloat(this.metadata['package_pin']['max_lead_width'])
    diff = parseFloat(this.metadata['package_pin']['max_lead_range']) / 6
    for (let i = 0; i < comp.pins.length; i++) {
      const pos = comp.pins[i].getAbsolutePosition().clone().scaleInPlace(1.1)
      let line = this._createLine(new BABYLON.Vector3(pos.x - diff, 0, pos.z), new BABYLON.Vector3(pos.x + diff, 0, pos.z), width)
      line.rotation.y = Math.PI / 2 + comp.pins[i].rotation.y
      lines.push(line)
    }

    if (lines.length > 0) {
      const main = BABYLON.Mesh.MergeMeshes(lines, true)
      const yPos = comp.getHierarchyBoundingVectors(true)
      main.position.y = yPos.min.y + 0.01
      main.material = new BABYLON.StandardMaterial('footprintM', this.scene)
      main.material.diffuseColor = BABYLON.Color3.White()
      main.isVisible = false
      main.metadata = { isFootprint: true }
      main.setParent(comp)
    }
  }

  this._createLine = function (p1, p2, width) {
    var line = BABYLON.MeshBuilder.CreatePlane('footprint', {height: 1, width: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    var dist = parseFloat(Number(BABYLON.Vector3.Distance(p1, p2)).toFixed(2))
    var rotAngle = Math.atan((p1.x - p2.x) / (p1.z - p2.z))

    line.position = BABYLON.Vector3.Center(p1, p2)
    line.rotation = new BABYLON.Vector3(Math.PI / 2, rotAngle + Math.PI / 2, 0)
    line.scaling.y = width
    line.scaling.x = dist + width / 2

    return line
  }

  //  CREATE 2D QFN OBJECT
  this._createQFN2D = function () {
    // body info - green piece
    const box = this._addBodyInfo()

    // silkscreen dimensions - yellow board corners next to body
    this._addSilkScreen(box)

    // add yellow disk for pin position
    this._addYellowDisk(box)

    // add pins
    this._addPinsQFNComp2D(box)

    // courtyard info
    this._addCourtyard(box)

    // assembly info
    this._addAssembly(box)

    // add termalpad
    this._addTermalPadQFNComp2D(box)

    return box
  }

  // create 2d body - pink interior
  this._addBodyInfo = function () {
    var box = BABYLON.Mesh.CreateBox('body', 1.0, this.scene)

    if (this.metadata['courtyard']['isCompBodyCalculated'] === true) {
      box.scaling.x = parseFloat(this.metadata['dimensions']['e_max_body_span'])
      box.scaling.z = parseFloat(this.metadata['dimensions']['d_max_body_span'])
    }
    else {
      box.scaling.x = parseFloat(this.metadata['courtyard']['addCompWidth'])
      box.scaling.z = parseFloat(this.metadata['courtyard']['addCompLength'])
    }
    box.scaling.y = 0.01

    if (parseFloat(this.metadata['dimensions']['chamfered_corner']) !== 0) {
      box = this._addCornersQFNComp(box)
    }

    box.isVisible = this.metadata['courtyard']['addCompBodyInfo']

    var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
    bodymaterial.diffuseColor = BABYLON.Color3.FromHexString(this._layerColor[parseInt(this.metadata['courtyard']['addCompLayer'])])
    bodymaterial.alpha = 0.7
    box.material = bodymaterial

    return box
  }

  // create silk - yellow board corners next to body
  this._addSilkScreen = function (comp) {
    let x, z
    if (this.metadata['silkscreen']['isCalculated'] === true) {
      x = (parseFloat(this.metadata['dimensions']['e_max_body_span']) + parseFloat(this.metadata['silkscreen']['LineWidth']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])) / 2
      z = (parseFloat(this.metadata['dimensions']['d_max_body_span']) + parseFloat(this.metadata['silkscreen']['LineWidth']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])) / 2
    }
    else {
      // this contain body dim + silkscreen dim + assembly dim
      x = parseFloat(this.metadata['silkscreen']['r1']) / 2
      z = parseFloat(this.metadata['silkscreen']['r2']) / 2
    }
    const diff = parseFloat(this.metadata['dimensions']['chamfered_corner'])

    let silks = []
    for (let j = 0; j < 4; j++) {
      let path
      switch (j) {
        case 0:
          path = this._generatePath(x, z, diff, true, j)
          break
        case 1:
          path = this._generatePath(-x, z, diff, true, j)
          break
        case 2:
          path = this._generatePath(x, -z, diff, true, j)
          break
        case 3:
          path = this._generatePath(-x, -z, diff, true, j)
          break
      }

      let lines = []
      for (let i = 0; i < path.length; i++) {
        let line = this._createLine(path[i][0], path[i][1], parseFloat(this.metadata['silkscreen']['LineWidth']))
        lines.push(line)
      }

      if (lines.length > 0) {
        silks.push(BABYLON.Mesh.MergeMeshes(lines, true))
      }
    }

    if (silks.length > 0) {
      const box = BABYLON.Mesh.MergeMeshes(silks, true)
      box.material = new BABYLON.StandardMaterial('footprintM', this.scene)
      box.material.diffuseColor = BABYLON.Color3.Yellow()
      box.setParent(comp)
    }
  }

  // create assembly - pink border
  this._addAssembly = function (comp) {
    let x, z
    if (this.metadata['courtyard']['isAssemblyCalculated'] === true) {
      x = (parseFloat(this.metadata['dimensions']['e_max_body_span']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])) / 2
      z = (parseFloat(this.metadata['dimensions']['d_max_body_span']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])) / 2
    }
    else {
      x = (parseFloat(this.metadata['courtyard']['assemblyA']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])) / 2
      z = (parseFloat(this.metadata['courtyard']['assemblyB']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])) / 2
    }
    const diff = parseFloat(this.metadata['dimensions']['chamfered_corner'])

    let path = this._generatePath(x, z, diff)

    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = this._createLine(path[i][0], path[i][1], parseFloat(this.metadata['courtyard']['assemblyALineWidth']))
      lines.push(line)
    }

    if (lines.length > 0) {
      const box = BABYLON.Mesh.MergeMeshes(lines, true)
      var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
      bodymaterial.diffuseColor = BABYLON.Color3.FromHexString(this._layerColor[parseInt(this.metadata['courtyard']['assemblyBlayer'])])
      box.material = bodymaterial
      box.isVisible = this.metadata['courtyard']['addAssemblyInfo']
      box.setParent(comp)
    }
  }

  this._addCourtyard = function (comp) {
    let x, z
    if (this.metadata['courtyard']['isCourtyardCalculated'] === true) {
      // todo: based on pins position
    }
    else {
      x = (parseFloat(this.metadata['courtyard']['courtV1']) + parseFloat(this.metadata['courtyard']['courtV1LineWidth'])) / 2
      z = (parseFloat(this.metadata['courtyard']['courtV2']) + parseFloat(this.metadata['courtyard']['courtV1LineWidth'])) / 2
    }
    let path = this._generatePath(x, z, 0)

    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = this._createLine(path[i][0], path[i][1], parseFloat(this.metadata['courtyard']['courtV1LineWidth']))
      lines.push(line)
    }

    if (lines.length > 0) {
      const box = BABYLON.Mesh.MergeMeshes(lines, true)
      var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
      bodymaterial.diffuseColor = BABYLON.Color3.FromHexString(this._layerColor[parseInt(this.metadata['courtyard']['courtV2layer'])])
      box.material = bodymaterial
      box.isVisible = this.metadata['courtyard']['addCourtYardInfo']
      box.setParent(comp)
    }
  }

  // add yellow disc based on pin location
  this._addYellowDisk = function (comp) {
    var box = BABYLON.MeshBuilder.CreateDisc('box', {radius: 0.25, tessellation: 64, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    box.rotation.x = Math.PI / 2
    box.material = new BABYLON.StandardMaterial('footprintM', this.scene)
    box.material.diffuseColor = BABYLON.Color3.Yellow()

    var boxbbInfo = comp.getHierarchyBoundingVectors(true)

    if (parseInt(this.metadata['dimensions']['pin_location']) === 1) {
      box.position.z = boxbbInfo.max.z + 1
    }
    else {
      box.position.z = boxbbInfo.max.z
      box.position.x = boxbbInfo.max.x + 1
    }

    box.setParent(comp)
  }

  //  ADD PINS 2D QFN COMPONENT
  this._addPinsQFNComp2D = function (comp) {
    const pinmaterial = new BABYLON.StandardMaterial('pinMaterial', scene)
    pinmaterial.diffuseColor = BABYLON.Color3.Red()

    const totalPins = 2 * parseInt(this.metadata['package_pin']['e_number_pins']) + 2 * parseInt(this.metadata['package_pin']['d_number_pins'])

    let posArray = []
    for (let i = 0; i < totalPins; i++) {
      if (i < parseInt(this.metadata['package_pin']['d_number_pins'])) {
        posArray.push('d_number_pins')
      }
      else if (i < (parseInt(this.metadata['package_pin']['e_number_pins']) + parseInt(this.metadata['package_pin']['d_number_pins']))) {
        posArray.push('e_number_pins')
      }
      else if (i < (parseInt(this.metadata['package_pin']['e_number_pins']) + 2 * parseInt(this.metadata['package_pin']['d_number_pins']))) {
        posArray.push('d_number_pins')
      }
      else {
        posArray.push('e_number_pins')
      }
    }

    const bbInfo = comp.getBoundingInfo().boundingBox.extendSize

    let side = -1
    let k, box
    const clone = this._getPin()
    for (let i = 0; i < totalPins; i++) {
      box = clone.clone()
      box.isVisible = true

      if (i === 0 || (i > 0 && posArray[i] !== posArray[i - 1])) {
        side++
        if (parseInt(this.metadata['package_pin'][posArray[i]]) % 2 === 0) {
          k = parseInt(this.metadata['package_pin'][posArray[i]]) / 2
        }
        else {
          k = (parseInt(this.metadata['package_pin'][posArray[i]]) - 1) / 2
        }
      }
      else {
        k = k - 1
      }

      if (posArray[i] === 'd_number_pins') {
        box.position.x = ((side === 0) ? -1 : 1) * bbInfo.x * comp.scaling.x
        box.position.z = ((side === 0) ? 1 : -1) * (k * parseFloat(this.metadata['package_pin']['e1_pitch']) - ((parseInt(this.metadata['package_pin']['d_number_pins']) % 2 === 0) ? parseFloat(this.metadata['package_pin']['e1_pitch']) / 2 : 0))
        box.rotation.y = ((side === 0) ? -1 : 1) * Math.PI / 2
      }
      else {
        box.position.z = ((side === 1) ? -1 : 1) * bbInfo.z * comp.scaling.z
        box.position.x = ((side === 1) ? -1 : 1) * (k * parseFloat(this.metadata['package_pin']['e_pitch']) - ((parseInt(this.metadata['package_pin']['e_number_pins']) % 2 === 0) ? parseFloat(this.metadata['package_pin']['e_pitch']) / 2 : 0))
      }

      if (this.metadata['solder_filters']['isDefault'] !== true) {
        box = this._adjustPin(box)
      }
      box.material = pinmaterial
      box.setParent(comp)
    }
    clone.dispose()
  }

  this._getPin = function () {
    const x = parseFloat(this.metadata['package_pin']['max_lead_width'])
    const y = parseFloat(this.metadata['package_pin']['max_lead_height'])
    const z = parseFloat(this.metadata['package_pin']['max_lead_range'])

    let box
    if (parseInt(this.metadata['footprint_dimension']['pad_shape']) !== 0) {
      box = BABYLON.MeshBuilder.CreateBox('pin', {width: x, height: y, depth: z}, this.scene)
    }
    else {
      var cylinder = BABYLON.MeshBuilder.CreateBox('pin', {width: x, height: y, depth: (z - x)}, this.scene)
      var sphere = BABYLON.Mesh.CreateCylinder('cylinder', y, x, x, 32, 1, this.scene, false)
      var sphere2 = sphere.clone('sphere2')

      sphere.position.z = (z - x) / 2
      sphere2.position.z = -(z - x) / 2

      const innerCSG = BABYLON.CSG.FromMesh(cylinder)
      cylinder.dispose()
      const innerCSG2 = BABYLON.CSG.FromMesh(sphere)
      sphere.dispose()
      const innerCSG3 = BABYLON.CSG.FromMesh(sphere2)
      sphere2.dispose()

      const subCSG = innerCSG.union(innerCSG2).union(innerCSG3)

      scene.removeMesh(innerCSG)
      scene.removeMesh(innerCSG2)
      scene.removeMesh(innerCSG3)

      box = subCSG.toMesh('shape', null, this.scene)
    }

    box.isVisible = false
    return box
  }

  //  ADD 2D QFN TERMAL PAD
  this._addTermalPadQFNComp2D = function (comp) {
    var termalmaterial = new BABYLON.StandardMaterial('termalMaterial', scene)
    termalmaterial.diffuseColor = new BABYLON.Color3(0.99, 0.0, 0.0)

    var box = BABYLON.Mesh.CreateBox('termalpad', 1.0, scene)
    box.scaling.x = parseFloat(this.metadata['package_pin']['e2_max_thermal_range'])
    box.scaling.y = 0.01
    box.scaling.z = parseFloat(this.metadata['package_pin']['d2_max_thermal_range'])

    if (this.metadata['package_power_pins']['add_power_and_ground'] === true) {
      box = this._addPowerPadDimensions(box)
    }

    box.material = termalmaterial
    box.setParent(comp)

    if (parseFloat(this.metadata['package_pin']['e2_max_thermal_range']) < 1.5 || parseFloat(this.metadata['package_pin']['d2_max_thermal_range']) < 1.5) {
      return
    }

    var posX = parseInt((parseFloat(this.metadata['package_pin']['e2_max_thermal_range']) - 1.5) / 2.2) + 2
    var posZ = parseInt((parseFloat(this.metadata['package_pin']['d2_max_thermal_range']) - 1.5) / 2.2) + 2

    var fromP = (posX % 2 === 0) ? 0.75 : 0
    var toP = (posZ % 2 === 0) ? 0.75 : 0

    for (var i = fromP; i < posX / 2; i++) {
      for (var j = toP; j < posZ / 2; j++) {
        var discmaterial = new BABYLON.StandardMaterial('pinMaterial', scene)
        discmaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6)
        discmaterial.alpha = 0.8

        this._createPadLeg(new BABYLON.Vector3(i, -1, j), discmaterial, box)
        this._createPadLeg(new BABYLON.Vector3(-i, -1, j), discmaterial, box)
        this._createPadLeg(new BABYLON.Vector3(i, -1, -j), discmaterial, box)
        this._createPadLeg(new BABYLON.Vector3(-i, -1, -j), discmaterial, box)
      }
    }
  }

  // usefull infos
  this.calculate = function () {
    this.metadata['silkscreen']['r1'] = parseFloat(this.metadata['dimensions']['e_max_body_span']) + parseFloat(this.metadata['silkscreen']['LineWidth']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])
    this.metadata['silkscreen']['r2'] = parseFloat(this.metadata['dimensions']['d_max_body_span']) + parseFloat(this.metadata['silkscreen']['LineWidth']) + parseFloat(this.metadata['courtyard']['assemblyALineWidth'])
    this.metadata['package_heel']['semin'] = parseFloat(this.metadata['dimensions']['e_max_body_span']) - 2 * parseFloat(this.metadata['package_pin']['max_lead_range'])
    this.metadata['package_heel']['sdmin'] = parseFloat(this.metadata['dimensions']['d_max_body_span']) - 2 * parseFloat(this.metadata['package_pin']['max_lead_range'])
    this.metadata['package_heel']['semax'] = parseFloat(this.metadata['package_heel']['semin']) - parseFloat(this.metadata['component_tolerances']['e_heel_distance'])
    this.metadata['package_heel']['sdmax'] = parseFloat(this.metadata['package_heel']['sdmin']) - parseFloat(this.metadata['component_tolerances']['d_heel_distance'])
    this.metadata['component_tolerances']['d_overall_width'] = parseFloat(this.metadata['dimensions']['d_max_body_span']) - parseFloat(this.metadata['dimensions']['d_max_body_span'])
    this.metadata['component_tolerances']['e_overall_width'] = parseFloat(this.metadata['dimensions']['e_max_body_span']) - parseFloat(this.metadata['dimensions']['e_max_body_span'])
    this.metadata['component_tolerances']['lead_width'] = parseFloat(this.metadata['package_pin']['max_lead_width']) - parseFloat(this.metadata['package_pin']['min_lead_width'])
    // to do: calculate component_tolerances heel_distance
    // this.metadata['component_tolerances']['d_heel_distance'] = parseFloat(this.metadata['component_tolerances']['d_overall_width']) +
    // this.metadata['component_tolerances']['e_heel_distance'] = parseFloat(this.metadata['component_tolerances']['e_overall_width']) +
  }

  // ADD 2D QFN TERMAL PAD LEGS
  this._createPadLeg = function (pos, mat, parent) {
    var disc = BABYLON.MeshBuilder.CreateDisc('box', {radius: 0.3, tessellation: 64, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    disc.rotation.x = Math.PI / 2
    disc.position = pos
    disc.material = mat
    disc.setParent(parent)
  }

  this.getMax = function (param) {
    let xArray = []
    let yArray = []
    for (var i = 0; i < param.length; i++) {
      xArray.push(parseFloat(param[i].position.x * param[i].parent.scaling.x))
      yArray.push(parseFloat(param[i].position.z * param[i].parent.scaling.z))
    }

    return [Math.max.apply(Math, xArray), Math.max.apply(Math, yArray)]
  }

  this.sendData = function () {
    let bnds = this.object3D.getHierarchyBoundingVectors(true)
    const xSize = Math.abs(bnds.max.x) + Math.abs(bnds.min.x)
    const zSize = Math.abs(bnds.max.z) + Math.abs(bnds.min.z)
    this.metadata['size'] = [xSize, zSize]

    console.log('todo: values are not ok, need to recreate it')
    const pins = this.object3D.getChildren()[0].pins
    var totalPins = pins.length

    const getMax = this.getMax(pins)

    let arrayPins = []
    for (var i = 0; i < totalPins; i++) {
      arrayPins.push([0, parseFloat(Number(pins[i].position.x * pins[i].parent.scaling.x + getMax[0]).toFixed(4)), parseFloat(Number(pins[i].position.z * pins[i].parent.scaling.z + getMax[1]).toFixed(4)), parseFloat(this.metadata['package_pin']['max_lead_width']), parseFloat(this.metadata['package_pin']['max_lead_range']), 0])
    }

    this.metadata['layer1'] = ['Layer 1', arrayPins]

    this.metadata['layer21'] = ['Layer 21', []]

    const returnArray = ['Layer 1', arrayPins]

    console.log(this.metadata)
    console.log(JSON.stringify(returnArray))
    return returnArray
  }

  this.view2D = function (param) {
    this.sendData()
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
    this._initQFN()
  }

  this._initQFN()

  return this
}
