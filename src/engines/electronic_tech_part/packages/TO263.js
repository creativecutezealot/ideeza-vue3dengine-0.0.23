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

  this._initTO263 = function () {
    //  add Marian - need to come from formTO263
    this.metadata['rotY'] = true
    this.metadata['rotZ'] = false
    this.metadata['boundScaleX'] = -0.2
    this.metadata['boundScaleY'] = 0 // FOR SMD
    this.metadata['boundScaleZ'] = -0.2
    this.metadata['pinsNr'] = 0
    this.metadata['componentName'] = ''
    this.metadata['isPart'] = true
    this.metadata['text'] = {
      'name': this.metadata['name'], // maybe come from somewhere or technician put it
      'settings': [512, 200, Math.PI / 2, 60, true, '#555555', '#ffffff'] // size, maxWidth, rotation, font-size, invertY, backgroundColor, and text color
    }

    this.bodyPlus = 0.05
    this.shadowPlus = 0.05
    this.pinWidthPlus = 0.05
    this.pinLengthPlus = 0.05
    this.resolution = 16
    this.startedPin = null

    this.object3D = this._createTO2633D()
    this.object3D.metadata = this.metadata

    this.sendData()

    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this) 
    }
  }

  //  CREATE 3D TO263 OBJECT
  this._createTO2633D = function () {
    var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
    // bodymaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3)
    bodymaterial.diffuseTexture = new DrawText(this.scene, this.metadata['text'].name, this.metadata['text'].settings)

    let faceUV = new Array(6)
    for (let i = 0; i < 6; i++) {
      faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0)
    }
    faceUV[4] = new BABYLON.Vector4(0, 0, 1, 1)

    var options = {
      width: parseFloat(this.metadata['dimensions']['bodyWidthRange_e1_max']),
      height: parseFloat(this.metadata['dimensions']['maxHeightA']) - parseFloat(this.metadata['dimensions']['minStandofHeight']),
      depth: parseFloat(this.metadata['dimensions']['bodyLengthRange_e1_max']),
      faceUV: faceUV
    }

    var box = BABYLON.MeshBuilder.CreateBox('body', options, this.scene)

    this._addPinsTO263Comp(box)

    box.material = bodymaterial

    this._createTO2632D(box)
    console.log(box)

    // create an empty mesh to hold the entire components
    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = 'TO263' // this.metadata['name'] + this.metadata['part'] + this.metadata['id']
    box.setParent(mesh)

    return mesh
  }

  //  ADD PINS TO263 COMPONENT
  this._addPinsTO263Comp = function (comp) {
    comp.pins = []

    let totalPins = parseInt(this.metadata['package_pin']['leadNumber'])
    if (totalPins < 1) {
      console.log('Error: No enought number of pins')
      return
    }

    let box
    let boxbbInfo
    const clone = this._getPin()
    const bbInfo = comp.getBoundingInfo().boundingBox.extendSize
    for (let i = 0; i < (totalPins - 1); i++) {
      box = clone.clone()
      box.isVisible = true

      boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

      box.position.y -= (bbInfo.y + boxbbInfo.y + parseFloat(this.metadata['dimensions']['minStandofHeight']))

      const diff = parseFloat(this.metadata['package_pin']['pitch'])
      const k = parseInt(totalPins - 1)
      if (k % 2 !== 0) {
        box.position.z = (i % k) * diff - diff * ((k / 2 < 1) ? 0 : parseInt(k / 2))
      }
      else {
        box.position.z = (i % k) * diff + diff / 2 - diff * parseInt(k / 2)
      }

      box.position.x = -(bbInfo.x + boxbbInfo.x)

      box.material = clone.material.clone('pinMaterial_' + i)
      comp.pins.push(box)

      if (i === 0) {
        this.startedPin = box
      }
    }
    clone.dispose(false, true)

    box = Component._create2DShape(0, parseFloat(this.metadata['package_pin']['lead_span_max']), parseFloat(this.metadata['package_pin']['lead_span2_max']), 0.1, this.scene)

    box.metadata = {
      'width': parseFloat(this.metadata['package_pin']['lead_span_max']),
      'length': parseFloat(this.metadata['package_pin']['lead_span2_max'])
    }
    
    boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

    box.position.y -= (bbInfo.y + boxbbInfo.y + parseFloat(this.metadata['dimensions']['minStandofHeight']))
    box.position.z = 0
    box.position.x = (parseFloat(this.metadata['dimensions']['bodyWidthRange_e1_max']) - parseFloat(this.metadata['package_pin']['lead_span_max'])) / 2 + parseFloat(this.metadata['package_pin']['lead_span3_max'])

    box.material = new BABYLON.StandardMaterial('pinMaterial', this.scene)
    comp.pins.push(box)

    comp.pins = this._sortPins(comp.pins)
    comp.pins = this._resortOnClick(comp.pins)
    
    for (let i = 0; i < comp.pins.length; i++) {
      comp.pins[i].material.diffuseTexture = new DrawText(this.scene, (i + 1).toString(), [64, 64, 0, 16, true, '#cfcfcf', '#000000'], true)
      const metadata = Object.assign({}, comp.pins[i].metadata, {'indexPin': (i + 1)})
      comp.pins[i].metadata = metadata
      comp.pins[i].setParent(comp)
    }

    // first pin for this package is bottom left
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
      sortPins = data
    }
    else {
      let auxPinsArray = []
      for (let i = 0; i < data.length; i++) {
        if (i >= data.length - 1) {
          sortPins.push(data[i])
        }
        else {
          auxPinsArray.push(data[i])
        }
      }

      const auxPins2 = auxPinsArray.reverse()
      sortPins = auxPins2.concat(sortPins)
    }
    
    /*if (sortPins[3]) {
      return [sortPins[0], sortPins[2], sortPins[1], sortPins[3]]
    }
    else {
      return sortPins
    }*/
    return sortPins
  }

  //  CREATE 2D TO263 OBJECT
  this._createTO2632D = function (comp) {
    let meshes = []
    meshes.push(this._createBorder(comp))

    const pins = comp.pins
    var totalPins = pins.length

    for (let i = 0; i < totalPins; i++) {
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
      // box1.rotation.y = comp.pins[i].rotation.y

      meshes.push(box1)

      // PINS
      const box3 = Component._create2DShape(0, width + this.pinWidthPlus, length + this.pinLengthPlus, 0.001, this.scene)

      box3.position = box1.position
      // box3.rotation.y = box1.rotation.y

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
    // const offset = parseFloat(this.metadata['package_pin']['lead_width_l_max']) / 2 - parseFloat(this.metadata['package_pin']['lead_span_max'])
    const bnds = comp.getHierarchyBoundingVectors(true)
    const dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]
    
    this.metadata['size'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[1]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]

    const x = dimensions[0] / 2 + (this.pinWidthPlus + this.shadowPlus) + parseFloat(this.metadata['silkscreen']['LineWidth'])
    const z = parseFloat(this.metadata['dimensions']['bodyWidthRange_e1_max']) / 2 + (this.pinLengthPlus + this.shadowPlus) + parseFloat(this.metadata['silkscreen']['LineWidth'])

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
    const depth = parseFloat(this.metadata['package_pin']['lead_width_b_max'])
    let width = parseFloat(this.metadata['package_pin']['lead_width_l_max'])

    const box = Component._create2DShape(0, width, depth, 0.1, this.scene)
    box.material = new BABYLON.StandardMaterial('pinMaterial', this.scene)
    
    box.metadata = {
      'width': width,
      'length': depth
    }
    
    box.isVisible = false
    return box
  }
    
  this.sendData = function () {
    // const offset = parseFloat(this.metadata['package_pin']['lead_width_l_max']) / 2 - parseFloat(this.metadata['package_pin']['lead_span_max'])
    let bnds = this.object3D.getHierarchyBoundingVectors(true)
    const xSize = Math.abs(bnds.max.x) + Math.abs(bnds.min.x)
    const zSize = Math.abs(bnds.max.z) + Math.abs(bnds.min.z)

    this.metadata['boundScaleX'] += parseFloat(Number(xSize / 2).toFixed(4))
    this.metadata['boundScaleY'] += parseFloat(bnds.max.y + parseFloat(this.metadata['dimensions']['minStandofHeight']) + 0.1) // pins height -0.1
    this.metadata['boundScaleZ'] += parseFloat(Number(zSize / 2).toFixed(4))

    // this.object3D.getChildren()[0]._boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-this.metadata.boundScaleX - offset, -this.metadata.boundScaleY, -this.metadata.boundScaleZ), new BABYLON.Vector3(this.metadata.boundScaleX - offset, this.metadata.boundScaleY, this.metadata.boundScaleZ))
    // this.object3D.getChildren()[0].showBoundingBox = true
    // console.log(this.object3D.getChildren()[0])

    const pins = this.object3D.getChildren()[0].pins

    let arrayPins = []
    let arrayPins2 = []

    const x = xSize / 2
    const z = zSize / 2

    let diff = new BABYLON.Vector3(parseFloat(Number(pins[0].getAbsolutePosition().x + x - pins[0].metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(pins[pins.length - 1].getAbsolutePosition().z + z - pins[pins.length - 1].metadata.Flength / 2).toFixed(4)))

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
        arrayPins.push([0, parseFloat(Number(pins[i].getAbsolutePosition().x + x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z).toFixed(4)), parseFloat(Number(pins[i].metadata.length).toFixed(4)), parseFloat(Number(pins[i].metadata.width).toFixed(4)), 0])
      }

      arrayPins2 = [[0, parseFloat(Number(2 * z).toFixed(4)), 0, 0, parseFloat(this.metadata['silkscreen']['lineWidth']), 0],
        [0, 0, parseFloat(Number(2 * x).toFixed(4)), 0, parseFloat(this.metadata['silkscreen']['lineWidth']), 0],
        [parseFloat(Number(2 * x).toFixed(4)), 0, parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4)), parseFloat(this.metadata['silkscreen']['lineWidth']), 0],
        [parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4)), 0, parseFloat(Number(2 * z).toFixed(4)), parseFloat(this.metadata['silkscreen']['lineWidth']), 0]]
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
    this._initTO263()
  }

  this._initTO263()

  return this
}
