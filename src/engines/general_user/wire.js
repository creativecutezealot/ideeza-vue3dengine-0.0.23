import * as BABYLON from 'babylonjs'
// import * as GUI from 'babylonjs-gui'

// export default wire = {
export default class Wire {
  constructor (path, board, scene) {
    this.path = path
    this.board = board
    this.scene = scene
    this._meshes = []
    this._width = 0.1
    this._color = '#918c3b'

    this.init()
  }

  init () {
    const path = this._generatePath4(this.path)
    /*
    var localPath = []
    for (let i = 0; i < path.length; i++) {
      localPath[i] = []
      var center = BABYLON.Vector3.Center(path[i][0], path[i][1])
      localPath[i].push(center.subtractInPlace(path[i][1]), center.subtractInPlace(path[i][0]))
    }
    */
    this.metadata = {
      path: path,
      // localPath: localPath,
      pins: []
    }
  
    for (let i = 0; i < path.length; i++) {
      this._width = this.path[i][5] / 10
      var line = this._createLine(path[i][0], path[i][1])
      // console.log(line)
      this._meshes.push(line)
    }

    if (this._meshes.length > 0) {
      var wires = BABYLON.Mesh.MergeMeshes(this._meshes, true)
      wires.material =  new BABYLON.PBRMaterial('mat', this.scene)
      wires.material.albedoColor = BABYLON.Color3.FromHexString(this._color).toLinearSpace()   
      wires.material.backFaceCulling = false
      wires.material.metallic = 1
      wires.material.roughness = 0.2
      wires.material.zOffset = -2

      this._meshes = [wires]
    }
  }

  // create a line between 2 points, with width res
  // p1: float
  // p2: float
  // res: float
  _createLine (p1, p2) {
    var line = BABYLON.Mesh.CreatePlane('wire', 1, this.scene)
    var dist = parseFloat(Number(BABYLON.Vector3.Distance(p1, p2)).toFixed(2))
    var rotAngle = Math.atan((p1.x - p2.x) / (p1.z - p2.z))

    line.scaling.y = this._width
    // line.scaling.x = dist + parseFloat(this._width)
    line.scaling.x = dist

    const px1 = this.createCorners()
    px1.position.x = dist / 2
    px1.rotation.x = Math.PI / 2

    const px2 = this.createCorners()
    px2.position.x = -dist / 2
    px2.rotation.x = Math.PI / 2

    line = BABYLON.Mesh.MergeMeshes([px1, line, px2], true)

    line.metadata = {
      'dist': dist,
      'rot': rotAngle
    }
  
    /*
    line.material = new BABYLON.PBRMaterial('mat', this.scene)
    line.material.albedoColor = BABYLON.Color3.FromHexString(this._color).toLinearSpace()   
    line.material.backFaceCulling = false
    line.material.metallic = 1
    line.material.roughness = 0.2
    line.material.zOffset = -2
    */
    // console.log(line.material)

    line.position = BABYLON.Vector3.Center(p1, p2)
    line.rotation.x = Math.PI / 2
    line.rotation.y = rotAngle + Math.PI / 2

    return line
  }

