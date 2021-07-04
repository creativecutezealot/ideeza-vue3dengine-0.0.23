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

  this._initTO220 = function () {
    //  add Marian - need to come from formQFN
    this.metadata['rotY'] = true
    this.metadata['rotZ'] = false
    this.metadata['boundScaleX'] = 0.1
    this.metadata['boundScaleY'] = 0.0
    this.metadata['boundScaleZ'] = 0.1
    this.metadata['pinsNr'] = 0
    this.metadata['componentName'] = ''
    this.metadata['isPart'] = true
    this.metadata['text'] = {
      'name': this.metadata['name'], // maybe come from somewhere or technician put it
      'settings': [512, 400, -Math.PI / 2, 60, true, '#555555', '#ffffff'] // size, maxWidth, rotation, font-size, invertY, backgroundColor, and text color
    }

    this.holePlus = 0.1
    this.bodyPlus = 0.05
    this.whiteBorderPlus = 0.3
    this.shadowPlus = 0.1
    this.distBodyAndPin = 1.5
    this.resolution = 16
    this.startedPin = null

    this.object3D = this._createTO2203D()
    this.object3D.metadata = this.metadata

    this.sendData()

    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this)
    }
  }

  //  CREATE 3D QFN OBJECT
  this._createTO2203D = function () {
    var bodymaterial = new BABYLON.StandardMaterial('bodyMaterial', this.scene)
    // bodymaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3)
    bodymaterial.diffuseTexture = new DrawText(this.scene, this.metadata['text'].name, this.metadata['text'].settings)

    const box = this.createBody3D()

    this._addPinsTO220Comp(box)

    box.material = bodymaterial

    this._createTO2202D(box)

    // create an empty mesh to hold the entire components
    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = 'TO220' // this.metadata['name'] + this.metadata['part'] + this.metadata['id']
    box.setParent(mesh)

    return mesh
  }

  this.createBody3D = function () {
    let faceUV = new Array(6)
    for (let i = 0; i < 6; i++) {
      faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0)
    }
    faceUV[1] = new BABYLON.Vector4(0, 0, 1, 1)

    var options = {
      width: parseFloat(this.metadata['dimensions']['e_max_body_span']),
      height: parseFloat(this.metadata['dimensions']['maximum_height']),
      depth: parseFloat(this.metadata['dimensions']['d_max_body_span']),
      faceUV: faceUV
    }

    const box = BABYLON.MeshBuilder.CreateBox('box', options, this.scene)
    return box
  }

  //  ADD PINS TO220 COMPONENT
  this._addPinsTO220Comp = function (comp) {
    comp.pins = []
    
    let box
    const clone = this._getPin()
    for (let i = 0; i < parseInt(this.metadata['package_pin']['e_number_pins']); i++) {
      for (let j = 0; j < parseInt(this.metadata['package_pin']['d_number_pins']); j++) {
        box = clone.clone()
        box.isVisible = true

        var bbInfo = comp.getBoundingInfo().boundingBox.extendSize
        var boxbbInfo = box.getBoundingInfo().boundingBox.extendSize

        box.position.y -= (bbInfo.y + boxbbInfo.y)
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

        box.position.x = j * parseFloat(this.metadata['package_pin']['e_pitch']) - offsetY
        box.position.z = i * parseFloat(this.metadata['package_pin']['e1_pitch']) - offsetX

        box.material = clone.material.clone('pinMaterial_' + i)
        comp.pins.push(box)

        if (i === 0 && j === 0) {
          this.startedPin = box
        }
      }
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
      sortPins = data.reverse()
    }

    return sortPins
  }

  this._createTO2202D = function (comp) {
    let meshes = []
    meshes.push(this._createBorder(comp))

    for (let i = 0; i < comp.pins.length; i++) {
      const width = comp.pins[i].metadata.width
      // const length = comp.pins[i].metadata.length

      comp.pins[i].metadata['Fwidth'] = width + this.holePlus + this.whiteBorderPlus + this.shadowPlus
      comp.pins[i].metadata['Flength'] = width + this.holePlus + this.whiteBorderPlus + this.shadowPlus

      // shadows
      let box1 = Component._create2DShape(0, width + this.holePlus + this.whiteBorderPlus + this.shadowPlus, width + this.holePlus + this.whiteBorderPlus + this.shadowPlus, 0.001, this.scene)
      const box2 = Component._create2DShape(0, width + this.holePlus + this.whiteBorderPlus, width + this.holePlus + this.whiteBorderPlus, 0.001, this.scene)
      box1 = Component._createHoles(box1, box2, this.scene)
      
      box1.position = comp.pins[i].getAbsolutePosition()
      box1.position.y = 0
      box1.rotation.y = comp.pins[i].rotation.y

      meshes.push(box1)

      // PINS
      let box3 = Component._create2DShape(0, width + this.holePlus + this.whiteBorderPlus, width + this.holePlus + this.whiteBorderPlus, 0.001, this.scene)
      const box4 = Component._create2DShape(1, width + this.holePlus, width + this.holePlus, 0.001, this.scene)

      box3 = Component._createHoles(box3, box4, this.scene)

      box3.position = box1.position
      box3.rotation.y = box1.rotation.y

      meshes.push(box3)
    }
    
    const box = Component._get2DFootprint(meshes, this.scene)

    box.position.y = -parseFloat(Number(parseFloat(this.metadata['dimensions']['maximum_height']) / 2).toFixed(4)) + 0.01
    box.setParent(comp)

    // console.log('x: ', parseFloat(this.metadata['dimensions']['e_max_body_span']), parseInt(this.metadata['package_pin']['e_number_pins']), parseFloat(this.metadata['package_pin']['e1_pitch']))
    // console.log('z: ', parseFloat(this.metadata['dimensions']['d_max_body_span']), parseInt(this.metadata['package_pin']['d_number_pins']), parseFloat(this.metadata['package_pin']['e_pitch']))
  }

  this._createBorder = function (comp) {
    const bnds = comp.getHierarchyBoundingVectors(true)
    const dimensions = [(Math.abs(bnds.max.x) + Math.abs(bnds.min.x)), (Math.abs(bnds.max.y) + Math.abs(bnds.min.y)), (Math.abs(bnds.max.z) + Math.abs(bnds.min.z))]
    
    this.metadata['size'] = [parseFloat(Number(dimensions[0]).toFixed(4)), parseFloat(Number(dimensions[1]).toFixed(4)), parseFloat(Number(dimensions[2]).toFixed(4))]

    const x = dimensions[0] / 2
    const z = dimensions[2] / 2
    
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
    const width = parseFloat(this.metadata['package_pin']['max_width_range'])
    const depth = parseFloat(this.metadata['package_pin']['max_lead_range'])
    const height = parseFloat(this.metadata['package_pin']['max_lead_height'])

    const box = Component._create2DShape(0, width, depth, height, this.scene)
    box.material = new BABYLON.StandardMaterial('pinMaterial', this.scene)
    
    box.metadata = {
      'width': width,
      'length': depth 
    }

    box.isVisible = false
    return box
  }

  this.sendData = function () {
    let bnds = this.object3D.getHierarchyBoundingVectors(true)
    const xSize = Math.abs(bnds.max.x) + Math.abs(bnds.min.x)
    const zSize = Math.abs(bnds.max.z) + Math.abs(bnds.min.z)

    this.metadata['boundScaleX'] += parseFloat(Number(xSize / 2).toFixed(4))
    this.metadata['boundScaleY'] += parseFloat(Number(parseFloat(this.metadata['dimensions']['maximum_height']) / 2).toFixed(4))
    this.metadata['boundScaleZ'] += parseFloat(Number(zSize / 2).toFixed(4))

    this.object3D.getChildren()[0]._boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-this.metadata.boundScaleX, -this.metadata.boundScaleY, -this.metadata.boundScaleZ), new BABYLON.Vector3(this.metadata.boundScaleX, this.metadata.boundScaleY, this.metadata.boundScaleZ))
    this.object3D.getChildren()[0].showBoundingBox = true
    // console.log(this.object3D.getChildren()[0])

    const pins = this.object3D.getChildren()[0].pins
    
    let arrayPins = []
    let arrayPins2 = []

    const x = xSize / 2
    const z = zSize / 2

    let diff = new BABYLON.Vector3(parseFloat(Number(pins[0].getAbsolutePosition().x + x - pins[0].metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(pins[0].getAbsolutePosition().z + z - pins[0].metadata.Flength / 2).toFixed(4)))
    if (this.startedPin) {
      diff = new BABYLON.Vector3(parseFloat(Number(this.startedPin.getAbsolutePosition().x + x - this.startedPin.metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(this.startedPin.getAbsolutePosition().z + z - this.startedPin.metadata.Flength / 2).toFixed(4)))
    }
  
    if (this.scaleFromLayer1) {
      for (let i = 0; i < pins.length; i++) {
        arrayPins.push([1, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(this.resolution)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(this.resolution)), 0, 0])
      }

      const path = this.object3D.getChildren()[0].path2d
      arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[0][0].z + z - diff.z).toFixed(this.resolution)), parseFloat(Number(path[0][1].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[0][1].z + z - diff.z).toFixed(this.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[1][0].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[1][0].z + z - diff.z).toFixed(this.resolution)), parseFloat(Number(path[1][1].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[1][1].z + z - diff.z).toFixed(this.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[2][0].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[2][0].z + z - diff.z).toFixed(this.resolution)), parseFloat(Number(path[2][1].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[2][1].z + z - diff.z).toFixed(this.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
        [parseFloat(Number(path[3][0].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[3][0].z + z - diff.z).toFixed(this.resolution)), parseFloat(Number(path[3][1].x + x - diff.x).toFixed(this.resolution)), parseFloat(Number(path[3][1].z + z - diff.z).toFixed(this.resolution)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0]]
    }
    else {
      for (let i = 0; i < pins.length; i++) {
        arrayPins.push([1, parseFloat(Number(pins[i].getAbsolutePosition().x + x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z).toFixed(4)), parseFloat(this.metadata['package_pin']['max_lead_range']), 0, 0])
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
    this._initTO220()
  }

  this._initTO220()

  return this
}
