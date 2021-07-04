/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { attachImgToId } from '../../helpers/getImg'
// import { DrawText } from '../../emerge_scripts_common/Utils'
import { isArray } from 'util'
import Wire from './wire'
import Board from './board'
import Item from './item'
import 'babylonjs-loaders'
// import * as dbHelper from '../../helpers/product-project';

const MESHTYPE = {
  COVERPART: 0,
  ELECPART: 1,
  BOARD: 2
}

export default {
  scene: null,
  objects: {}, // loadded objects in scene
  _engine: null,
  canvas: null,
  main: null,
  calbacks: {
    select: null // calback when click on component, part, wire
  },
  board: null, // the board
  selected: null, // selected part, wire, pin
  data: {}, // data for scene, which parts, routes
  indexOfPCB: 0,
  items: [], // all items in scene 
  wires: [], // all wires in scene
  holes: [], // all wires in scene
  lastPosition: null,
  startingPoint: null,
  tooltip: null,
  tobeSaveInGeneral: null,
  completlyLoaded: false,
  // init the entire scene
  async init (scene, data, indexOfPCB, tobeSaveInGeneral) {
    this.tobeSaveInGeneral = tobeSaveInGeneral
    this.scene = scene
    this._engine = scene.getEngine()
    this.canvas = this._engine.getRenderingCanvas()
    this.objects = {}

    const uniqueId = BABYLON.Tools.RandomId()
    this.objects[uniqueId] = {}
    this.indexOfPCB = indexOfPCB

    if (!data || !data.board) {
      data.board = {
        'pcb_size': [50, 50],
        'pcb_layers': 1,
        'isCircle': false,
        'color': '#0a7900',
        'layerThickness': 0.16,
        'visibility': [],
        'routing_layers': 2,
        'gridResolution': 0,
        'enableGrid': false,
        'fixingHoles': []
      }
    }
  
    this.data.board = data.board
    this.data.engine = data.engine || [[]]
    this.data.placement = data.placement || []
    this.data.routing = data.routing || []
    this.data.vias = data.vias || []

    this.tooltip = this.addTooltip()

    this.main = new BABYLON.AbstractMesh('__root__', this.scene)
    this.main.metadata = this.data

    this.board = new Board(this.data.board, this.scene)
    
    for(let i = 0; i < this.board.layers.length; i++) {
      this.board.layers[i].parent = this.main
    }
    this.board.grid.parent = this.main

    await this.importAssets(this.data.engine[0])

    return this
  },

  ///////////////////// start board functions /////////////////////

  // change Resolution of board
  // float
  changeResolution (param) {
    this.data.board['gridResolution'] = param
    this.board.recreateBoard()
  },

  // change Thickness of board
  // float
  changeThickness (param) {
    this.data.board['layerThickness'] = param
    this.board.recreateBoard()
  },

  // change shape of board
  // bool
  changeShape (param) {
    this.data.board['isCircle'] = true
    this.data.board['pcb_size'] = [param, param]
    this.board.recreateBoard()
  },

  // change Thickness of board
  // hex string
  changeColor (param) {
    this.data.board['color'] = param
    this.board.recreateBoard()
  },

  // change Size of board
  // float, float
  changeSize (width, depth) {
    this.data.board['isCircle'] = false
    this.data.board['pcb_size'] = [width, depth]
    this.board.recreateBoard()
  },

  // toggle layers visibility
  // bool
  toggleLayers (param) {
    for (let i = 0; i < this.data.board['pcb_layers']; i++) {
      this.data.board['visibility'][i] = param
    }
    this.board.recreateBoard()
  },

  // toggle layer visibility
  // int bool
  toggleLayer (param1, param2) {
    this.data.board['visibility'][param1] = param2
    this.board.recreateBoard()
  },

  // add one layer
  addLayer () {
    this.data.board['pcb_layers'] += 1
    this.board.recreateBoard()
  },

  // remove one layer
  removeLayer () {
    this.data.board['pcb_layers'] -= 1
    this.board.recreateBoard()
  },

  // toggle grid
  // bool
  toggleGrid (param) {
    this.data.board['enableGrid'] = param
    this.board.recreateBoard()
  },

  ///////////////////// end board functions /////////////////////


  //////////////////// start part functions /////////////////////

  // import data from indexDB, on init engine
  async importAssets (engineData) {
    if (engineData.length === 0) {
      this.completlyLoaded = true
      return
    }
    console.log('%c importModel from indexDB', 'background: #222; color: #bada55', engineData)
    await this.import3dModel(engineData)

    this.updatePlacememnt()
    this.updateRouting()

    // this.updateKeyElectronics()
  },

  // import function
  // engineData from db
  async import3dModel (engineData) {
    this._engine.displayLoadingUI();

    // console.log('engineData on import ', engineData)
    // if import simple part handle it as component with 1 part
    if (!isArray(engineData)) {
      engineData = [engineData]
    }

    const pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
    let uniqueId = BABYLON.Tools.RandomId()
    let cuniqueId
    for (let i = 0; i < engineData.length; i++) {  
      // on refresh page
      if (isArray(engineData[i])) {
        uniqueId = BABYLON.Tools.RandomId()
        this.objects[pUniqueId][uniqueId] = {}

        for (let j = 0; j < engineData[i].length; j++) {
          cuniqueId = BABYLON.Tools.RandomId()
          this.objects[pUniqueId][uniqueId][cuniqueId] = engineData[i][j]
          await this.handleImport(engineData[i][j], [cuniqueId, uniqueId, pUniqueId])
        }
      }
      // on import new component
      else {
        if (!this.objects[pUniqueId][uniqueId]) {
          this.objects[pUniqueId][uniqueId] = {}
        }

        cuniqueId = BABYLON.Tools.RandomId()
        this.objects[pUniqueId][uniqueId][cuniqueId] = engineData[i]
        await this.handleImport(engineData[i], [cuniqueId, uniqueId, pUniqueId])
      }
    }
    
    this._engine.hideLoadingUI();
  },

  // import 3d object in scene
  // engineData from db
  // ids - generated ids onload used to link 3d object with engine data
  async handleImport (engineData, ids) {
    let meshes = []
    console.log('engineData ', engineData)
    let exist = null
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].engineData && (this.items[i].engineData.url === engineData.url)) {
        exist = this.items[i]
      }
    }

    console.log(exist)
    if (exist) {
      const mesh = exist.main.clone('__root__', null, false)
      meshes.push(mesh)
      const kids = mesh.getChildren()
      for (let i = 0; i < kids.length; i++) {
        const names1 = kids[i].name.split('.')
        kids[i].name = names1[names1.length - 1]
        meshes.push(kids[i])

        let kids2 = kids[i].getChildren()
        for (let j = 0; j < kids2.length; j++) {
          const names2 = kids2[j].name.split('.')
          kids2[j].name = names2[names2.length - 1]
          meshes.push(kids2[j])
        }
      }
      // console.log('mesh1 ', meshes)
    }
    else {
      const decode = await attachImgToId(engineData.url, true)
      if (!decode) return
      const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
      const blob = new Blob([raw_content])
      const BBJSurl = URL.createObjectURL(blob)
      if (BBJSurl) {
        BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
        // console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
        meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      }
    }
    
    console.log('meshes ', meshes)
    if (meshes.length === 0) {
      console.log('Error on import, empty mesh or wrong data to import')
      return
    } 

    meshes[0].parent = this.main

    meshes[0].animu = true // for general animation
    const item = new Item(meshes, this.scene, this.tobeSaveInGeneral, this.indexOfPCB)
    if (!engineData.transform['mirror']) {
      engineData.transform['mirror'] = false
    }

    if (engineData.auxData) {
      const decode = await attachImgToId(engineData.auxData.url, true)
      if (!decode) return
      const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
      const blob = new Blob([raw_content])
      const BBJSurl = URL.createObjectURL(blob)
      if (BBJSurl) {
        BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
        console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
        meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
        meshes[0].setParent(item.body)
        meshes[0].position = new BABYLON.Vector3(engineData.auxData.transform.position[0],engineData.auxData.transform.position[1],engineData.auxData.transform.position[2])
        meshes[0].rotation = new BABYLON.Vector3(engineData.auxData.transform.rotation[0],engineData.auxData.transform.rotation[1],engineData.auxData.transform.rotation[2])
        meshes[0].scaling = new BABYLON.Vector3(engineData.auxData.transform.scale[0],engineData.auxData.transform.scale[1],engineData.auxData.transform.scale[2])
      }
    }
    item.engineData = engineData
    item.boardH = this.board.height
    item.updateTransform()

    item.setMetadata({ 
      name: engineData.name,
      id: ids[0], 
      id1: ids[1], 
      id2: ids[2] 
    })
    
    this.objects[ids[2]][ids[1]][ids[0]] = item

    if (item.body) {
      this.setBody(item) // -- uncoment for interaction
    }

    // put decal upper
    if (item.decal) {
      item.decal.isPickable = false
    }

    // show layer1
    if (item.layer1.length !== 0) {
      for (let i = 0; i < item.layer1.length; i++) {
        item.layer1[i].isVisible = true
        if (item.layer1[i].material) {
          item.layer1[i].material.zOffset = -2
        }
      }
    }

    // add pads on bottom of pcb for th parts
    let newLayers = []
    for (let i = 0; i < item.layer1.length; i++) {
      if (item.engineData['transform']['thole'] && (item.engineData['transform']['thole'] !== null) && (item.engineData['transform']['thole'] !== 0)) {
        const newLayer = item.layer1[i].clone('name', item.layer1[i].parent)
        newLayer.name = newLayer.id = item.layer1[i].name + i
        newLayer.material = item.layer1[i].material

        if (item.engineData['transform']['rotation'][0] !== 0) {
          newLayer.position.y = parseFloat(this.board._args['layerThickness'])
        }
        else {
          newLayer.position.y = -parseFloat(this.board._args['layerThickness'])
        }
        newLayers.push(newLayer) 
      } 
    }
    if (newLayers.length !== 0) {
      item.layer1 = item.layer1.concat(newLayers)
    }

    // show layer21
    if (item.layer21) {
      item.layer21.isVisible = true
      if (item.layer21.material) {
        item.layer21.material.zOffset = -2
      }
    }

    // hide others
    // console.log('Others should be empty ', item.others)
    if (item.others.length !== 0) {
      for (let i = 0; i < item.others.length; i++) {
        item.others[i].isVisible = false
      }
    }

    // make pins clickable
    if (item.pins.length !== 0) {
      for (let i = 0; i < item.pins.length; i++) {
        // this.setPins(item.pins[i]) -- uncoment for interaction
      }
    }

    // if display === 2 (is cover) - hide from electronic
    if (item.engineData.transform['display'] === 2) {
      if (item.layer21) {
        item.layer21.isVisible = true
      }
      for (let j = 0; j < item.layer1.length; j++) {
        item.layer1[j].isVisible = true
      }
      if (item.decal) {
        item.decal.isVisible = false
      }
      if (item.body) {
        item.body.isVisible = false
      }
      for (let j = 0; j < item.pins.length; j++) {
        item.pins[j].isVisible = false
      }
    }
    else {
      if (item.layer21) {
        item.layer21.isVisible = false
      }
      for (let j = 0; j < item.layer1.length; j++) {
        item.layer1[j].isVisible = false
      }
      if (item.decal) {
        item.decal.isVisible = true
      }
      if (item.body) {
        item.body.isVisible = true
      }
      for (let j = 0; j < item.pins.length; j++) {
        item.pins[j].isVisible = true
      }
    }
    
    this.getData()
  },

  // make holes on board for TH parts
  updateTHholesOnBoard () {
    this.board.THholes = []

    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].engineData['transform']['thole'] && (this.items[i].engineData['transform']['thole'] !== null) && (this.items[i].engineData['transform']['thole'] !== 0)) {
        // console.log(this.items[i].layer1.length)
        for (let j = 0; j < this.items[i].layer1.length; j+=2) {
          
          const pos = this.items[i].layer1[j].getAbsolutePosition()
          //console.log(j, pos)
          this.board.THholes.push([0, this.items[i].engineData['transform']['thole'], pos.x, pos.z])
        }
      }
    }

    if (this.board.THholes.length !== 0) {
      this.board.recreateBoard()
    }
  },
 
  // remove a part
  // onlyReplace - false by default, true if you want to replace the part
  removePart (onlyReplace = false) {
    if (this.selected) {
      const keys = this.selected.metadata
      const item = this.selected.item
      item.dispose()

      if (onlyReplace) {
        this.data.need_replace = {
          id: keys.id,
          transform: this.objects[keys.id1][keys.id].transform
        }
      }
      else {
        delete this.objects[keys.id2][keys.id1][keys.id]
        if (Object.keys(this.objects[keys.id2][keys.id1]).length === 0) {
          delete this.objects[keys.id2][keys.id1]
        }
      }
      
      if (this.tooltip) {
        this.tooltip.isVisible = false
      }
      
      this.selected = null
    }
  },

  // rotate Y selected part
  rotatePart () {
    if (this.selected) {
      const item = this.selected.item
      item.engineData.transform['rotation'][1] -= 90
      if (item.engineData.transform['rotation'][1] === -360) {
        item.engineData.transform['rotation'][1] = 0
      }
      item.updateTransform()

      // this.updateKeyElectronics()
    }
  },

  // rotate Z selected part
  mirrorPart () {
    if (this.selected) {
      const item = this.selected.item
      item.engineData.transform['mirror'] = !item.engineData.transform['mirror']
      item.updateTransform()

      // this.updateKeyElectronics()
    }
  },

  // setting pins, clickable, tooltip
  setPins (pin) {
    const item = pin.parent.item
    const main = item.main

    const indexOfPart = this.getIndexOfPorp(this.objects[main.metadata.id1], main.metadata.id)
    pin.metadata = { 
      indexPin: pin.name.split('_')[1],
      indexPart: indexOfPart
    }   

    const _this = this
    pin.actionManager = new BABYLON.ActionManager(this.scene)
    pin.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
        if (_this.scene.meshSelected === MESHTYPE.BOARD) {
          _this.scene.selected = main.parent
          _this.scene.marker.gizmos.attachToMesh(main.parent)
          _this.scene.marker.activeMod(0)
        }
        else {
          if (_this.scene.meshSelected === MESHTYPE.ELECPART) {
            _this.scene.selected = main
            _this.scene.marker.gizmos.attachToMesh(main)
            _this.scene.marker.activeMod(0)
          }
        }
    }))
  },

  // setting body, clickable, tooltip
  setBody(item) {
    const main = item.main
    const collider = item.body

    const _this = this
    collider.actionManager = new BABYLON.ActionManager(this.scene)

    // left click on body for tooltip
    collider.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
        if (_this.scene.meshSelected === MESHTYPE.BOARD) {
          _this.scene.selected = main.parent
          _this.scene.marker.gizmos.attachToMesh(main.parent)
          _this.scene.marker.activeMod(0)
        }
        else {
          if (_this.scene.meshSelected === MESHTYPE.ELECPART) {
            _this.scene.selected = main
            _this.scene.marker.gizmos.attachToMesh(main)
            _this.scene.marker.activeMod(0)
          }
        }
    }))
  },

  ///////////////////// end part functions /////////////////////

  // add tooltip
  addTooltip () {
    let _this = this
    let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')

    let tooltip = new GUI.Rectangle('tooltip')
    tooltip.width = '60px'
    tooltip.height = '80px'
    tooltip.color = 'white'
    tooltip.thickness = 1
    tooltip.horizontalAlignment = 0
    tooltip.verticalAlignment = 0
    tooltip.background = '#adadad'
    tooltip.isVisible = false

    let button1 = GUI.Button.CreateSimpleButton('but', 'Rotate')
    this._customTooltip(button1)
    tooltip.addControl(button1)
    button1.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.rotatePart()
      }
      // _this.tooltip.isVisible = false
    })

    var button3 = GUI.Button.CreateSimpleButton('but', 'Remove')
    this._customTooltip(button3)
    button3.top = '40px'
    tooltip.addControl(button3)
    button3.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.removePart()
      }
      _this.tooltip.isVisible = false
    })

    var button5 = GUI.Button.CreateSimpleButton('but', 'Mirror')
    this._customTooltip(button5)
    button5.top = '60px'
    tooltip.addControl(button5)
    button5.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.mirrorPart()
      }
      _this.tooltip.isVisible = false
    })

    var button4 = GUI.Button.CreateSimpleButton('but', 'Replace')
    this._customTooltip(button4)
    button4.top = '20px'
    tooltip.addControl(button4)
    button4.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.removePart(true)
      }
      _this.tooltip.isVisible = false
    })

    var text =  new GUI.TextBlock()
    text.text = "Selected:"
    text.color = "white"
    text.fontSize = 12
    
    advancedTexture.addControl(this.console)
    
    advancedTexture.addControl(tooltip)
    return tooltip
  },

  // style the right-click menu
  _customTooltip (button) {
    button.height = '20px'
    button.fontSize = 14
    button.cornerRadius = 5
    button.color = 'white'
    button.verticalAlignment = 0
    button.background = 'black'
  },

  // get clicked point based on evt and previous point
  getCloserPoint (evt) {
    const current = this.getGroundPosition(evt)
    const previous = this.lastPosition

    let xDim = (current.x - previous.x) / 2
    let zDim = (current.z - previous.z) / 2
    
    if (Math.abs(xDim) > Math.abs(zDim)) {
      return new BABYLON.Vector3(current.x, 0, previous.z)
    }
    else {
      return new BABYLON.Vector3(previous.x, 0, current.z)
    }
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

  // send data to be saved to indexDB
  getData () {
    let data = []
    this.items = []
    // console.log(this.objects)
    for (let key in this.objects) {
      if (key === 'indexDBId') continue
      data.push([])
      for(let key2 in this.objects[key]) {
        if (key2 === 'indexDBId') continue
        data[0].push([])
        for(let key3 in this.objects[key][key2]) {
          if (key3 === 'indexDBId') continue
          data[0][data[0].length - 1].push(this.objects[key][key2][key3].engineData)
          this.items.push(this.objects[key][key2][key3])
        } 
      }       
    }

    // let routes = []

    // console.log(routes, this.completlyLoaded, data)

    // if (this.completlyLoaded) {
      // this.data.routing_data = routes
      this.data.engine = data
    // }

    // console.log(JSON.stringify(data))
    return [this.indexOfPCB, {
      engine: this.data.engine,
      data: this.data.algo,
      board: this.data.board,
      placement: this.data.placement,
      routing: this.data.routing,
      vias: this.data.vias
    }]
  },

  // reset data from indexDB
  resetSavedData () {
    this.objects = {}

    this.data.board = {
      'pcb_size': [50, 50],
      'pcb_layers': 1,
      'isCircle': false,
      'color': '#0a7900',
      'layerThickness': 0.16,
      'visibility': [],
      'routing_layers': 2,
      'gridResolution': 0,
      'enableGrid': true
    }
    this.data.engine = [[]]
    this.data.placement = []
    this.data.routing = []
  },

  // used on dragging
  getGroundPosition () {
    var _that = this
    var pickinfo = _that.scene.pick(_that.scene.pointerX, _that.scene.pointerY, function (mesh) { return mesh === _that.board.layers[0] })

    if (pickinfo.hit) {
      return new BABYLON.Vector3(pickinfo.pickedPoint.x, 0, pickinfo.pickedPoint.z)
    }
      return null
  },

  // return position of pin with index
  getPointFromPin (arrayData) {
    const indexOfPart = arrayData[0]
    const indexOfPin = arrayData[1]
    console.log(indexOfPart, indexOfPin)
    let pin
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata) {
        if (parseInt(this.scene.meshes[i].metadata.indexPin) === indexOfPin && parseInt(this.scene.meshes[i].metadata.indexPart) === indexOfPart) {
          pin = this.scene.meshes[i]
          break
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

  // update key cover
  async updateKeyElectronics () {
    /*this.updateTHholesOnBoard()

    const getData = this.getData()

    const url_data = dbHelper.getKeyForCurrentRoute()
    const key_electronics = `${url_data.project_id}-${url_data.product_id}-electronics`
    let ele_engine_data = await dbHelper.get_data_indexed_db(key_electronics)
    if (!isArray(ele_engine_data)) {
      ele_engine_data = [ele_engine_data]
    }
    ele_engine_data[getData[0]] = getData[1]

    await dbHelper.save_data_indexed_db(key_electronics, ele_engine_data)*/
  },
 
  // empty scene
  clearScene () {
    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 0; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
        this.scene.meshes.slice(i, 1)
      }
    }

    console.log('clear scene, empty indexDB')
    this.resetSavedData()
  },

  gizmoCallbacks () {
    this.selected = this.scene.selected
    if (!this.selected || !this.selected.main) {
      return
    }

    let rotation = this.selected.main.rotation
    if (this.selected.main.rotationQuaternion) {
      rotation = this.selected.main.rotationQuaternion.toEulerAngles()
    }

    console.log(this.tobeSaveInGeneral, this.selected.main, this.indexOfPCB)
    this.tobeSaveInGeneral.position[this.indexOfPCB] = [this.selected.main.position.x, this.selected.main.position.y, this.selected.main.position.z]
    this.tobeSaveInGeneral.rotation[this.indexOfPCB] = [rotation.x, rotation.y, rotation.z]
    this.tobeSaveInGeneral.scaling[this.indexOfPCB] = [this.selected.main.scaling.x, this.selected.main.scaling.y, this.selected.main.scaling.z]
  },

  updatePlacememnt (data = null) {
    if ( data !== null) {
      // add pcb hole static
      if (data['holes']) {
        this.data.board['fixingHoles'] = data['holes']
      }

      this.changeSize (data['grid_x'], data['grid_y'])
      this.data.placement = data['best_placement']

      this.updatePlacememnt()
    }
    else {
      // if items are not ready for placement try again in few seconds
      if (this.items.length === 0 && this.data.engine[0].length !== 0) {
        const _this = this
        const intvl = setInterval(function () {
          if (_this.items.length !== 0) {
            _this.updatePlacememnt()
            clearInterval(intvl)
          }
        }, 1000)  
      }
      else {
        if (this.data.placement) {
          let k = 0
          for (let i = 0; i < this.data.placement.length; i++) {
            for (let j = 0; j < this.data.placement[i].length; j++) {
              this.items[k].updateValues(this.data.placement[i][j], this.data.board['pcb_size'])
              k++
            }
          }
        }
      }
    }
  },

  updateRouting (data = null) {
    if ( data !== null) {
      this.data.routing = data['path']
      this.data.vias = data['vias']

      this.updateRouting()
    }
    else {
      if (this.data.routing) {
        this.createRoutes(this.data.routing)
      }

      if (this.data.vias) {
        this.createHoles(this.data.vias)
      }
    }
  },

  createRoutes (nets) {
    for (let i = 0; i < this.wires.length; i++) {
      this.wires[i].dispose()
    }

    this.wires = []
    for (let i = 0; i < nets.length; i++) {
      var paths = nets[i]
      for (let j = 0; j < paths.length; j++) {
        if (paths[j].length === 0) continue
        // array: [x,y, layerNr]
        const wire = new Wire(paths[j], this.board, this.scene)
        this.wires.push(wire)
      }
    }

    const _parent = new BABYLON.AbstractMesh('wiresParent', this.scene)
    _parent.animu = true // for general animation
    
    for (let i = 0; i < this.wires.length; i++) {
      for (let j = 0; j < this.wires[i]._meshes.length; j++) {
        this.wires[i]._meshes[j].parent = _parent
      }
    }

    _parent.parent = this.main
  },

  coordsTo3D (coords) {
    let diff = [this.board._args.pcb_size[0] / 2, this.board._args.pcb_size[1] / 2]
    return [coords[0] - diff[0], coords[1] - diff[1]]
  },

  createHoles (holesArray) {
    for (let i = 0; i < this.holes.length; i++) {
      this.holes[i].dispose(false, true)
    }
    this.holes = []

    for (let i = 0; i < holesArray.length; i++) {
      // holesArray[i][2], holesArray[i][3] - start layer / end layer
      // holesArray[i][2] - radius of pad around hole
      const hole = BABYLON.Mesh.CreateCylinder('pilon' + i, (this.board.height + 0.01), holesArray[i][4] / 10, holesArray[i][4] / 10, 32, this.scene)
      const posArray = this.coordsTo3D([holesArray[i][0], holesArray[i][1]])
      hole.position.x = posArray[0]
      hole.position.z = posArray[1]
      hole.rotation.y = Math.PI / 4

      hole.position.y = this.board.height / 2

      hole.material = new BABYLON.PBRMaterial('mat', this.scene)
      hole.material.albedoColor = BABYLON.Color3.FromHexString('#f5f5f5').toLinearSpace()   
      hole.material.metallic = 1
      hole.material.roughness = 0.2
      hole.material.zOffset = -2
      hole.parent = this.main

      this.holes.push(hole)
    }
  },

  disposeEngine () {
    this.clearScene()

    this.canvas = null
    this.calbacks = {
      select: null // calback when click on component, part, wire
    }
    if (this.board) {
      this.board.dispose()
    }
    this.board = null

    if (this.tooltip) {
      this.tooltip.dispose()
    }
    this.tooltip = null

    this.selected = null
    this.startingPoint = null
    this.lastPosition = null
    this.completlyLoaded = false
  
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].dispose()
    }
    this.items = []
    this.wires = []
    this.holes = []

    this.objects = {}
    this.data = {}
    this.indexOfPCB = 0

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

  addExtraObject () {
    console.log('TODO: to add')
  },

  togglePrintedLayer (name, visibility) {
    console.log(name, visibility)
    switch (name) {
      case 'Show_2d':
        this.toggle2d(visibility)
        break
      case 'Show_3d':
        this.toggle3d(visibility)
        break
    }
  },

  toggle2d (visibility) {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].layer21) {
        this.items[i].layer21.isVisible = visibility
      }
      for (let j = 0; j < this.items[i].layer1.length; j++) {
        this.items[i].layer1[j].isVisible = visibility
      }
    }
  },

  toggle3d (visibility) {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].decal) {
        this.items[i].decal.isVisible = visibility
      }
      this.items[i].body.isVisible = visibility
      for (let j = 0; j < this.items[i].pins.length; j++) {
        this.items[i].pins[j].isVisible = visibility
      }
    }
  }
}