  createCorners () {
    const dim = this._width - 0.01
    const shape = [
      new BABYLON.Vector3(-dim / 4, 0, -dim / 2), 
      new BABYLON.Vector3(-dim / 2, 0, -dim / 4), 
      new BABYLON.Vector3(-dim / 2, 0, dim / 4), 
      new BABYLON.Vector3(-dim / 4, 0, dim / 2), 
      new BABYLON.Vector3(dim / 4, 0, dim / 2),
      new BABYLON.Vector3(dim / 2, 0, dim / 4),
      new BABYLON.Vector3(dim / 2, 0, -dim / 4),
      new BABYLON.Vector3(dim / 4, 0, -dim / 2)
    ]

    return BABYLON.MeshBuilder.CreatePolygon("polygon", {shape: shape, holes: [], sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
  }

  // convert vector 2d points to vector 3d points
  _projecTo3D (param) {
    var x = -this.board._args.pcb_size[0] / 2 + param[0]
    var y = (param[2] !== 0) ? -0.01 : (this.board._args.layerThickness * (param[2] + 1) + 0.01)
    var z = -this.board._args.pcb_size[1] / 2 + param[1]

    return new BABYLON.Vector3(parseFloat(Number(x).toFixed(2)), parseFloat(Number(y).toFixed(2)), parseFloat(Number(z).toFixed(2)))
  }

  _generatePath4 (array) {
    var path = []

    for (let i = 0; i < array.length; i++) {
      // console.log(array[i])
      path[i] = []
      var pctpathi = this._projecTo3D([array[i][0],array[i][1],array[i][4]])
      var pctpathf = this._projecTo3D([array[i][2],array[i][3],array[i][4]])
      path[i].push(pctpathi, pctpathf)
      // console.log(pctpathi, pctpathf)
    }
    // console.log(path)
    return path
  }

  dispose () {
    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].dispose(false, true)
    }

    this._meshes = []
    this.path = []
    this.board = null
    this.scene = null

    delete this
  }

/*
  _width: 0.1,
  _color: '#918c3b',
  scene: null,
  board: null,
  _pcb: null,
  tooltip: null, // menu on the right click
  _currentMesh: null, // dragging line of this wire
  _meshes: [], // all the lines of one wire
  metadata: {}, // infos about this wire
  startingPoint: null, // for dragging
  index: -1, // index wire on pcb array of wires
  name: '', // name of this wire
  _observer: null, // for dragg stuff
  type: 'wire', // type of this object
  init (path, pcb3D) {
    this._pcb = pcb3D
    this.scene = pcb3D.scene
    this.board = pcb3D.board
    this.tooltip = this._addTooltip()
    this._initWire2(path)
    // console.log('ysss')
    this.name = 'conection_' + this._pcb.wires.length
    this.index = this._pcb.wires.length
    this._pcb.wires.push(this)

    // return this
  },

  // create wire system based on input matrix
  // array of points, 2d or 3d
  // rebuild - when true, I don't recreate again array of 3d points
  // pins - array of linked pins if load from component
  _initWire (array, rebuild = false, pins) {
    let path = []
    if (rebuild === true) {
      path = array
    }
    else {
      path = this._generatePath3(array)
    }
    // console.log(path)
    var localPath = []
    for (let i = 0; i < path.length; i++) {
      localPath[i] = []
      var center = BABYLON.Vector3.Center(path[i][0], path[i][1])
      localPath[i].push(center.clone().subtractInPlace(path[i][1]), center.clone().subtractInPlace(path[i][0]))
    }

    this._meshes = []
    this.metadata = {
      path: path,
      localPath: localPath,
      pins: pins
    }
    for (let i = 0; i < path.length; i++) {
      var line = this._createLine(path[i][0], path[i][1])
      line.parent = this._pcb.wiresParent
      line.metadata.path = path
      line.metadata.localPath = localPath
      line.metadata.i = i
      // console.log(line)
      line.metadata.side = this.board.metadata.pcb_layers - this.getLayerByPosition(line.position.y)
      line.actionManager = new BABYLON.ActionManager(this.scene)
      line.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (evt) => {
          if (evt.sourceEvent.button === 0) {
            this._pcb.selected = this
            this._pcb.unselectComponents()
            this._currentMesh = evt.source
            this.startingPoint = this._pcb.getGroundPosition(evt)
            let _that = this
            this._observer = this.scene.onPointerObservable.add(function (evt) {
              if (!_that.startingPoint) return
              var current = _that._pcb.getGroundPosition(evt)
              if (!current) return

              _that.updateWireByPosition(_that._currentMesh.metadata.i, current)
              _that.startingPoint = current
            }, BABYLON.PointerEventTypes.POINTERMOVE)
            this.scene.activeCamera.detachControl(this._pcb.canvas)
            if (this._pcb.calbacks.select !== null) {
              this._pcb.calbacks.select(this.type, this.name)
            }
          }
        }))

      line.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (evt) => {
          if (evt.sourceEvent.button === 0) {
            this._currentMesh = null
            this.startingPoint = null
            this.scene.onPointerObservable.remove(this._observer)
            this.scene.activeCamera.attachControl(this._pcb.canvas, false)
          }
        }))

      line.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (evt) => {
          if (evt.sourceEvent.button === 2) {
            this._currentMesh = this._checkCorner(evt.source, [evt.pointerX, evt.pointerY])
            if (this._currentMesh !== null) {
              this.tooltip.linkWithMesh(this._currentMesh)
              this.tooltip.isVisible = true
            }
          }
        }))
      this._meshes.push(line)
    }
  },

  _initWire2 (array) {
    const path = this._generatePath4(array)
    
    var localPath = []
    for (let i = 0; i < path.length; i++) {
      localPath[i] = []
      var center = BABYLON.Vector3.Center(path[i][0], path[i][1])
      localPath[i].push(center.clone().subtractInPlace(path[i][1]), center.clone().subtractInPlace(path[i][0]))
    }

    this._meshes = []
    this.metadata = {
      path: path,
      localPath: localPath,
      pins: []
    }
  
    for (let i = 0; i < path.length; i++) {
      this._width = array[i][5] / 10
      var line = this._createLine(path[i][0], path[i][1])
      line.parent = this._pcb.wiresParent
      line.metadata.path = path
      line.metadata.localPath = localPath
      line.metadata.i = i
      line.metadata.side = this.board.metadata.pcb_layers - this.getLayerByPosition(line.position.y)
      line.actionManager = new BABYLON.ActionManager(this.scene)
      line.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (evt) => {
          if (evt.sourceEvent.button === 0) {
            this._pcb.selected = this
            this._pcb.unselectComponents()
            this._currentMesh = evt.source
            this.startingPoint = this._pcb.getGroundPosition(evt)
            let _that = this
            this._observer = this.scene.onPointerObservable.add(function (evt) {
              if (!_that.startingPoint) return
              var current = _that._pcb.getGroundPosition(evt)
              if (!current) return

              _that.updateWireByPosition(_that._currentMesh.metadata.i, current)
              _that.startingPoint = current
            }, BABYLON.PointerEventTypes.POINTERMOVE)
            this.scene.activeCamera.detachControl(this._pcb.canvas)
            if (this._pcb.calbacks.select !== null) {
              this._pcb.calbacks.select(this.type, this.name)
            }
          }
        }))

      line.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (evt) => {
          if (evt.sourceEvent.button === 0) {
            this._currentMesh = null
            this.startingPoint = null
            this.scene.onPointerObservable.remove(this._observer)
            this.scene.activeCamera.attachControl(this._pcb.canvas, false)
          }
        }))

      line.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, (evt) => {
          if (evt.sourceEvent.button === 2) {
            this._currentMesh = this._checkCorner(evt.source, [evt.pointerX, evt.pointerY])
            if (this._currentMesh !== null) {
              this.tooltip.linkWithMesh(this._currentMesh)
              this.tooltip.isVisible = true
            }
          }
        }))
      this._meshes.push(line)
    }
  },

  // toggle wires
  toggleWires (layer, visible) {
    for (let i = 0; i < this._meshes.length; i++) {
      if (this._meshes[i].metadata.side === layer) {
        this._meshes[i].isVisible = visible
      }
    }
  },

  // create right click menu
  _addTooltip () {
    var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')

    var _that = this
    var tooltip = new GUI.Rectangle()
    tooltip.width = '80px'
    tooltip.height = '60px'
    tooltip.cornerRadius = 5
    tooltip.color = 'white'
    tooltip.thickness = 1
    tooltip.background = '#5e7599'
    tooltip.linkOffsetX = 50
    tooltip.isVisible = false

    let button1 = GUI.Button.CreateSimpleButton('but', 'Rotate 45')
    this._customTooltip(button1)
    tooltip.addControl(button1)
    button1.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _that._rotateWire(Math.PI / 4) // 45
      }
    })

    let button2 = GUI.Button.CreateSimpleButton('but', 'Rotate 90')
    this._customTooltip(button2)
    button2.top = '20px'
    tooltip.addControl(button2)
    button2.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _that._rotateWire(Math.PI / 2) // 90
      }
    })

    let button3 = GUI.Button.CreateSimpleButton('but', 'Rotate 135')
    this._customTooltip(button3)
    button3.top = '40px'
    tooltip.addControl(button3)
    button3.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _that._rotateWire(3 * Math.PI / 4) // 135
      }
    })

    advancedTexture.addControl(tooltip)

    return tooltip
  },

  // check if you click corner of one line, onle then show tooltip
  _checkCorner (mesh, coords) {
    const that = this
    var pickinfo = this.scene.pick(coords[0], coords[1], function (mesh) { return mesh === that.board.meshes.layers[0] })

    var vects = mesh.getBoundingInfo().boundingBox.vectorsWorld
    let isCorner = false
    for (let i = 0; i < vects.length / 2; i++) {
      var dist = parseFloat(Number(BABYLON.Vector3.Distance(pickinfo.pickedPoint, vects[i])).toFixed(2))
      if (dist < 0.2) {
        isCorner = true
        break
      }
    }
    if (isCorner === true) {
      return mesh
    }
    else {
      return null
    }
  },

  _rotateWire (angle) {
    // todo: fix angle
    this.tooltip.isVisible = false
    const localIndex = this._currentMesh.metadata.i
    const path = this.metadata.path
    // console.log(localIndex)
    if (localIndex === 0) {
      path[localIndex + 1][1].x = path[localIndex][0].x + this._currentMesh.metadata.dist * Math.cos(angle)
      path[localIndex + 1][1].z = path[localIndex][0].z + this._currentMesh.metadata.dist * Math.sin(angle)
      path[localIndex + 2][0].x = path[localIndex + 1][1].x
      path[localIndex + 2][0].z = path[localIndex + 1][1].z
    }
    else if (localIndex === (this._meshes.length - 1)) {
      path[localIndex - 1][0].x = path[localIndex][1].x + this._currentMesh.metadata.dist * Math.cos(angle)
      path[localIndex - 1][0].z = path[localIndex][1].z + this._currentMesh.metadata.dist * Math.sin(angle)
      path[localIndex - 2][1].x = path[localIndex - 1][0].x
      path[localIndex - 2][1].z = path[localIndex - 1][0].z
    }
    else {
      path[localIndex][1].x = path[localIndex][0].x + this._currentMesh.metadata.dist * Math.cos(angle)
      path[localIndex][1].z = path[localIndex][0].z + this._currentMesh.metadata.dist * Math.sin(angle)
      path[localIndex + 1][0].x = path[localIndex][1].x
      path[localIndex + 1][0].z = path[localIndex][1].z
    }

    this._currentMesh = null

    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].material.dispose()
      this._meshes[i].dispose()
    }

    // recreate wires, but not calculate again the path array
    this._initWire(path, true, this.metadata.pins)
  },

  // style the right-click menu
  _customTooltip (button) {
    button.height = '20px'
    button.fontSize = 14
    button.cornerRadius = 5
    button.color = 'white'
    button.verticalAlignment = 0
    button.background = 'transparent'
  },

  // set wire color
  // color: hexstring (ex:'00ff00')
  changeColor (color) {
    this._color = color

    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].material.diffuseColor = BABYLON.Color3.FromHexString(this._color)
    }
  },

  // update Y position onchange thickness
  updatePositionsY () {
    for (let i = 0; i < this._meshes.length; i++) {
      const layer = this.getLayerByPosition(this._meshes[i].position.y)
      if (layer !== 0) {
        this._meshes[i].position.y = layer * this.board.metadata.layerThickness + 0.01
      }
    }
  },

  // getLayer by position
  getLayerByPosition (Ypos) {
    if (Ypos === -0.01) {
      return 0
    }
    return parseInt((Ypos - 0.01) / this.board._lastLayerThickness)
  },

  // set wire width
  // width: float
  changeWidth (width) {
    this._width = width

    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].scaling.y = this._width
      this._meshes[i].scaling.x = this._meshes[i].metadata.dist + this._width
    }
  },

  // create a line between 2 points, with width res
  // p1: float
  // p2: float
  // res: float
  _createLine (p1, p2) {
    var line = BABYLON.MeshBuilder.CreatePlane('wire', {height: 1, width: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    var dist = parseFloat(Number(BABYLON.Vector3.Distance(p1, p2)).toFixed(2))
    var rotAngle = Math.atan((p1.x - p2.x) / (p1.z - p2.z))

    line.position = BABYLON.Vector3.Center(p1, p2)
    line.rotation = new BABYLON.Vector3(Math.PI / 2, rotAngle + Math.PI / 2, 0)
    line.scaling.y = this._width
    line.scaling.x = dist + parseFloat(this._width)

    line.metadata = {
      'dist': dist,
      'rot': rotAngle
    }

    line.material = new BABYLON.StandardMaterial('mat', this.scene)
    line.material.diffuseColor = BABYLON.Color3.FromHexString(this._color)

    return line
  },

  _generatePath4 (array) {
    var path = []

    for (let i = 0; i < array.length; i++) {
      // console.log(array[i])
      path[i] = []
      var pctpathi = this._projecTo3D([array[i][0],array[i][1],array[i][4]])
      var pctpathf = this._projecTo3D([array[i][2],array[i][3],array[i][4]])
      path[i].push(pctpathi, pctpathf)
      // console.log(pctpathi, pctpathf)
    }
    // console.log(path)
    return path
  },

  // create arrays with 2 points foreach line
  _generatePath3 (array) {
    var path = []

    for (let i = 0; i < array.length - 1; i++) {
      path[i] = []
      var pctpathi = this._projecTo3D(array[i])
      var pctpathf = this._projecTo3D(array[i + 1])
      path[i].push(pctpathi, pctpathf)
    }

    return path
  },

  // convert vector 2d points to vector 3d points
  _projecTo3D (param) {
    var x = -this.board.metadata.pcb_size[0] / 2 + param[0]
    var y = (param[2] !== 0) ? -0.01 : (this.board.metadata.layerThickness * (param[2] + 1) + 0.01)
    var z = -this.board.metadata.pcb_size[1] / 2 + param[1]

    return new BABYLON.Vector3(parseFloat(Number(x).toFixed(2)), parseFloat(Number(y).toFixed(2)), parseFloat(Number(z).toFixed(2)))
  },

  _checkClickPosition (x, y, line) {
    var _that = this
    var pickinfo = _that.scene.pick(x, y, function (mesh) { return mesh === _that.board.meshes.layers[0] })

    if (pickinfo.hit) {
      line.computeWorldMatrix(true)
      var vects = line.getBoundingInfo().boundingBox.vectorsWorld

      for (let i = 0; i < vects.length / 2; i++) {
        var dist = parseFloat(Number(BABYLON.Vector3.Distance(pickinfo.pickedPoint, vects[i])).toFixed(2))

        if (dist < 0.2) {
          if (i === 1 || i === 2) {
            _that._pathPos = 1
          }
          _that._clickCorner = true
          break
        }
      }
    }
  },

  getObjectByPinAndPart (indexPin, indexPart) {
    const part = this._pcb.parts[indexPart]
    if (part !== null) {
      const pin = part._pins[indexPin]
      return pin
    }

    return null
  },

  removeWire () {
    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].dispose(false, true)
    }

    if (this.metadata.pins !== null) {
      for (let i = 0; i < this.metadata.pins.length; i++) {
        const pin = this.getObjectByPinAndPart(this.metadata.pins[i].indexPin, this.metadata.pins[i].indexPart)
        if (pin !== null && pin.metadata.hasOwnProperty('wire')) {
          delete pin.metadata['wire']
        }
      }
    }

    this._meshes = []
    this.scene = null
    this.board = null
    this._pcb = null

    delete this
  },

  // update wire on component
  updateWireOnComp (pin) {
    const point = pin.getAbsolutePosition()
    const path = this.metadata.path

    for (let i = 0; i < path.length; i++) {
      for (let k = 0; k < path[i].length; k++) {
        const y = path[i][k].y
        var diff = point.subtract(path[i][k])
        path[i][k].addInPlace(diff)
        // path[i][k].subtractInPlace(point)
        path[i][k].y = y // = new BABYLON.Vector3(newpos.x, y, newpos.z)
        // console.log(path[i][k])
      }
    }
    // console.log(point, path)
    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].material.dispose()
      this._meshes[i].dispose()
    }

    // recreate wires, but not calculate again the path array
    this._initWire(path, true, this.metadata.pins)
  },

  // update this wire when move/ rotate the part where is linked
  updateWireByPin (pin) {
    const point = pin.getAbsolutePosition()
    const path = this.metadata.path
    let localIndex = 0

    if (pin.metadata.indexPin === this.metadata.pins[1].indexPin) {
      localIndex = this._meshes.length - 1
    }
    switch (localIndex) {
      case (this._meshes.length - 1):
        path[localIndex][1].x = point.x
        path[localIndex][1].z = point.z
        break
      case 0:
        path[localIndex][0].x = point.x
        path[localIndex][0].z = point.z
        break
      default:
        break
    }

    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].material.dispose()
      this._meshes[i].dispose()
    }

    // recreate wires, but not calculate again the path array
    this._initWire(path, true, this.metadata.pins)
  },

  // update this wire on mouse move
  updateWireByPosition (indexOfLine, point) {
    // you cann't move the first and the last line from wire
    if (indexOfLine === 0 || indexOfLine === this._meshes.length - 1) return

    const path = this.metadata.path
    const path2 = this.metadata.localPath

    path[indexOfLine][1].x = point.x + path2[indexOfLine][1].x
    path[indexOfLine][1].z = point.z + path2[indexOfLine][1].z

    path[indexOfLine + 1][0].x = point.x + path2[indexOfLine][1].x
    path[indexOfLine + 1][0].z = point.z + path2[indexOfLine][1].z
    path[indexOfLine - 1][1].x = point.x + path2[indexOfLine][0].x
    path[indexOfLine - 1][1].z = point.z + path2[indexOfLine][0].z

    path[indexOfLine][0].x = point.x + path2[indexOfLine][0].x
    path[indexOfLine][0].z = point.z + path2[indexOfLine][0].z

    for (let i = 0; i < this._meshes.length; i++) {
      this._meshes[i].material.dispose()
      this._meshes[i].dispose()
    }

    // recreate wires, but not calculate again the path array
    this._initWire(path, true, this.metadata.pins)
  },

  // save the wires
  save () {
    if (this._meshes.length > 0) {
      var wires = BABYLON.Mesh.MergeMeshes(this._meshes, false)
      wires.metadata = {
        'width': this._width,
        'color': this._color
      }
      wires.material = this._meshes[0].material.clone('mat' + this.index)

      return wires
    }
    return null
  }*/

}