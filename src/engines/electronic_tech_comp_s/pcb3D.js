/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { attachImgToId } from '../../helpers/getImg'
import { DrawText } from '../general/Utils'
import { isArray } from 'util'
import { GridMaterial } from 'babylonjs-materials'
import 'babylonjs-loaders'

export default {
  scene: null,
  objects: {}, // loadded objects in scene
  _engine: null,
  canvas: null,
  board: null, // the board
  gridSize: 100,
  selected: null, // selected part, pin
  nets: [],
  currentNet: -1,
  data: {}, // data for scene, which parts, routes
  electData: {}, // electronic data for algo
  componentPins : { // keep pins - 3d objects
    need: [],
    pass: []
  },
  calbacks: {
    select: null // calback when click on component, part, wire
  },
  drawOpt: true,
  gridResolution: 0.1,
  completlyLoaded: false,
  options: ['move','rotate','copy','delete','label','route','highlight'],
  curentOpt: 0,
  label: null,
  lastPosition: null,
  wires: [],
  auxline: null,
  continuousDraw: false,
  // init the entire scene
  async init (scene, data) {
    this.scene = scene
    this._engine = scene.getEngine()
    this.canvas = this._engine.getRenderingCanvas() 
    this.objects = {}
  
    this.label = this.createLabel()
    console.log('dataaaaa//////// ', data)
    if (!data.electData) {
      this.electData = {
        ComponentParts: [], // name of parts
        ComponentToParts: [], // conect comp pins with part pins
        PartToPart: [], // conect part pins, nets
        PartToPartNames: [], // name of nets
        need: {}, // need pins settings
        pass: {}, // pass pins settings
      }
    }
    else {
      for (let key in data.electData) {
        this.electData[key] = data.electData[key]
      }
    }

    if (!data.assets) {
      data.compSize = [20, 20] // keep comp size
      data.nets = this.nets // keep nets details
      data.routing_data = [] // keep data of routes - 3d objects
      data.assets = [] // objects loaded
    }

    this.data.nets = this.nets = data.nets
    this.data.routing_data = data.routing_data
    this.data.assets = data.assets
    this.data.compSize = data.compSize
    
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnEveryFrameTrigger, (evt) => {
        if (this.curentOpt !== 5) {
          return
        }  

        if (this.lastPosition !== null) {
          const pos = this.getGroundPosition(evt)
          this.draw3dlines(pos, false)
        }
    }))

    this.addBoard()
    await this.importAssets(this.data.assets)

    this._engine.resize()
  },

  // add callbacks
  addCalbacks (select) {
    this.calbacks.select = select
  },

  // create text input to display the names
  createLabel () {
    let _this = this
    let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')

    let tooltip = new GUI.Rectangle('tooltip')
    tooltip.width = '100px'
    tooltip.height = '30px'
    tooltip.color = 'white'
    tooltip.thickness = 0
    tooltip.horizontalAlignment = 0
    tooltip.verticalAlignment = 0
    tooltip.isVisible = false

    var input = new GUI.InputText()
    this._customTooltipInput(input)
    input.onKeyboardEventProcessedObservable.add(function(val) { 
      if (val.keyCode === 13) { // enter
        if (_this.selected && _this.selected.metadata && _this.selected.metadata.hasOwnProperty('engineData')) {
          _this.selected.metadata.engineData.name2d = input.text
          _this.updateNick(_this.selected.nick, input.text)
        }
        else {
          if (_this.selected && _this.selected.metadata && _this.selected.metadata.hasOwnProperty('net')) {
            _this.nets[_this.selected.metadata.net].name = input.text
            // todo: show in scene somewhere the name of net
            //_this.updateNick(_this.selected.nick, input.text)
          }
        }
      }
    }); 
    tooltip.addControl(input)

    advancedTexture.addControl(tooltip)
    return tooltip
  },

  // style input label
  _customTooltipInput (input) {
    input.height = '30px'
    input.width = '100px'
    input.maxWidth = '50px'
    input.text = ''
    input.color = 'white'
    input.horizontalAlignment = 0
    input.verticalAlignment = 0
    input.background = '#adadad'
  },

  // add grid to scene
  addBoard () {
    if (this.board) {
      this.board.dispose(false, true)
    }

    this.board = BABYLON.MeshBuilder.CreateBox('rectangle', {height: 0.01, width: parseFloat(this.gridSize), depth: parseFloat(this.gridSize), sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    this.board.material = new GridMaterial('material', this.scene)
    this.board.material.majorUnitFrequency = 1 
    this.board.material.gridRatio = this.gridResolution
    this.board.material.opacity = 0.95
    this.board.material.mainColor = BABYLON.Color3.White()
    this.board.material.lineColor = new BABYLON.Color3(0.85, 0.85, 0.85)

    const _this = this
    this.board.actionManager = new BABYLON.ActionManager(this.scene)

    this.board.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt) => {
        if (_this.calbacks && _this.calbacks.select !== null) {
          _this.calbacks.select('0')
        }
        if (_this.curentOpt !== 5) {
          return
        }  
        
        if (_this.lastPosition !== null) {
          const pos = _this.getGroundPosition(evt)
          const auxPoint = _this.draw3dlines(pos)

          const path = _this.nets[_this.currentNet].path
          path[path.length - 1].push(auxPoint, pos)

          if (_this.continuousDraw) {
            _this.lastPosition = pos
          }
          else {
            _this.lastPosition = null
          }
        }
      }))

    this.board.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, () => {
        _this.drawOpt = !_this.drawOpt
      }))
  },

  // create a line between 2 points
  createLineBetween2Points (p1, p2, more = false) {
    const line = BABYLON.MeshBuilder.CreatePlane('wire', {height: 0.05, width: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    var dist = parseFloat(Number(BABYLON.Vector3.Distance(p1, p2)).toFixed(2))
    var rotAngle = Math.atan((p1.x - p2.x) / (p1.z - p2.z))
    
    line.position = BABYLON.Vector3.Center(p1, p2)
    line.position.y = 0.01
    line.rotation = new BABYLON.Vector3(Math.PI / 2, rotAngle + Math.PI / 2, 0)
    line.scaling.x = dist + ((more === true) ? 0.025 : -0.05)
    line.renderingGroupId = 1

    line.material = new BABYLON.StandardMaterial('mat', this.scene)
    line.material.emissiveColor = BABYLON.Color3.FromHexString('#00700b')

    if (more === true) {
      this.addActionOnWire(line)
    }

    return line
  },

  // show/hide grid
  toggleGrid (param) {
    this.board.material.opacity = (param === true) ? 0.5 : 0
  },

  // import data from indexDB, on init engine
  async importAssets (engineData) {
    if (engineData.length === 0) {
      this.addPins()
      this.completlyLoaded = true
      return
    }
    console.log('%c importModel from indexDB', 'background: #222; color: #bada55', engineData)
    await this.import3dModel(engineData, false)

    // add component pins
    this.addPins()

    this.recreateNets()

    this.completlyLoaded = true
  },

  // import function
  // engineData from db
  async import3dModel (engineData) {
    this._engine.displayLoadingUI();
    console.log('engineData on import ', engineData)
    let uniqueId = BABYLON.Tools.RandomId()
    if (isArray(engineData)) {
      for (let i = 0; i < engineData.length; i++) {
        let cuniqueId = BABYLON.Tools.RandomId()
        let pUniqueId
        if (Object.keys(this.objects).length !== 0) {
          pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
        }
        else {
          pUniqueId = uniqueId
          this.objects[pUniqueId] = {}
        }
        
        this.objects[pUniqueId][cuniqueId] = engineData[i]
        await this.handleImport(engineData[i], [cuniqueId, pUniqueId])
      }
    }
    else {
      let pUniqueId
      if (Object.keys(this.objects).length !== 0) {
        pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
      }
      else {
        pUniqueId = uniqueId
        this.objects[pUniqueId] = {}
      }
      
      this.electData.ComponentParts.push([engineData.name, engineData.name2d])

      this.objects[pUniqueId][uniqueId] = engineData
      await this.handleImport(engineData, [uniqueId, pUniqueId])
    }

    this._engine.hideLoadingUI();
  },

  // get index of property in object
  getIndexOfPorp (obj, prop) {
    let j = 0
    for (let k in obj) {
      if (k === prop) {
        console.log(j, ' part id ', k)
        break
      }
      j++
    }
    return j
  },

  // import 3d object in scene
  // engineData from db
  // ids - generated ids onload used to link 3d object with engine data
  async handleImport (engineData, ids) {
    const decode = await attachImgToId(engineData.schematic, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      const meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      console.log(meshes)
      if (meshes.length === 0) {
        console.log('Error on import, empty mesh or wrong data to import')
        return
      } 

      meshes[0].metadata = { 
        engineData: engineData,
        id: ids[0], 
        id1: ids[1], 
        id2: ids[2] 
      }

      // update mesh transforms based on engine data
      meshes[0].position = new BABYLON.Vector3(engineData.transform.best_sc[0], 0, engineData.transform.best_sc[1])
      meshes[0].rotation = new BABYLON.Vector3(0, engineData.transform.best_sc[2], 0)
      
      // do settings related to imported part
      meshes[0].body = null
      meshes[0].pins = []
      meshes[0].nick = null
      
      for (let i = 0; i < meshes.length; i++) {
        if (meshes[i].name.toLowerCase().indexOf('sc_body') !== -1) {
          meshes[0].body = meshes[i]
        }
        else {
          if (meshes[i].name.toLowerCase().indexOf('sc_pin') !== -1) {
            meshes[0].pins.push(meshes[i])
          }
          else {
            if (meshes[i].name.toLowerCase().indexOf('sc_name2d') !== -1) {
              meshes[0].nick = meshes[i]
            }
          }
        }
      }

      // make body clickable
      if (meshes[0].body) {
        this.setBody(meshes[0])
      }

      // make pins clickable
      if (meshes[0].pins.length !== 0) {
        for (let i = 0; i < meshes[0].pins.length; i++) {
          this.setPins(meshes[0].pins[i])
        }
      }

      // update text on nickname plane
      if (meshes[0].nick) {
        this.updateNick(meshes[0].nick, meshes[0].metadata.engineData.name2d)
      }

      console.log(meshes[0])
    }
  },

  // update nickname text
  updateNick (mesh, value) {
    if (mesh.material.albedoTexture) {
      delete mesh.material.albedoTexture
    }

    const dim = mesh.getBoundingInfo().boundingBox.extendSizeWorld
    mesh.material.albedoTexture = new DrawText(this.scene, value, {
      color: '#000000',
      background: '#ffffff',
      invertY: true,
      font: 0,
      rotation: -Math.PI / 2,
      scaling: [dim.x, dim.z]
    }, true)
  },

  // setting pins, clickable
  setPins (pin) {
    const main = pin.parent.parent
    
    const indexOfPart = this.getIndexOfPorp(this.objects[main.metadata.id1], main.metadata.id)
    const split = pin.name.split('_')
    const scPiNnEEDIncrement = parseInt(split[split.length - 1].trim())
    pin.metadata = { 
      indexPin: scPiNnEEDIncrement,
      indexPart: indexOfPart
    }   

    for (let i = 0; i < this.nets.length; i++) {
      for (let j = 0; j < this.nets[i].pins.length; j++) {
        if (this.nets[i].pins[j][0] === parseInt(pin.metadata.indexPart) && this.nets[i].pins[j][1] === parseInt(pin.metadata.indexPin)) {
          pin.metadata = Object.assign({}, pin.metadata, {'net': i})
        }
      }
    }

    const _this = this
    pin.actionManager = new BABYLON.ActionManager(this.scene)

    pin.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
        _this.checkPinStatus(pin)  
    }))
  },

  // function used to add pin to net, remove pin from net, merge net
  checkPinStatus (pin) {
    if (this.curentOpt !== 5) {
      return
    }      
 
    // first time click on this pin
    if (!pin.metadata.hasOwnProperty('net')) {
      console.log('click on pin after I already build a net')

      if (this.lastPosition !== null) {
        // on end
        const pos = pin.getAbsolutePosition()
        const auxPoint = this.draw3dlines(pos)

        const path = this.nets[this.currentNet].path
        path[path.length - 1].push(auxPoint, pos)
        this.nets[this.currentNet].pins.push([pin.metadata.indexPart, pin.metadata.indexPin])
        this.lastPosition = null
      }
      else {
        console.log('click on pin first, nothing build before')

        // set curentNet which is the length of nets array
        this.currentNet = this.nets.length

        // save last point clicked which is position of clicked pin
        this.lastPosition = pin.getAbsolutePosition()

        // add new net object 
        this.nets.push({
          name: 'Net ' + this.nets.length,
          path: [[this.lastPosition.clone()]],
          pins: [[pin.metadata.indexPart, pin.metadata.indexPin]]
        })
      }

       // set net to pin metadata
       if (pin.metadata.hasOwnProperty('net')) {
        pin.metadata.net = this.currentNet
      }
      else {
        pin.metadata = Object.assign({}, pin.metadata, {'net': this.currentNet})
      }
    }
    else {
      if (pin.metadata.net !== this.currentNet) {
        console.log("click on pin which already have a net different from curent net")
        if (this.lastPosition !== null) {
          console.log("click on pin after I already build a net")
          if (confirm('Do you want to merge curent net ' + this.nets[this.currentNet].name + ' to net ' + this.nets[pin.metadata.net].name)) {
            // draw the lines
            const pos = this.getGroundPosition()
            const auxPoint = this.draw3dlines(pos)

            const path = this.nets[this.currentNet].path
            path[path.length - 1].push(auxPoint, pos)
            this.lastPosition = null

            // merge path and pins
            const clicked = this.nets[pin.metadata.net]
            clicked.path = clicked.path.concat(this.nets[this.currentNet].path)
            clicked.pins = clicked.pins.concat(this.nets[this.currentNet].pins)
            
            // remove net data from nets array
            this.nets.splice(this.currentNet, 1)

            // update wire net data
            for (let i = 0; i < this.wires.length; i++) {
              if (this.wires[i].metadata.hasOwnProperty('net')) {
                if (this.wires[i].metadata.net === this.currentNet) {
                  this.wires[i].metadata.net = pin.metadata.net
                }
                else {
                  this.wires[i].metadata.net = this.wires[i].metadata.net - 1
                }
              }
            }

            // update pin net data
            for (let i = 0; i < this.nets.length; i++) {
              for (let j = 0; j < this.nets[i].pins.length; j++) {
                const indPart = this.nets[i].pins[j][0]
                const indPin = this.nets[i].pins[j][1]
                for (let k = 0; k < this.scene.meshes.length; k++) {
                  if (this.scene.meshes[k].metadata && this.scene.meshes[k].metadata.hasOwnProperty('indexPart') && this.scene.meshes[k].metadata.hasOwnProperty('indexPin')) {
                    if (this.scene.meshes[k].metadata.indexPart === indPart && this.scene.meshes[k].metadata.indexPin === indPin) {
                      this.scene.meshes[k].metadata.net = i
                    }
                  }
                }
              }
            }
            
            this.currentNet = pin.metadata.net
            this.lastPosition = null            
          }
        }
        else {
          console.log("click on pin for first time")

          this.currentNet = pin.metadata.net

          // save last point clicked which is position of clicked pin
          const point = pin.getAbsolutePosition()

          const path = this.nets[this.currentNet].path
          path.push([point])

          this.lastPosition = point
        }
      }
      else {
        console.log("click on pin which is in the same net")
        
        if (this.lastPosition !== null) {
          console.log("click on pin after I already build a net")

          // save last point clicked which is position of clicked pin
          const pos = pin.getAbsolutePosition()
          const auxPoint = this.draw3dlines(pos)
      
          const path = this.nets[this.currentNet].path
          path[path.length - 1].push(auxPoint, pos)
          
          this.lastPosition = null
        }
        else {
          console.log("click on pin for first time")

          // save last point clicked which is position of clicked pin
          const point = pin.getAbsolutePosition()

          const path = this.nets[this.currentNet].path
          path.push([point])

          this.lastPosition = point
        }
      }
    }
  },

  // add action on created wire
  addActionOnWire (line) {
    line.metadata = {
      'net': this.currentNet
    }

    const _this = this
    line.actionManager = new BABYLON.ActionManager(this.scene)

    line.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, async (evt) => {
        if (_this.calbacks && _this.calbacks.select !== null) {
          _this.calbacks.select('2')
        }
        switch (_this.curentOpt) {
          case 3:
            if (confirm('Do you want to remove this net?')) {
              const curent = evt.source.metadata.net

              // remove 3d objects
              for (let i = _this.wires.length - 1; i >=0; i--) {
                if (_this.wires[i].hasOwnProperty('metadata')) {
                  if (_this.wires[i].metadata.net === evt.source.metadata.net) {
                    _this.wires[i].dispose(false, true)
                    _this.wires.splice(i, 1)
                  }
                }
              }

              // remove net data from pins
              // decrease net index on other pins
              for (let i = 0; i < _this.nets[curent].pins.length; i++) {
                const indPart = _this.nets[curent].pins[i][0]
                const indPin = _this.nets[curent].pins[i][1]
                for (let j = 0; j < _this.scene.meshes.length; j++) {
                  if (_this.scene.meshes[j].metadata && _this.scene.meshes[j].metadata.hasOwnProperty('indexPart') && _this.scene.meshes[j].metadata.hasOwnProperty('indexPin')) {
                    if (_this.scene.meshes[j].metadata.indexPart === indPart && _this.scene.meshes[j].metadata.indexPin === indPin) {
                      delete _this.scene.meshes[j].metadata.net
                    }
                  }
                  if (_this.scene.meshes[j].metadata && _this.scene.meshes[j].metadata.hasOwnProperty('net')) {
                    if (_this.scene.meshes[j].metadata.net > curent) {
                      _this.scene.meshes[j].metadata.net -= 1
                    }
                  }
                }
              }

              // remove net data
              _this.nets.splice(curent, 1)
              _this.currentNet = _this.nets.length - 1
            }
            break;

          case 4:
            _this.selected = evt.source
            _this.label.children[0].text = _this.nets[evt.source.metadata.net].name
            _this.label.isVisible = true;
            
            // highlight 
            
            break;

          case 5:
            // already have a net
            if (_this.lastPosition !== null) {
              // already have a net
              if (evt.source.metadata.net === _this.currentNet) {
                // click on wire from the same net

                const pos = _this.getGroundPosition(evt)
                const auxPoint = _this.draw3dlines(pos)
            
                const path = _this.nets[_this.currentNet].path
                path[path.length - 1].push(auxPoint, pos)
                _this.lastPosition = null
              }
              else {
                // click on wire from different net
                console.log('merge nets')
                if (confirm('Do you want to merge curent net ' + _this.nets[_this.currentNet].name + ' to net ' + _this.nets[evt.source.metadata.net].name)) {
                  // draw the lines
                  const pos = _this.getGroundPosition(evt)
                  const auxPoint = _this.draw3dlines(pos)

                  const path = _this.nets[_this.currentNet].path
                  path[path.length - 1].push(auxPoint, pos)
                  _this.lastPosition = null

                  // merge path and pins
                  const clicked = _this.nets[evt.source.metadata.net]
                  clicked.path = clicked.path.concat(_this.nets[_this.currentNet].path)
                  clicked.pins = clicked.pins.concat(_this.nets[_this.currentNet].pins)
                  
                  // remove net data from nets array
                  _this.nets.splice(_this.currentNet, 1)

                  // update wire net data
                  for (let i = 0; i < _this.wires.length; i++) {
                    if (_this.wires[i].metadata.hasOwnProperty('net')) {
                      if (_this.wires[i].metadata.net === _this.currentNet) {
                        _this.wires[i].metadata.net = evt.source.metadata.net
                      }
                      else {
                        _this.wires[i].metadata.net = _this.wires[i].metadata.net - 1
                      }
                    }
                  }

                  // update pin net data
                  for (let i = 0; i < _this.nets.length; i++) {
                    for (let j = 0; j < _this.nets[i].pins.length; j++) {
                      const indPart = _this.nets[i].pins[j][0]
                      const indPin = _this.nets[i].pins[j][1]
                      for (let k = 0; k < _this.scene.meshes.length; k++) {
                        if (_this.scene.meshes[k].metadata && _this.scene.meshes[k].metadata.hasOwnProperty('indexPart') && _this.scene.meshes[k].metadata.hasOwnProperty('indexPin')) {
                          if (_this.scene.meshes[k].metadata.indexPart === indPart && _this.scene.meshes[k].metadata.indexPin === indPin) {
                            _this.scene.meshes[k].metadata.net = i
                          }
                        }
                      }
                    }
                  }
                  
                  _this.currentNet = evt.source.metadata.net
                  _this.lastPosition = null
                }
              }
            }
            else {
              // begin a new net with this click

              // set curentNet from clicked wire
              _this.currentNet = evt.source.metadata.net

              // store clicked point
              _this.lastPosition = _this.getGroundPosition(evt)

              // create a new array for path
              const path = _this.nets[_this.currentNet].path
              path.push([_this.lastPosition.clone()])
            }
            break;
          
          case 6:
            var net = evt.source.metadata.net
            for (let i = 0; i < _this.wires.length; i++) {
              if (_this.wires[i].metadata && _this.wires[i].metadata.hasOwnProperty('net') && _this.wires[i].metadata.net === net) {
                _this.wires[i].overlayColor = new BABYLON.Color3(1, 1, 0)
                _this.wires[i].renderOverlay = true
              }
              else {
                _this.wires[i].renderOverlay = undefined
              }
            }
            break;

          default:
            break;
        }
    }))
  },

  // draw 3d lines object on the board
  draw3dlines (pos, store = true) {
    if (this.auxline !== null) {
      this.auxline.dispose(false, true)
      this.auxline = null
    }

    let auxPoint = pos.clone()
    if (this.drawOpt) {
      auxPoint.x = this.lastPosition.x
    }
    else {
      auxPoint.z = this.lastPosition.z
    }

    const l1 = this.createLineBetween2Points(this.lastPosition, auxPoint, true)
    const l2 = this.createLineBetween2Points(auxPoint, pos, true)

    if (store) {
      const auxline = BABYLON.Mesh.MergeMeshes([l1,l2], true)
      this.addActionOnWire(auxline)
      this.wires.push(auxline)
    }
    else {
      this.auxline = BABYLON.Mesh.MergeMeshes([l1,l2], true)
    }

    return auxPoint
  },

  // setting body, clickable
  setBody(mesh) {
    const main = mesh
    const collider = main.body

    const _this = this
    collider.actionManager = new BABYLON.ActionManager(this.scene)

    // left click on body
    collider.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, async (evt) => {
        if (_this.calbacks && _this.calbacks.select !== null) {
          _this.calbacks.select('1')
        }
        const _thism = evt.source.parent.parent
        if (evt.sourceEvent.button === 0) {
          switch (_this.curentOpt) {

            case 0:
              _this.selected = _thism
              // var index = _this.getIndexOfPorp(_this.objects[_thism.metadata.id1], _thism.metadata.id)
              var startingPoint = _this.getGroundPosition(evt)
              _this._observer = _this.scene.onPointerObservable.add((evt) => {
                if (!startingPoint) return
                var current = _this.getGroundPosition(evt)
                if (!current) return
    
                var diff = current.subtract(startingPoint)
                _this.selected.position.addInPlace(diff)
                startingPoint = current
    
                // recreate routes if has routes - todo
                _this.updateWires()
              }, BABYLON.PointerEventTypes.POINTERMOVE)
              _this.scene.activeCamera.detachControl(_this.canvas)
              break;

            case 1:
              _this.selected = _thism
              _this.selected.rotation.y += Math.PI / 2
              _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y])

              // recreate routes if has routes - todo
              _this.updateWires()
              break;

            case 2:
                if (confirm('Do you want to multiply this part?')) {
                  const data = JSON.parse(JSON.stringify(Object.assign({}, _thism.metadata.engineData)))
                  await _this.import3dModel(data)
                }
              break;
            
            case 3:
              if (confirm('Do you want to remove this part?')) {
                // remove pins from net
                let pins = []
                for (let i = 0; i < _thism.pins.length; i++) {
                  pins.push([_thism.pins[i].metadata.indexPart, _thism.pins[i].metadata.indexPin, _thism.pins[i].metadata.net])
                }

                for (let i = 0; i < pins.length; i++) {
                  if (pins[i][2]) {
                    for (let j = _this.nets[pins[i][2]].pins.length - 1; j >= 0; j--) {
                      if (_this.nets[pins[i][2]].pins[j][0] === pins[i][0] && _this.nets[pins[i][2]].pins[j][1] === pins[i][1]) {
                        _this.nets[pins[i][2]].pins.splice(j, 1)
                      }
                    }
                  }
                }
                
                // remove 3d object
                const keys = _thism.metadata
                _thism.dispose(false, true)

                if (_this.objects[keys.id1]) {
                  delete _this.objects[keys.id1][keys.id]
                  if (Object.keys(_this.objects[keys.id1]).length === 0) {
                    delete _this.objects[keys.id1]
                  }
                }

                // recreate routes if has routes - todo
                _this.updateWires()
              }
              break;

              case 4:
                _this.selected = _thism
                _this.label.children[0].text = _thism.metadata.engineData.name2d
                _this.label.isVisible = true;
                break;

            default:
              break;
          }
         
        }
    }))

    collider.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (evt) => {
        if (evt.sourceEvent.button === 0) {
          if (_this.curentOpt === 0) {
            _this.scene.onPointerObservable.remove(_this._observer)
            _this.scene.activeCamera.attachControl(_this.canvas, false)
            
            // update indexDB data
            _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y])
          
             // recreate routes if has routes - todo
            _this.updateWires()
          }
        }
    }))
  },

  // get engineData of selected object
  getMeshEngineData () {
    let data = {}

    if (this.objects[this.selected.metadata.id2]) {
      // console.log('3 ', this.objects[this.selected.metadata.id2][this.selected.metadata.id1][this.selected.metadata.id])
      data = this.objects[this.selected.metadata.id2][this.selected.metadata.id1][this.selected.metadata.id]
    }
    else {
      if (this.objects[this.selected.metadata.id1]) {
        // console.log('2 ', this.objects[this.selected.metadata.id1][this.selected.metadata.id])
        data = this.objects[this.selected.metadata.id1][this.selected.metadata.id]
      }
      else {
        // console.log('1 ', this.objects[this.selected.metadata.id])
        data = this.objects[this.selected.metadata.id]
      }
    }

    console.log(data, this.selected.metadata)
    return data
  },

  // updateWires
  updateWires () {
    return
    /*for (let i = 0; i < this.wires.length; i++) {
      this.wires[i].dispose(false, true)
    }

    this.wires = []

    this.recreateNets()*/
  },

  // update infos from indexDB
  updateDataToIndexDB (best_sc) {
    const data = this.getMeshEngineData()
    // console.log(data, this.selected, this.selected.metadata, this.objects)
    data.transform.best_sc = best_sc
  },
  
  setPositionByPivot (transform, boardSize) {
    let diff = [boardSize[0] / 2, boardSize[1] / 2]
    if (transform['rotation'][1] % 180 === 0) {
      diff = [boardSize[0] / 2 + transform['pivot'][0], boardSize[1] / 2 + transform['pivot'][1]]
    }
    else {
      diff = [boardSize[0] / 2 + transform['pivot'][1], boardSize[1] / 2 + transform['pivot'][0]]
    }
    return [-(transform['position'][0] - diff[0]), -(transform['position'][2] - diff[1])]
  },

  // send data to be saved to indexDB
  getData () {
    let data = []
    // console.log(this.objects)
    for (let key in this.objects) {
      if (key === 'indexDBId') continue
      for(let key2 in this.objects[key]) {
        if (key2 === 'indexDBId') continue
        data.push(this.objects[key][key2])
      }       
    }

    let ComponentParts = []
    // let routes = []
    let ComponentToParts = []
    let PartToPart = []
    let PartToPartNames = []
    for (let i = 0; i < data.length; i++) {
      ComponentParts.push(data[i].name, data[i].name2d)
    }
    for (let i = 0; i < this.nets.length; i++) {
      PartToPartNames.push(this.nets[i].name)
      PartToPart.push([])
      for (let j = 0; j < this.nets[i].pins.length; j++) {
        if (this.nets[i].pins[j][0] === -1) {
          ComponentToParts.push([])

          let local = null
          for (let k = 0; k < this.nets[i].pins.length; k++) {
            if (this.nets[i].pins[k][0] !== -1) {
              local = this.nets[i].pins[k]
              break
            }
          }
          if (local !== null) {
            ComponentToParts[ComponentToParts.length - 1].push(this.nets[i].pins[j][1], local[0], local[1])
          }
        }
        else {
          PartToPart[PartToPart.length - 1].push(this.nets[i].pins[j][0], this.nets[i].pins[j][1])
        }
      }

      if (PartToPart.length !== 0 && PartToPart[PartToPart.length - 1].length === 0) {
        PartToPart.splice(PartToPart.length - 1, 1)
      }

      if (ComponentToParts.length !== 0 && ComponentToParts[ComponentToParts.length - 1].length === 0) {
        ComponentToParts.splice(ComponentToParts.length - 1, 1)
      }
    }

    // console.log(PartToPart, PartToPartNames, ComponentToParts)
    // console.log(routes, this.completlyLoaded, data)

    if (this.completlyLoaded) {
      this.data.assets = data
      this.data.nets = this.nets
      this.electData.ComponentParts = ComponentParts
      this.electData.ComponentToParts = ComponentToParts
      this.electData.PartToPart = PartToPart
      this.electData.PartToPartNames = PartToPartNames
    }

    /*console.log(JSON.stringify({
      nets: this.data.nets,
      routing_data: this.data.routing_data,
      assets: this.data.assets,
      compSize: this.data.compSize,
      electData: this.electData
    }))*/
    return {
      nets: this.data.nets,
      routing_data: this.data.routing_data,
      assets: this.data.assets,
      compSize: this.data.compSize,
      electData: this.electData
    }
  },

  // reset data from indexDB
  resetSavedData () {
    this.objects = {}

    this.electData = {
      ComponentParts: [],
      ComponentToParts: [],
      PartToPart: [],
      PartToPartNames: [],
      need: {},
      pass: {}
    }

    this.gridSize = 100
    this.data.routing_data = []
    this.nets = []
    this.data.assets = []
    this.data.compSize = [20,20]
  },

  // recalibrate camera to default settings
  toDefaultCameraSetting () {
    this.scene.activeCamera.alpha = Math.PI / 2
    this.scene.activeCamera.beta = 0
    this.scene.activeCamera.radius = 10
    this.scene.activeCamera.target = BABYLON.Vector3.Zero()
  },

  resortPins () {
    for (let i = 0; i < this.componentPins['need'].length; i++) {
      this.componentPins['need'][i].dispose(false, true)
    }
    for (let i = 0; i < this.componentPins['pass'].length; i++) {
      this.componentPins['pass'][i].dispose(false, true)
    }

    this.componentPins['need'] = []
    this.componentPins['pass'] = []
  },

  updateComponentInfo(data) {
    console.log(data)
    this.electData['need'] = data['need']
    this.electData['pass'] = data['pass']

    this.addPins()
    this.updateWires()
  },

  addPins () {
    this.resortPins()

    if (this.electData['need'] && this.electData['need'].pin && this.electData['need'].pin.length !== 0) {
      for (let i = 0; i < this.electData['need'].pin.length; i++) {
        this.addPinEngine(0, this.electData['need'].pin[i])
      }
    }

    if (this.electData['pass'] && this.electData['pass'].pin && this.electData['pass'].pin.length !== 0) {
      for (let i = 0; i < this.electData['pass'].pin.length; i++) {
        this.addPinEngine(1, this.electData['pass'].pin[i])
      }
    } 
  },

  addPinEngine (side, name) {
    const type = ['need', 'pass']
    const pin = BABYLON.MeshBuilder.CreatePlane('Pin_', { width: 0.4, height: 0.1, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
    pin.position.x = this.getCompDimensions(side)
    pin.material = new BABYLON.PBRMaterial('stdMaterial', this.scene) 
    pin.material.albedoColor = (side ===0) ? BABYLON.Color3.FromHexString('#00ff00') : BABYLON.Color3.FromHexString('#0000ff')
    pin.material.metallic = 0
    pin.material.roughness = 1
    this.componentPins[type[side]].push(pin)

    let  index = this.componentPins['need'].length
    if (side === 1) {
      index += this.componentPins['pass'].length
    }

    pin.metadata = { 
      indexPin: index,
      indexPart: -1
    }    
    const k = this.electData[type[side]].pin.length
    const i = this.componentPins[type[side]].length - 1
    const pitch = 0.6

    pin.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0)
    if (k % 2 !== 0) {
      pin.position.z = (i % k) * pitch - pitch * ((k / 2 < 1) ? 0 : parseInt(k / 2))
    }
    else {
      pin.position.z = (i % k) * pitch + pitch / 2 - pitch * (k / 2)
    }
    pin.position.y = 0.01

    const plan = BABYLON.MeshBuilder.CreatePlane('pn', { width: 0.4, height: 0.35, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
    plan.material = new BABYLON.PBRMaterial('stm', this.scene)
    plan.material.metallic = 0
    plan.material.roughness = 1
    plan.material.albedoTexture = new DrawText(this.scene, name, {
      color: '#000000',
      background: '#ffffff',
      invertY: true,
      font: 3,
      rotation: Math.PI / 2
    })
    
    plan.setParent(pin)
    plan.rotation = BABYLON.Vector3.Zero()
    plan.position = new BABYLON.Vector3(0, -0.225, 0)

    pin.name = pin.id = 'Pin_' + index

    for (let i = 0; i < this.nets.length; i++) {
      for (let j = 0; j < this.nets[i].pins.length; j++) {
        if (this.nets[i].pins[j][0] === parseInt(pin.metadata.indexPart) && this.nets[i].pins[j][1] === parseInt(pin.metadata.indexPin)) {
          pin.metadata = Object.assign({}, pin.metadata, {'net': i})
        }
      }
    }

    const _this = this
    pin.actionManager = new BABYLON.ActionManager(this.scene)

    pin.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
        _this.checkPinStatus(pin)
    }))
  },

  recreateNets () {
    for (let i = 0; i < this.nets.length; i++) {
      this.currentNet = i
      for (let j = 0; j < this.nets[i].path.length; j++) {
        for (let k = 0; k < this.nets[i].path[j].length - 1; k++) {
          const p1 = new BABYLON.Vector3(this.nets[i].path[j][k].x, this.nets[i].path[j][k].y, this.nets[i].path[j][k].z)
          
          if (this.nets[i].path[j][k+1]) {
            const p2 = new BABYLON.Vector3(this.nets[i].path[j][k+1].x, this.nets[i].path[j][k+1].y, this.nets[i].path[j][k+1].z)
            const line = this.createLineBetween2Points(p1, p2, true)
            this.wires.push(line)
          }
        }
      }
    }
  },

  getCompDimensions (side) {
    let partInScene = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.hasOwnProperty('id')) {
        partInScene.push(this.scene.meshes[i])
      }
    }

    if (partInScene.length === 0) {
      if (side === 0) {
        return 20
      }
      else {
        return -20
      }
    }

    const parent = new BABYLON.AbstractMesh('parent', this.scene)
    for (let i = 0; i < partInScene.length; i++) {
      partInScene[i].setParent(parent)
    }

    const bnds = parent.getHierarchyBoundingVectors(true)
    const positions = BABYLON.Vector3.Center(bnds.max, bnds.min)
    let scaling = new BABYLON.Vector3(0,0,0)
    bnds.max.subtractToRef(bnds.min, scaling)

    for (let i = 0; i < partInScene.length; i++) {
      partInScene[i].setParent(null)
    }
    parent.dispose()

    const box = new BABYLON.Mesh.CreateBox('nbo', 1, this.scene)
    box.isPickable = false
    box.position = positions
    box.scaling = scaling
    box.visibility = 0.2
   
    box.computeWorldMatrix(true)
    const bbInfo = box.getBoundingInfo().boundingBox
    box.dispose()
    if (side === 0) {
      return bbInfo.maximumWorld.x + 3
    }
    else {
      return bbInfo.minimumWorld.x - 3
    }
  },

  getObjectToBeSaved () {
    const tobesaved = Object.assign({}, this.data)
    delete tobesaved.assets

    return {
      engine: this.data.assets,
      custom: tobesaved,
      data: this.electData,
    }
  },

  // change grid resolution
  changeResolution (param) {
    this.gridResolution = parseFloat(param / 100)

    this.addBoard()
  },

  // used on dragging
  getGroundPosition () {
    var _that = this
    var pickinfo = _that.scene.pick(_that.scene.pointerX, _that.scene.pointerY, function (mesh) { return mesh === _that.board })

    if (pickinfo.hit) {
      return new BABYLON.Vector3(_that.snapToGrip(parseFloat(pickinfo.pickedPoint.x)), 0, _that.snapToGrip(parseFloat(pickinfo.pickedPoint.z)))
    }
      return null
  },

  // snap on both sides
  snapToGrip (val) {
    return parseFloat((this.gridResolution * Math.round(val / this.gridResolution)).toFixed(2));
  },

  // return position of pin with index
  getPointFromPin (arrayData) {
    const indexOfPart = arrayData[0]
    const indexOfPin = arrayData[1]
    console.log(indexOfPart, indexOfPin)
    let pin
    if (indexOfPart === -1) {
      if (indexOfPin > this.componentPins.need.length) {
        pin = this.componentPins.pass[(indexOfPin - this.componentPins.need.length - 1)]
      }
      else{
        pin = this.componentPins.need[indexOfPin - 1]
      }
    }
    else {
      for (let i = 0; i < this.scene.meshes.length; i++) {
        if (this.scene.meshes[i].metadata) {
          if (parseInt(this.scene.meshes[i].metadata.indexPin) === indexOfPin && parseInt(this.scene.meshes[i].metadata.indexPart) === indexOfPart) {
            pin = this.scene.meshes[i]
            break
          }
        }
      }
    }
    console.log(pin)
    if (pin) {
      return pin.getAbsolutePosition().clone()
    }
    else {
      return BABYLON.Vector3.Zero()
    }
  },
  
  // empty scene
  clearScene () {
    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 1; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
        this.scene.meshes.slice(i, 1)
      }
    }

    console.log('clear scene, empty indexDB')
    this.resetSavedData()
  },

  getPrice () {
    let names = {}
    if (this.data) {
      for (let i = 0; i < this.data.assets.length; i++) {
        if (names.hasOwnProperty(this.data.assets[i].name)) {
          names[this.data.assets[i].name] += 1
        }
        else {
          names[this.data.assets[i].name] = 1
        }
      }
    }

    console.log(names)
    return names
  },

  disposeEngine () {
    this.clearScene()
    
    this.canvas = null
    this.calbacks = {
      select: null // calback when click on component, part, wire
    },
    this.board = null
    this.selected = null
    this.lastPosition = null
    this.auxline = null
    this.nets = []
    this.wires = []
    this.currentNet = -1
    this.completlyLoaded = false
    this.componentPins = {
      need: [],
      pass: []
    }

    this.label.parent.dispose()
    this.label = null

    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 0; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
      }
      this.scene.dispose()
      delete this.scene
    }

    if (this._engine) {
      this._engine.stopRenderLoop()
      this._engine.clear(BABYLON.Color3.White(), true, true, true)
      this._engine.dispose()
      delete this._engine
    }

    delete this
  },

  func_ (param) {
    this.label.isVisible = false;
    for (let i = 0; i < this.wires.length; i++) {
      this.wires[i].renderOverlay = undefined
    }
    this.curentOpt = parseInt(Object.keys(this.options).find(key => this.options[key] === param));
  }
}