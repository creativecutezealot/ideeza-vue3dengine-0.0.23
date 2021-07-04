/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import Component from "../../component";

export default function (scene, metadata) {
  this.scene = scene
  this.data = metadata // data

  /* CODE MERGE 1 */
  this.metadata = this.data
  this.showHelper = true
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





  // init BGA
  this._initBGA = function () {
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
      'settings': [512, 400, Math.PI / 2, 80, true] // size, maxWidth, rotation, font-size, invertY
    }

    this.holePlus = 0.1
    this.bodyPlus = 0.05
    this.whiteBorderPlus = 0.3
    this.shadowPlus = 0.1
    this.distBodyAndPin = 0.5

    this.object3D = this._createdBGA3D(this.metadata)
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
  console.log(`---> BGA <---`)
  //
  this.view2D = function () {
    console.log(`---> view2D`)
  }
  //
  this.save3D = function () {
    return Component.save3D(this)
  }
  //
  //
  this.getData = function () {
    console.log(`---> getData`)
    return this.data
  }
  //
  this.disposeEngine = function () {
    console.log(`---> disposeEngine`)
    Component.disposeEngine(this)
  }
  //
  this._createdBGA3D = function (payload) {
    Component.dispose(this)
    console.log(`---> updateObject`, payload)

    let vm = {}
    vm.bga = payload // metadata earlier

    console.log('BGA METADATA=>', vm.bga)

    let depth = parseFloat(vm.bga.box.depth)
    let height = parseFloat(vm.bga.box.height)
    let width = parseFloat(vm.bga.box.width)
    let row = parseFloat(vm.bga.pin.row)
    let column = parseFloat(vm.bga.pin.column)
    let pitch = Math.abs(parseFloat(vm.bga.pin.pitch)- parseFloat(vm.bga.pin.diameter))
    let diameter = parseFloat(vm.bga.pin.diameter)

    calX()
    calY()



    let groundTexture = new BABYLON.DynamicTexture("dynamic texture", 512, scene, true);
    let font = "bold 76px Ariel";
    let invertX = true;
    let text = "BGA";
    let color = "white"
    let x = 160;
    let y = 280;
    let clearColor = '#313131'

    let context = groundTexture.getContext();
    let size = groundTexture.getSize();
    if (clearColor) {
      context.fillStyle = clearColor;
      context.fillRect(0, 0, size.width+1, size.height+1);
    }


    // draw text
    context.font = font;
    context.fillStyle = color;
    context.fillText(text, x, y);
    context.font = "300px arial";
    context.fillStyle = color;
    context.fillText(text, -7, -7);
    groundTexture.update(invertX);


    //
    let columns = 6;  // 6 columns
    let rows = 4;  // 4 rows

    //
    let faceUV = new Array(6)
    faceUV[0] = new BABYLON.Vector4(3 / columns, 0, (3 + 1) / columns, 1 / rows)
    faceUV[4] = new BABYLON.Vector4(3 / columns, 0, (3 + 1) / columns, 1 / rows)
    faceUV[2] = new BABYLON.Vector4(3 / columns, 0, (3 + 1) / columns, 1 / rows)
    faceUV[3] = new BABYLON.Vector4(3 / columns, 0, (3 + 1) / columns, 1 / rows)
    faceUV[5] = new BABYLON.Vector4(3 / columns, 0, (3 + 1) / columns, 1 / rows)


    let box = BABYLON.MeshBuilder.CreateBox('box', {
      height,
      width,
      depth,
      faceUV
    }, scene, true)

    box.pins = []
    //
    let bodyMaterial = new BABYLON.StandardMaterial(`bodyMaterial`, scene)
    // bodyMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3)
    bodyMaterial.specularColor = new BABYLON.Color3.FromHexString(`#313131`)
    bodyMaterial.diffuseTexture = groundTexture;
   // bodyMaterial.hasAlpha = true
   // bodyMaterial.alpha = 0.5
    bodyMaterial.backFaceCulling = true;
    box.material = bodyMaterial
    box.rotation.z = 9.4
    box.rotation.y = 9.4
    box.rotation.x = -4.7
    //
    let plane = BABYLON.MeshBuilder.CreatePlane(`myPlane`, {width, height}, scene)
    plane.position.y = -((depth/2)+ 0.5)
    plane.rotation.x= -4.7



    /* SIDE CONE */


    let baseBig = Math.sqrt(Math.pow(height,2)+Math.pow(width,2))
    let base = (baseBig*10)/100
    let coordY = (height/2)-(base/4)+0.1
    let coordX =(width/2)-(base/4)+ 0.1

    let tri = BABYLON.Mesh.CreateCylinder('triangle',base/2, 0, base, 32, scene, true )
   // tri.position.z = -((depth/2)+ 0.35)
    tri.scaling.z = 0.01
    tri.rotation.x = 4.7//-0.79
    tri.rotation.y = 0.79
    tri.position.y = -((depth/2)+ 0.5)// half of Y
    tri.position.z = -coordY-0.09
    tri.position.x = -coordX+0.09
    tri.setParent(box)
    //tri.rotation.y = -4.7
   // tri.rotation.x = -9.4

    //
    plane.alpha = 0.1
    plane.enableEdgesRendering()
    plane.edgesWidth = 7
    plane.rotation.y = 9.4
    plane.edgesColor = `white`
    plane.setParent(box)

    //
    let newPin = createPin()



    /* SIDE PIN */
    let sidePin = newPin.clone()
 //
    sidePin.rotation.y = -4.7
    sidePin.rotation.x = -9.4
    sidePin.position.z = -coordY-0.09
   // sidePin.position.x = width/2 + diameter // half of x
     sidePin.position.y = -((depth/2)+ 0.5)// half of Y
    sidePin.position.x = -((width/2)+ (diameter))
    sidePin.visibility = true

    sidePin.setParent(box)

    console.log('PITCH=>',pitch)


    let cnt = 0
    for(let i=1; i<= row; i++) {
      for(let j=1; j<= column; j++) {
        cnt++
        let pin = newPin.clone()
        // positioning


// x
        if (row%2 === 0) { // EVEN
          if (i <= (row/2)) { // LEFT
            console.log('pos 1=>', i, pin.position.x)
            pin.position.x =
              -1 * ((pitch/2) + (diameter/2) +
              ((pitch)*(i-1)) + ((diameter)*(i-1)))
            console.log('pos 2=>', i, pin.position.x)
          }
          else { // RIGHT
            pin.position.x =
              1 * ((pitch/2) + (diameter/2) +
              ((pitch)*((i-(row/2))-1)) +
              ((diameter)*((i-(row/2))-1)))
          }
        }
        else { // ODD
          if (i === Math.round(row/2)) {
            //
          }
          else if (i < (row/2)) { // LEFT
            pin.position.x =
              -1 * ((diameter + pitch) * i)
          }
          else { // RIGHT
            pin.position.x =
              1 * ((diameter + pitch) *
              (row - i + 1))
          }
        }
        // /x


        // y
        if (column%2 === 0) { // EVEN
          // console.log('even')
          if (j <= (column/2)) { // TOP
            // console.log(`top side: `, j)
            pin.position.z =
              -1 * ((pitch/2) + (diameter/2) +
              ((pitch)*(j-1)) + ((diameter)*(j-1)))
            // console.log(`${j}: ${newPin.position.z}`)
          }
          else { // BOTTOM
            // console.log(`bottom side: `, j)
            pin.position.z =
              1 * ((pitch/2) + (diameter/2) +
              ((pitch)*((j-(column/2))-1)) +
              ((diameter)*((j-(column/2))-1)))
            // console.log(`${j}: ${newPin.position.z}`)
          }
        }
        else { // ODD
          // console.log('odd')
          if (j === Math.round(column/2)) {
            // console.log(`${j}: 0`)
          }
          else if (j < (column/2)) { // LEFT
            // console.log(`left side: `, j)
            pin.position.z =
              -1 * ((diameter + pitch) * j)
            // console.log(`${j}: ${newPin.position.z}`)
          }
          else { // RIGHT
            // console.log(`right side: `, j)
            pin.position.z =
              // console.log(column)
              1 * ((diameter + pitch) *
              (column - j + 1))
            // console.log(`${j}: ${newPin.position.z}`)
          }
        }
        // /y


        // pin.position.x = -0.3*i
        // pin.position.y = -0.3*j
        pin.visibility = true
        box.pins.push(pin)
        //console.log(pin)
        pin.metadata = {
          indexPin: cnt
        }
        pin.setParent(box)
      }
    }


    // first pin for this package is bottom left
    this.metadata.pinsNr = box.pins.length
    function createPin() {
      let d = vm.bga.pin.diameter
      let pin = BABYLON.Mesh.CreateCylinder('pin',0.01,d,d,16, scene, true)
      pin.rotation.y = -4.7
      pin.rotation.x = -9.4
      pin.position.y = -(depth/2+0.52) // same as that of plane
      pin.visibility = false



      let pinMat = new BABYLON.StandardMaterial('pMat', scene)
      pinMat.diffuseColor = new BABYLON.Color3.FromHexString(`#cfcfcf`)
      pin.material = pinMat


      return pin
    }


    function calX() {
      let pX = (row * diameter)+((row-1)*pitch)
      console.log('pX====>',pX, (row-1)*pitch)
      if(pX > width) {
        vm.bga.box.width = pX+2.4
      }


      /* let pX = (parseInt(vm.bga.pin.row)*(parseFloat(vm.bga.pin.diameter/4)+parseFloat(vm.bga.pin.pitch)))
        console.log('PX=>', pX, parseFloat(vm.bga.box.width))
        if(parseFloat(vm.bga.box.width) < pX) {
          let l1 = (parseInt(vm.bga.pin.row)*(parseFloat(vm.bga.pin.diameter)+parseFloat(vm.bga.pin.pitch)))
          let l2 = parseFloat(vm.bga.box.width) - parseFloat(vm.bga.pin.gridWidth)
          vm.bga.box.width = l1-l2
        } */
    }


    function calY() {
      let pY = (row * diameter)+((row-1)*pitch)
      console.log('pX====>',pY, (row-1)*pitch)
      if(pY > height) {
        vm.bga.box.height = pY+2.4
      }
      /* let pX = (parseInt(vm.bga.pin.column)*(parseFloat(vm.bga.pin.diameter/4)+parseFloat(vm.bga.pin.pitch)))
      // console.log('PX=>', pX, parseFloat(vm.bga.box.height))
       if(parseFloat(vm.bga.box.height) < pX) {
         let l1 = (parseInt(vm.bga.pin.column)*(parseFloat(vm.bga.pin.diameter)+parseFloat(vm.bga.pin.pitch)))
         let l2 = parseFloat(vm.bga.box.height) - parseFloat(vm.bga.pin.gridLength)
         vm.bga.box.height = l1-l2
       } */
    }


    var mesh = new BABYLON.Mesh('mesh', this.scene)
    mesh.name = 'BGA'
    box.setParent(mesh)
    return mesh
  }
  //

  this.updateObject = function (json) {
    Component.dispose(this)
    this.data = json
    this.metadata = this.data
    this._initBGA()
  }

 // this.updateObject(metadata) // init/first call...
 // Component.To3D(this)
  //


  this.sendData = function () {
    console.log(`---> sendData`)


    // question size of footprint or 3d object
    let bnds = this.object3D.getHierarchyBoundingVectors(true)
    const xSize = Math.abs(bnds.max.x) + Math.abs(bnds.min.x)
    const zSize = Math.abs(bnds.max.z) + Math.abs(bnds.min.z)

    this.metadata['boundScaleX'] += parseFloat(Number(xSize / 2).toFixed(4))
    this.metadata['boundScaleY'] += parseFloat(Number(parseFloat(this.metadata.box.height) / 2).toFixed(4))
    this.metadata['boundScaleZ'] += parseFloat(Number(zSize / 2).toFixed(4))

    // this.object3D.getChildren()[0]._boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-this.metadata.boundScaleX, -this.metadata.boundScaleY, -this.metadata.boundScaleZ), new BABYLON.Vector3(this.metadata.boundScaleX, this.metadata.boundScaleY, this.metadata.boundScaleZ))
    // this.object3D.getChildren()[0].showBoundingBox = true
    // console.log(this.object3D.getChildren()[0])

    // const pins = this.object3D.getChildren()[0].pins

    let arrayPins = []
    let arrayPins2 = []

    const x = (Math.abs(bnds.max.x) + Math.abs(bnds.min.x)) / 2 - parseFloat(this.metadata.box.width) / 2
    const z = (Math.abs(bnds.max.z) + Math.abs(bnds.min.z)) / 2 - parseFloat(this.metadata.box.width) / 2

   // const diff = new BABYLON.Vector3(parseFloat(Number(pins[0].getAbsolutePosition().x + x - pins[0].metadata.Fwidth / 2).toFixed(4)), 0, parseFloat(Number(pins[0].getAbsolutePosition().z + z - pins[0].metadata.Flength / 2).toFixed(4)))

    /* if (this.scaleFromLayer1) {
       for (let i = 0; i < pins.length; i++) {
         arrayPins.push([1, parseFloat(Number(pins[i].getAbsolutePosition().x + x - diff.x).toFixed(4)), parseFloat(Number(pins[i].getAbsolutePosition().z + z - diff.z).toFixed(4)), parseFloat(Number(pins[i].metadata.Fwidth).toFixed(4)), 0, 0])
       }

       const path = this.object3D.getChildren()[0].path2d
       arrayPins2 = [[parseFloat(Number(path[0][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[0][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[0][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
         [parseFloat(Number(path[1][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[1][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[1][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
         [parseFloat(Number(path[2][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[2][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[2][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0],
         [parseFloat(Number(path[3][0].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][0].z + z - diff.z).toFixed(4)), parseFloat(Number(path[3][1].x + x - diff.x).toFixed(4)), parseFloat(Number(path[3][1].z + z - diff.z).toFixed(4)), parseFloat(this.metadata['silkscreen']['LineWidth']), 0]]
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
     */

    this.metadata['size'] = [parseFloat(Number(2 * x).toFixed(4)), parseFloat(Number(2 * z).toFixed(4))]
    this.metadata['layer1'] = ['Layer 1', arrayPins]
    this.metadata['layer21'] = ['Layer 21', arrayPins2]

    console.log(this.metadata)
    console.log(JSON.stringify(this.metadata['size']))
    console.log(JSON.stringify(this.metadata['layer1']))
    console.log(JSON.stringify(this.metadata['layer21']))

    if (this.showHelper) {
      this.showMarkers()
    }
  }


  this.showMarkers = function () {
    this.showAxis(10)

    const path3 = this.metadata['layer1'][1]
    for (let i = 0; i < path3.length; i++) {
      const box = BABYLON.MeshBuilder.CreateBox('box' + i, 1, this.scene)
      if (path3[i][0] === 0) {
        box.scaling = new BABYLON.Vector3(path3[i][3], 0.01, path3[i][4])
      }
      else {
        box.scaling = new BABYLON.Vector3(path3[i][3], 0.01, path3[i][3])
      }
      box.position = new BABYLON.Vector3(path3[i][1], 0, path3[i][2])
    }

    const path2 = this.metadata['layer21'][1]
    let path = []
    for (let i = 0; i < path2.length; i++) {
      path.push([new BABYLON.Vector3(path2[i][0], 0, path2[i][1]), new BABYLON.Vector3(path2[i][2], 0, path2[i][3])])
    }

    for (let i = 0; i < path.length; i++) {
      this._createLine(path[i][0], path[i][1], 0.1)
    }
  }


  this.showAxis = function (size) {
    const _this = this
    var makeTextPlane = function (text, color, size) {
      var dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, _this.scene, true)
      dynamicTexture.hasAlpha = true
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true)
      var plane = new BABYLON.Mesh.CreatePlane('TextPlane', size, _this.scene, true)
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', _this.scene)
      plane.material.backFaceCulling = false
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0)
      plane.material.diffuseTexture = dynamicTexture
      return plane
    }

    var axisX = BABYLON.Mesh.CreateLines('axisX', [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], this.scene)
    axisX.color = new BABYLON.Color3(1, 0, 0)
    var xChar = makeTextPlane('X', 'red', size / 10)
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0)
    var axisY = BABYLON.Mesh.CreateLines('axisY', [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], this.scene)
    axisY.color = new BABYLON.Color3(0, 1, 0)
    var yChar = makeTextPlane('Y', 'green', size / 10)
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size)
    var axisZ = BABYLON.Mesh.CreateLines('axisZ', [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], this.scene)
    axisZ.color = new BABYLON.Color3(0, 0, 1)
    var zChar = makeTextPlane('Z', 'blue', size / 10)
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size)
  }



  this._initBGA()
  return this
  //
}
