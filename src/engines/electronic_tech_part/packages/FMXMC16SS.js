/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from '../component'
import { DrawText } from '../../general/Utils'

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

  this._initFMXMC16SS = function () {
    //  add Marian - need to come from formFMXMC16SS
    this.metadata['rotY'] = true
    this.metadata['rotZ'] = false
    this.metadata['boundScaleX'] = 0.1
    this.metadata['boundScaleY'] = 0
    this.metadata['boundScaleZ'] = 0.1
    this.metadata['pinsNr'] = 0
    this.metadata['componentName'] = ''
    this.metadata['isPart'] = true
    this.metadata['text'] = {
      'name': this.metadata['name'], // maybe come from somewhere or technician put it
      'settings': [512, 400, 0, 60, true, '#555555', '#ffffff'] // size, maxWidth, rotation, font-size, invertY, backgroundColor, and text color
    }

    this.bodyPlus = 0.05
    this.shadowPlus = 0.05
    this.pinWidthPlus = 0.05
    this.pinLengthPlus = 0.05

    this.object3D = this._createFMXMC16SS3D()
    this.object3D.metadata = this.metadata

    this.sendData()

    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this)
    }
  }

  // CREATE 3D FMXMC16SS OBJECT
  this._createFMXMC16SS3D = function () {
    var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
    // bodymaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3)
    bodymaterial.diffuseTexture = new DrawText(this.scene, this.metadata['text'].name, this.metadata['text'].settings)

    let faceUV = new Array(6)
    for (let i = 0; i < 6; i++) {
      faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0)
    }
    faceUV[4] = new BABYLON.Vector4(0, 0, 1, 1)

    var options = {
      width: parseFloat(this.metadata['dimensions']['max_body_range_e']),
      height: parseFloat(this.metadata['dimensions']['maxHeight']) - parseFloat(this.metadata['dimensions']['maxStandHeight']),
      depth: parseFloat(this.metadata['dimensions']['max_body_range_d']),
      faceUV: faceUV
    }

    var box = BABYLON.MeshBuilder.CreateBox('body', options, this.scene)
    box = this._addCornersQFNComp(box)

    this._addPinsFMXMC16SSComp(box)

    box.material = bodymaterial

    this._createFMXMC16SS2D(box)

    // create an empty mesh to hold the entire components
    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = 'FMXMC16SS' // this.metadata['name'] + this.metadata['part'] + this.metadata['id']
    box.setParent(mesh)

    return mesh
  }

  // ADD CORNERS QFN COMPONENT
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
      var mesh = BABYLON.Mesh.CreateBox('box', 0.3, this.scene)
      mesh.position = vectors[i]
      mesh.rotation.y = Math.PI / 4
      mesh.scaling.y = 10
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

  // ADD PINS FMXMC16SS COMPONENT
  this._addPinsFMXMC16SSComp = function (comp) {
    comp.pins = []
   
    let totalPins = 4

    let box
    let clone
    for (let i = 0; i < totalPins; i++) {
      clone = this._getPin()
      box = clone.clone()
      box.isVisible = true

      var bbInfo = comp.getBoundingInfo().boundingBox.extendSize
      var boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

      box.position.y -= (bbInfo.y + boxbbInfo.y + parseFloat(this.metadata['dimensions']['maxStandHeight']))
      box.position.z = ((i % 2 === 0) ? -1 : 1) * (parseFloat(this.metadata['package_pin']['e1_pitch']) / 2 + boxbbInfo.z)
      box.position.x = ((i < 2) ? 1 : -1) * (parseFloat(this.metadata['package_pin']['e2_pitch']) / 2 + boxbbInfo.x)

      box.material = clone.material.clone('pinMaterial_' + i)
      comp.pins.push(box)
    }
    clone.dispose(false, true)
    
    comp.pins = this._sortPins(comp.pins)
    comp.pins = this._resortOnClick(comp.pins)
    
    for (let i = 0; i < comp.pins.length; i++) {
      comp.pins[i].material.diffuseTexture = new DrawText(this.scene, (i + 1).toString(), [64, 64, 0, 16, true, '#cfcfcf', '#000000'], true)
      const metadata = Object.assign({}, comp.pins[i].metadata, {'indexPin': (i + 1)})
      comp.pins[i].metadata = metadata
      comp.pins[i].setParent(comp)
    }

    // first pin for this package is botom right
    this.metadata.pinsNr = comp.pins.length
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
      let auxPinsArray = []
      for (let i = 0; i < data.length; i++) {
        if (i < data.length / 2) {
          sortPins.push(data[i])
        }
        else {
          auxPinsArray.push(data[i])
        }
      }

      auxPinsArray.reverse()
      for (let i = 0; i < auxPinsArray.length; i++) {
        sortPins.push(auxPinsArray[i])
      }
    }
    else {
      let auxPinsArray = []
      for (let i = 0; i < data.length; i++) {
        if (i >= data.length / 2) {
          sortPins.push(data[i])
        }
        else {
          auxPinsArray.push(data[i])
        }
      }

      const auxPins2 = auxPinsArray.reverse()
      sortPins = auxPins2.concat(sortPins)
    }

    return sortPins
  }

  //  CREATE 2D FMXMC16SS OBJECT
  this._createFMXMC16SS2D = function (comp) {
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

    const x = dimensions[0] / 2 + (this.pinWidthPlus + this.shadowPlus) + parseFloat(this.metadata['silkscreen']['LineWidth'])
    const z = dimensions[2] / 2 + (this.pinLengthPlus + this.shadowPlus) /2 + parseFloat(this.metadata['silkscreen']['LineWidth'])
    let silks = []
    const path = [[new BABYLON.Vector3(-x, 0, z), new BABYLON.Vector3(-x, 0, -z)],
      [new BABYLON.Vector3(-x, 0, -z), new BABYLON.Vector3(x, 0, -z)],
      [new BABYLON.Vector3(x, 0, -z), new BABYLON.Vector3(x, 0, z)],
      [new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(-x, 0, z)]]

    comp.path2d = path
    let lines = []
    for (let i = 0; i < path.length; i++) {
      let line = Component._createLine(path[i][0], path[i][1], parseFloat(this.metadata['silkscreen']['LineWidth']), this.scene)
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
    const width = parseFloat(this.metadata['package_pin']['l1_body_width_max'])
    const length = parseFloat(this.metadata['package_pin']['b1_body_width_max'])
    const box = Component._create2DShape(0, width, length, 0.01, this.scene)
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
    this.metadata['boundScaleY'] += parseFloat(bnds.max.y + 0.1)
    this.metadata['boundScaleZ'] += parseFloat(Number(zSize / 2).toFixed(4))

    // this.object3D.getChildren()[0]._boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-this.metadata.boundScaleX, -this.metadata.boundScaleY, -this.metadata.boundScaleZ), new BABYLON.Vector3(this.metadata.boundScaleX, this.metadata.boundScaleY, this.metadata.boundScaleZ))
    // this.object3D.getChildren()[0].showBoundingBox = true
    // console.log(this.object3D.getChildren()[0])

    const pins = this.object3D.getChildren()[0].pins
 
    let arrayPins = []
    let arrayPins2 = []

    const x = xSize / 2
    const z = zSize / 2

    const diff = new BABYLON.Vector3(parseFloat(Number(pins[2].getAbsolutePosition().x + x - pins[2].metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(pins[2].getAbsolutePosition().z + z - pins[2].metadata.Flength / 2).toFixed(4)))
    
    if (this.scaleFromLayer1) {
      for (let i = 0; i < pins.length; i++) {
        arrayPins.push([0, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(4)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(4)), parseFloat(Number(pins[i].metadata.Flength).toFixed(4)), 0])
      }

      const path = this.object3D.getChildren()[0].path2d
      arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[0][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[1][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[1][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[2][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[2][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[3][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[3][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0]]
    }
    else {
      for (let i = 0; i < pins.length; i++) {
        arrayPins.push([0, parseFloat(Number(pins[i].getAbsolutePosition().x + x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z).toFixed(4)), parseFloat(Number(pins[i].metadata.width).toFixed(4)), parseFloat(Number(pins[i].metadata.length).toFixed(4)), 0])
      }

      arrayPins2 = [[0, parseFloat(Number(2 * z).toFixed(4)), 0, 0, parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [0, 0, parseFloat(Number(2 * x).toFixed(4)), 0, parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(2 * x).toFixed(4)), 0, parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4)), 0, parseFloat(Number(2 * z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0]]
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
    this._initFMXMC16SS()
  }

  this._initFMXMC16SS()

  return this
}
