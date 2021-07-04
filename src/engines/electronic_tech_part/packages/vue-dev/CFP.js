/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from "../../component";
import { DrawText } from '../../../general/Utils'

export default function (scene, metadata) {
  this.scene = scene // scene
  this.data = metadata // data 


  this.metadata = this.data
  this.showHelper = false // axis
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


  this._initCFP = function () {
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
      'settings': [512, 400, 0, 60, true, '#555555', '#ffffff'] // size, maxWidth, rotation, font-size, invertY, backgroundColor, and text color
    }
    this.bodyPlus = 0.05
    this.shadowPlus = 0.05
    this.pinWidthPlus = 0.05
    this.pinLengthPlus = 0.05

    this.object3D = this._createdCFP3D(this.metadata)
    this.object3D.metadata = this.metadata

    this.sendData()

    if (this.scene.is3D) {
      Component.To2D(this)
    }
    else {
      Component.To3D(this)
    }
  }

  /* /CODE MERGE 1 */

  //
  console.log(`---> CFP <---`)
  //
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

// 3D
  this._createdCFP3D = function (payload) {
    Component.dispose(this)
    console.log(`---> updateObject_m`, payload)

    let vm = {}
    vm.cfp = payload // metadata earlier

    console.log('CFP METADATA=>', vm.cfp)


    // initializations
    let height = parseFloat(vm.cfp.box.height) // height of box
    let width = parseFloat(vm.cfp.box.width)   // width of box
    let depth = parseFloat(vm.cfp.box.depth)   // depth of box
    let pHeight = parseFloat(vm.cfp.pin.height) // height of pin
    let pLength = parseFloat(vm.cfp.pin.length) // length of pin
    let standOff = parseFloat(vm.cfp.box.standOff) // standoff height
    let pitch = parseFloat(vm.cfp.pin.pitch) // pitch of pins
    let number = parseInt(vm.cfp.pin.number) // total number of pins



    let buff = 0.01 // buffer-1


    let faceUV = new Array(6)
    for (let i = 0; i < 6; i++) {
      faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0)
    }
    faceUV[1] = new BABYLON.Vector4(0, 0, 1, 1)

    var options = {
      width: width,
      height: height,
      depth: depth,
      faceUV: faceUV
    }

    // box
    let box = BABYLON.MeshBuilder.CreateBox('body', options, scene)

    box.pins = []
    //
    let bodyMaterial = new BABYLON.StandardMaterial(`bodyMaterial`, scene)
    bodyMaterial.diffuseTexture = new DrawText(this.scene, this.metadata['text'].name, this.metadata['text'].settings)
    box.material = bodyMaterial
    box.rotation.y = Math.PI // 180 DEG
    box.rotation.x = Math.PI / 2 // 90 DEG



    let n = number/2 // half of total pins on either side
    let widthBuff =0.7 // buffer-2
    let cnt = 0

    let newPin = createPins()
    for(let i=1; i<=2; i++) {
      for(let j=1; j<=n; j++) {
        //
        let pin = newPin.clone()
        pin.visibility = true


        if (i === 1) { // half left
          // console.log(`half left`)

          if (n % 2 === 0) { // even

            // up
            if (j <= n/2 ) {
              // console.log(`-up`)

              pin.position.z = j * (pitch) - (pitch/2) // dist between pin
              pin.position.x = -(width-widthBuff) // width of box
              // console.log(pitch, ' | ' , j, ' | ', pin.position.y, ' | ',pin.position.x)
            }
            // down
            else if (j > n/2) {
              // console.log(`-down`)

              pin.position.z = -1 * ( (j-n/2) * (pitch) - (pitch/2)) // dist between pin
              pin.position.x = -(width-widthBuff) // width of box
              // console.log(pitch, ' | ' , j, ' | ', pin.position.y, ' | ',pin.position.x)
            }
          }
          else { // odd

            // up
            if (j < n/2) {
              // console.log(`1`)
              pin.position.z = j * pitch // dist between pin
              pin.position.x = -(width-widthBuff) // width of box
            }
            else if (j === (parseInt(n/2) + 1)) {
              // console.log(`2`)
              pin.position.z = 0 // dist between pin
              pin.position.x = -(width-widthBuff) // width of box
            }
            // down
            else if (j > n/2) {
              // console.log(`3`)
              pin.position.z = (j-parseInt(n/2)-1) * -pitch // dist between pin
              pin.position.x = -(width-widthBuff) // width of box
            }
          }
        }
        else if (i === 2) { // half right

          // console.log(`half right`)

          if (n % 2 === 0) { // even

            // up
            if (j <= n/2 ) {
              // console.log(`-up`)

              pin.position.z = j * (pitch) - (pitch/2) // dist between pin
              pin.position.x = (width-widthBuff) // width of box
              // console.log(pitch, ' | ' , j, ' | ', pin.position.y, ' | ',pin.position.x)
            }
            // down
            else if (j > n/2) {
              // console.log(`-down`)

              pin.position.z = -1 * ( (j-n/2) * (pitch) - (pitch/2)) // dist between pin
              pin.position.x = (width-widthBuff) // width of box
              // console.log(pitch, ' | ' , j, ' | ', pin.position.y, ' | ',pin.position.x)
            }
          }
          else { // odd

            // up
            if (j < n/2) {
              // console.log(`1`)
              pin.position.z = j * pitch // dist between pin
              pin.position.x = (width-widthBuff) // width of box
            }
            else if (j === (parseInt(n/2) + 1)) {
              // console.log(`2`)
              pin.position.z = 0 // dist between pin
              pin.position.x = (width-widthBuff) // width of box
            }
            // down
            else if (j > n/2) {
              // console.log(`3`)
              pin.position.z = (j-parseInt(n/2)-1) * -pitch // dist between pin
              pin.position.x = (width-widthBuff) // width of box
            }
          }
        }
        //
        box.pins.push(pin)

        pin.material = newPin.material.clone('pinMaterial_' + cnt)

        pin.material.diffuseTexture = new DrawText(this.scene, (cnt + 1).toString(), [64, 64, 0, 16, true, '#cfcfcf', '#000000'], true)
        const metadata = Object.assign({}, pin.metadata, {'indexPin': (cnt + 1)})
        pin.metadata = metadata
        pin.setParent(box)
        cnt++
      }
    }
    this.metadata.pinsNr = box.pins.length
    newPin.dispose(false, true)

    this._createdCFP2D(box)

    function createPins() {
      let cylinderPin = BABYLON.MeshBuilder.CreateBox('pin',{
        height: 0.1,
        width: pLength,
        depth: pHeight
      }, scene, true)
      cylinderPin.visibility = false




      let pRound1 = BABYLON.Mesh.CreateCylinder("sphere", 1, pHeight, pHeight, 32, scene);
      // pRound1.position.z = -(depth/2+ buff+ standOff)
      pRound1.position.x = pLength / 2
      pRound1.scaling.y = 0.1

      pRound1.visibility = false



      let pRound2 = BABYLON.Mesh.CreateCylinder("sphere", 1, pHeight, pHeight, 32, scene);
      // pRound2.position.z = -(depth/2+ buff+ standOff)
      pRound2.position.x = -pLength / 2
      pRound2.scaling.y = 0.1

      pRound1.visibility = false



      let arrayOfMeshes = []
      arrayOfMeshes = arrayOfMeshes.concat(cylinderPin).concat(pRound2).concat(pRound1)
      let mergedMeshes = BABYLON.Mesh.MergeMeshes(arrayOfMeshes, ); // two spheres + a box = pin

      mergedMeshes.position.z = -(depth/2+ buff+ standOff)

      mergedMeshes.visibility = false

      mergedMeshes.metadata = {
        'width': pLength + pHeight,
        'length': pHeight
      }


      let pMat = new BABYLON.StandardMaterial('pMat', scene)
      // pMat.emissiveColor = new BABYLON.Color3.FromHexString(`#CFCFCF`)
      // pMat.diffuseColor = new BABYLON.Color3.FromHexString(`#CFCFCF`)
      // cylinderPin.material = pMat

      mergedMeshes.material = pMat
      return mergedMeshes
    }

    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = 'CFP'
    box.setParent(mesh)
    return mesh
  };

  this.updateObject = function (json) {
    Component.dispose(this)
    this.data = json
    this.metadata = this.data
    this._initCFP()
  }

  this._createdCFP2D = function (comp) {
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

    const x = dimensions[0] / 2 + (this.pinWidthPlus + this.shadowPlus)
    const z = dimensions[2] / 2 + (this.pinLengthPlus + this.shadowPlus)
    let silks = []
    const path = [[new BABYLON.Vector3(-x, 0, z), new BABYLON.Vector3(-x, 0, -z)],
      [new BABYLON.Vector3(-x, 0, -z), new BABYLON.Vector3(x, 0, -z)],
      [new BABYLON.Vector3(x, 0, -z), new BABYLON.Vector3(x, 0, z)],
      [new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(-x, 0, z)]]

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

  this.sendData = function () {
    console.log(`---> sendData`)


    // question size of footprint or 3d object
    let bnds = this.object3D.getHierarchyBoundingVectors(true)
    const xSize = Math.abs(bnds.max.x) + Math.abs(bnds.min.x)
    const zSize = Math.abs(bnds.max.z) + Math.abs(bnds.min.z)

    this.metadata['boundScaleX'] += parseFloat(Number(xSize / 2).toFixed(4))
    this.metadata['boundScaleY'] += parseFloat(Number(parseFloat(this.metadata.box.height) / 2).toFixed(4))
    this.metadata['boundScaleZ'] += parseFloat(Number(zSize / 2).toFixed(4))



    const pins = this.object3D.getChildren()[0].pins

    let arrayPins = []
    let arrayPins2 = []

    const x = (Math.abs(bnds.max.x) + Math.abs(bnds.min.x)) / 2 - parseFloat(this.metadata.box.width) / 2
    const z = (Math.abs(bnds.max.z) + Math.abs(bnds.min.z)) / 2 - parseFloat(this.metadata.box.width) / 2

    const diff = new BABYLON.Vector3(parseFloat(Number(pins[4].getAbsolutePosition().x + x - pins[4].metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(pins[4].getAbsolutePosition().z + z - pins[4].metadata.Flength / 2).toFixed(4)))

    if (this.scaleFromLayer1) {
      for (let i = 0; i < pins.length; i++) {
        arrayPins.push([1, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(4)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(4)), 0, 0])
      }

      const path = this.object3D.getChildren()[0].path2d
      arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[0][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][1].z + z - diff.z).toFixed(4)), 0.1, 0],
        [parseFloat(Number(path[1][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[1][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][1].z + z - diff.z).toFixed(4)), 0.1, 0],
        [parseFloat(Number(path[2][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[2][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][1].z + z - diff.z).toFixed(4)), 0.1, 0],
        [parseFloat(Number(path[3][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[3][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][1].z + z - diff.z).toFixed(4)), 0.1, 0]]
    }
    else {
      for (let i = 0; i < pins.length; i++) {
        // arrayPins.push([1, parseFloat(Number(pins[i].getAbsolutePosition().x + x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z).toFixed(4)), parseFloat(this.metadata['package_pin']['max_lead_range']), 0, 0])
      }

      arrayPins2 = [[0, parseFloat(Number(2 * z).toFixed(4)), 0, 0, 0.1, 0],
        [0, 0, parseFloat(Number(2 * x).toFixed(4)), 0, 0.1, 0],
        [parseFloat(Number(2 * x).toFixed(4)), 0, parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4)), 0.1, 0],
        [parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4)), 0, parseFloat(Number(2 * z).toFixed(4)), 0.1, 0]]
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


  this._initCFP()
  return this
}
