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

  this._initSimSocket = function () {
    //  add Marian - need to come from formSimSocket
    this.metadata['rotY'] = true
    this.metadata['rotZ'] = false
    this.metadata['boundScaleX'] = 0.1
    this.metadata['boundScaleY'] = 0
    this.metadata['boundScaleZ'] = 0.1
    this.metadata['pinsNr'] = 0
    this.metadata['componentName'] = ''
    this.metadata['isPart'] = true
    this.metadata['externalObject'] = {
      'name': 'SimSocket',
      'url': 'http://159.65.236.201/part/OqSjBpigZiTNwXYPBHsMRFXo0P0QUCQV/3dobject.babylon',
      'position': BABYLON.Vector3.Zero()
    }
    this.metadata['text'] = {
      'name': this.metadata['name'], // maybe come from somewhere or technician put it
      'settings': [512, 400, 0, 60, true, '#555555', '#ffffff'] // size, maxWidth, rotation, font-size, invertY, backgroundColor, and text color
    }

    this.bodyPlus = parseFloat(this.metadata['silkscreen']['LineWidth']) / 2 // 0.05
    this.shadowPlus = 0.1
    this.pinWidthPlus = 0.1
    this.pinLengthPlus = 0.1
    this.offsetX = 0
    this.offsetZ = 0

    this.object3D = this._createSimSocket3D()
    this.object3D.metadata = this.metadata

    this.sendData()

    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this)
    }
  }

  //  CREATE 3D SimSocket OBJECT
  this._createSimSocket3D = function () {
    var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
    // bodymaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3)
    bodymaterial.diffuseTexture = new DrawText(this.scene, this.metadata['text'].name, this.metadata['text'].settings)

    var box = this._createBody()

    box.position.x = this.offsetX
    box.position.z = this.offsetZ

    this._addPinsSimSocketComp(box)

    box.material = bodymaterial

    this._createSimSocket2D(box)
    box.position = BABYLON.Vector3.Zero()

    // create an empty mesh to hold the entire components
    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = 'SimSocket' // this.metadata['name'] + this.metadata['part'] + this.metadata['id']
    box.setParent(mesh)

    return mesh
  }

  this._createBody = function () {
    const cardDimW = 10
    const cardDimD = 14
    const cardDimH = 0.8

    let faceUV = new Array(6)
    for (let i = 0; i < 6; i++) {
      faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0)
    }
    faceUV[4] = new BABYLON.Vector4(0, 0, 1, 1)

    var options = {
      width: parseFloat(this.metadata['dimensions']['e_max_lead_span']),
      height: parseFloat(this.metadata['dimensions']['maximum_height']),
      depth: parseFloat(this.metadata['dimensions']['d_max_lead_span']),
      faceUV: faceUV
    }

    let box = BABYLON.MeshBuilder.CreateBox('body', options, this.scene)

    let faceUV2 = new Array(6)
    for (let i = 0; i < 6; i++) {
      faceUV2[i] = new BABYLON.Vector4(0, 0, 0, 0)
    }

    var options2 = {
      width: cardDimW,
      height: cardDimH,
      depth: cardDimD,
      faceUV: faceUV2
    }
    const box2 = BABYLON.MeshBuilder.CreateBox('body', options2, this.scene)
    box2.position = new BABYLON.Vector3(-0.4, 0, -2)
    this.metadata['externalObject']['position'] = box2.position
    box = Component._createHoles(box, box2, this.scene)
    return box
  }

  //  ADD PINS SimSocket COMPONENT
  this._addPinsSimSocketComp = function (comp) {
    comp.pins = []
    
    var totalPins = parseInt(this.metadata['package_pin']['e_number_pins'])

    let box
    const clone = this._getPin()
    const leftStart = 3.72
    var bbInfo = comp.getBoundingInfo().boundingBox.extendSize
    for (let i = 0; i < totalPins; i++) {
      box = clone.clone()
      box.isVisible = true

      // var boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

      box.position.y = -(bbInfo.y + parseFloat(this.metadata['dimensions']['min_standoff']))
      box.position.z = -(bbInfo.z + this.offsetZ)

      box.position.x = -bbInfo.x + leftStart + i * parseFloat(this.metadata['package_pin']['pitch']) + this.offsetX

      box.material = clone.material.clone('pinMaterial_' + i)
      comp.pins.push(box)
    }
    clone.dispose(false, true)

    for (let i = 0; i < 2; i++) {
      const box1 = Component._create2DShape(0, 1, 1.2, 0.1, this.scene)

      box1.metadata = {
        'width': 1,
        'length': 1.2
      }

      box1.position.y = -(bbInfo.y + 0.1)
      box1.position.z = 3.075

      if (i === 0) {
        box1.position.x = -bbInfo.x
      }
      else {
        box1.position.x = bbInfo.x
      }

      box1.material = new BABYLON.StandardMaterial('pinMaterial_' + i, this.scene)
      comp.pins.push(box1)
    }

    for (let i = 0; i < comp.pins.length; i++) {
      comp.pins[i].material.diffuseTexture = new DrawText(this.scene, (i + 1).toString(), [64, 64, 0, 16, true, '#cfcfcf', '#000000'], true)
      const metadata = Object.assign({}, comp.pins[i].metadata, {'indexPin': (i + 1)})
      comp.pins[i].metadata = metadata
      comp.pins[i].setParent(comp)
    }

    // first pin for this package is bottom left
    this.metadata.pinsNr = comp.pins.length
  }

  //  CREATE 2D SimSocket OBJECT
  this._createSimSocket2D = function (comp) {
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
      let box3
      if (i < comp.pins.length - 2) {
        box3 = Component._create2DShape(0, width + this.pinWidthPlus, length + this.pinLengthPlus, 0.001, this.scene)
      }
      else {
        box3 = Component._create2DShape(0, width + this.pinWidthPlus, length + this.pinLengthPlus, 0.001, this.scene)
        const box4 = Component._create2DShape(1, width + 0.05, length + 0.05, 0.001, this.scene)

        box3 = Component._createHoles(box3, box4, this.scene)
      }

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
    const path = [[new BABYLON.Vector3(-x + this.offsetX, 0, z + this.offsetZ), new BABYLON.Vector3(-x + this.offsetX, 0, -z + this.offsetZ)],
      [new BABYLON.Vector3(-x + this.offsetX, 0, -z + this.offsetZ), new BABYLON.Vector3(x + this.offsetX, 0, -z + this.offsetZ)],
      [new BABYLON.Vector3(x + this.offsetX, 0, -z + this.offsetZ), new BABYLON.Vector3(x + this.offsetX, 0, z + this.offsetZ)],
      [new BABYLON.Vector3(x + this.offsetX, 0, z + this.offsetZ), new BABYLON.Vector3(-x + this.offsetX, 0, z + this.offsetZ)]]

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
    const width = parseFloat(this.metadata['package_pin']['max_lead_width'])
    const length = parseFloat(this.metadata['package_pin']['max_lead_length'])

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
    this.metadata['boundScaleY'] += parseFloat(bnds.max.y + parseFloat(this.metadata['dimensions']['min_standoff']) + 0.1) // pins height -0.1
    this.metadata['boundScaleZ'] += parseFloat(Number(zSize / 2).toFixed(4))

    // this.object3D.getChildren()[0]._boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-this.metadata.boundScaleX, -this.metadata.boundScaleY, -this.metadata.boundScaleZ), new BABYLON.Vector3(this.metadata.boundScaleX, this.metadata.boundScaleY, this.metadata.boundScaleZ))
    // this.object3D.getChildren()[0].showBoundingBox = true
    // console.log(this.object3D.getChildren()[0])

    const pins = this.object3D.getChildren()[0].pins
    // not defined
    const getMax = [0,0]

    let arrayPins = []
    let arrayPins2 = []

    const x = xSize / 2
    const z = zSize / 2

    const diff = new BABYLON.Vector3(parseFloat(Number(pins[6].getAbsolutePosition().x + x - pins[6].metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(pins[0].getAbsolutePosition().z + z - pins[0].metadata.Flength / 2).toFixed(4)))

    if (this.scaleFromLayer1) {
      for (let i = 0; i < pins.length; i++) {
        if (i < pins.length - 2) {
          arrayPins.push([0, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(4)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(4)), parseFloat(Number(pins[i].metadata.Flength).toFixed(4)), 0])
        }
        else {
          arrayPins.push([1, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(4)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(4)), 0, 0])
        }
      }
      const path = this.object3D.getChildren()[0].path2d
      arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[0][0].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(Number(path[0][1].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[0][1].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[1][0].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[1][0].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(Number(path[1][1].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[1][1].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[2][0].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[2][0].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(Number(path[2][1].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[2][1].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[3][0].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[3][0].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(Number(path[3][1].x + x - diff.x - this.offsetX).toFixed(4)), parseFloat(Number(path[3][1].z + z - diff.z - this.offsetZ).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0]]
    }
    else {
      for (let i = 0; i < pins.length; i++) {
        if (pins[i].holes) {
          arrayPins.push([0, parseFloat(Number(pins[i].position.x + this.offsetX + getMax[0]).toFixed(4)), parseFloat(Number(pins[i].position.z + this.offsetZ + getMax[1]).toFixed(4)), 0.9, 0, 0])
        }
        if (pins[i].pins) {
          arrayPins.push([0, parseFloat(Number(pins[i].position.x + this.offsetX + getMax[0]).toFixed(4)), parseFloat(Number(pins[i].position.z + this.offsetZ + getMax[1]).toFixed(4)), parseFloat(Number(pins[i].metadata.width).toFixed(4)), parseFloat(Number(pins[i].metadata.length).toFixed(4)), 0])
        }
      }

      arrayPins2 = [[parseFloat(Number(-x + getMax[0]).toFixed(4)), parseFloat(Number(z + getMax[1]).toFixed(4)), parseFloat(Number(-x + getMax[0]).toFixed(4)), parseFloat(Number(-z + getMax[1]).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(-x + getMax[0]).toFixed(4)), parseFloat(Number(-z + getMax[1]).toFixed(4)), parseFloat(Number(x + getMax[0]).toFixed(4)), parseFloat(Number(-z + getMax[1]).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(x + getMax[0]).toFixed(4)), parseFloat(Number(-z + getMax[1]).toFixed(4)), parseFloat(Number(x + getMax[0]).toFixed(4)), parseFloat(Number(z + getMax[1]).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(x + getMax[0]).toFixed(4)), parseFloat(Number(z + getMax[1]).toFixed(4)), parseFloat(Number(-x + getMax[0]).toFixed(4)), parseFloat(Number(z + getMax[1]).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0]]
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
    this._initSimSocket()
  }

  this._initSimSocket()

  return this
}
