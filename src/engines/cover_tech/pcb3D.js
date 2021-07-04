/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import * as Exporter from 'babylonjs-serializers'
import { attachImgToId } from '../../helpers/getImg'
import b64toBlob from 'b64-to-blob'
import Gizmo from '../../helpers/gizmos'

import upload3d from '../../helpers/upload3d'
import getLinkFromUploadData from '../../helpers/getLinkFromUploadData'

import { isArray } from 'util';
import { GridMaterial } from 'babylonjs-materials'
import 'babylonjs-loaders'

export default {
  scene: null,
  objects: {},
  _engine: null,
  calbacks: {
    select: null, // calback when click on component, part, cover
    update: null
  },
  pickLevel: 0,
  selected: null,
  mod: {
    TRANSLATE: 0,
    ROTATE: 1,
    SCALE: 2
  },
  sceneLevel: 0,
  editHistory: [],
  actualEditStep: 0,
  editStep: 0,
  actualMod: null,
  imgBlob: null,
  cameraSetting: {
    'alpha': Math.PI / 2,
    'beta': 1.1,
    'radius': 10
  },
  marker: null,
  tooltip: null,
  data: [],
  type: {
    0: 'part',
    1: 'comp',
    2: 'cover'
  },
  apiPlatform: 'polygoogle',
  searchFor: '',
  init (scene, data, router) {
    this.scene = scene
    this._engine = scene.getEngine()
    this.actualMod = this.mod.TRANSLATE
    this.objects = {}

    if (router === 1) {
      this.sceneLevel = 1
      const uniqueId = BABYLON.Tools.RandomId()
      this.objects[uniqueId] = {}
    }
    else {
      if (router === 2) {
        this.sceneLevel = 2
        const uniqueId = BABYLON.Tools.RandomId()
        this.objects[uniqueId] = {}
      }
      else {
        this.sceneLevel = 0
      }
    }

    let groundMaterial = new GridMaterial('groundMaterial', scene)
    groundMaterial.majorUnitFrequency = 5
    groundMaterial.minorUnitVisibility = 1
    groundMaterial.gridRatio = 5
    groundMaterial.opacity = 0.5
    groundMaterial.mainColor = new BABYLON.Color3(0.1, 0.1, 0.1)
    groundMaterial.lineColor = new BABYLON.Color3(0.1, 0.1, 0.1)
    groundMaterial.backFaceCulling = false

    const grid = BABYLON.Mesh.CreatePlane('plane', 100, scene)
    grid.rotation.x = Math.PI / 2
    grid.material = groundMaterial

    this.marker = new Gizmo(this)
    this.tooltip = this.addTooltip() 

    this.importAssets(data)
  },

  async getApiResult (apiPlatform, searchFor) {
    if (apiPlatform !== null) {
      this.apiPlatform = apiPlatform
    }
    if (searchFor !== null) {
      this.searchFor = searchFor
    }

    switch (this.apiPlatform) {
      case 'polygoogle':
        this.getResultsFromPolyGoogle(this.searchFor);
        break;
      case 'remix3d':
        this.getResultsFromRemix3D(this.searchFor);
        break;
      default:
        break;
    }
  },

  // return all the results (limit to 20) for this query
  async getResultsFromRemix3D (searchFor) {
    const url = "https://api.remix3d.com/v3/creations?q=" + searchFor + "&$select=id,%20name";
    let results = [];
    var request = new XMLHttpRequest();
    request.open( 'GET', url, true );
    request.addEventListener( 'load', ( event ) => {
      const response = JSON.parse(event.target.response);
      console.log(response);
      for (let i = 0; i < response.results.length; i++) {
        if (response.results[i].creation) {
          // call directly here the import for first result we get
          const assetInfo = this.getAssetInfoRemix3d(response.results[i].creation.id);
          // console.log(assetInfo)
          results.push({
            id: response.results[i].creation.id,
            name: response.results[i].creation.name,
            link: assetInfo.link,
            filename: assetInfo.filename
          })
        }
        break;
      }
    });
    request.send(null);
  },

  // return all the results (limit to 20) for this query
  getResultsFromPolyGoogle (searchFor) {
    const key = 'AIzaSyBu5r05N4bLwcpncHhDfmnfeJXJZWpUlps';
    const url = 'https://poly.googleapis.com/v1/assets/?keywords=' + searchFor + '&key=' + key + '&format=GLTF2';

    let results = [];
    var request = new XMLHttpRequest();
    request.open( 'GET', url, true );
    request.addEventListener( 'load', ( event ) => {
      const response = JSON.parse(event.target.response);
      console.log(response);
      for (let i = 0; i < response.assets.length; i++) {
        const assetInfo = this.getAssetInfoPolyGoogle(response.assets[i].formats)
        results.push({
          id: response.assets[i].name,
          name: response.assets[i].displayName,
          link: assetInfo.link,
          filename: assetInfo.filename
        })
      }
      
      const randId = parseInt(this.getRandomArbitrary(0, results.length - 1));
      
      this.add3dModelFromLink(results[randId].link, results[randId].filename)
    });
    request.send(null);
  },

  // get the well format from remix 3d result
  async getAssetInfoRemix3d (id) {
    const url = "https://api.remix3d.com/v3/creations/" + id;

    let uri;
    var request = new XMLHttpRequest();
    request.open( 'GET', url, true );
    request.addEventListener( 'load', ( event ) => {
      const response = JSON.parse(event.target.response);
      
      for (var index = 0; index < response.manifestUris.length; index++) {
        var manifestUri = response.manifestUris[index];
        if (manifestUri.usage === "View") {
          uri = manifestUri.uri;
          break;
        }
      }

      var fileIndex = uri.lastIndexOf("/");
      var link = uri.substring(0, fileIndex + 1);
      var filename = uri.substring(fileIndex + 1);
    
      // call here the import
      this.add3dModelFromLink(link, filename);
      // return {
      //   link: link,
      //   filename: filename
      // }

    });
    request.send();
  },

  // get the well format from poly google result
  getAssetInfoPolyGoogle (formats) {
    let format;
    for (let i = 0; i < formats.length; i++) {
      if (formats[i].formatType === 'GLTF2') {
        format = formats[i];
        break;
      }
    }

    var uri = format.root.url;
    var fileIndex = uri.lastIndexOf("/");
    var link = uri.substring(0, fileIndex + 1);
    var filename = uri.substring(fileIndex + 1);
    
    return {
      link: link,
      filename: filename
    }
  },

  // get an arbitrary value
  getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  },

  // add callbacks
  addCalbacks (selectComp, updateDB) {
    this.calbacks.select = selectComp
    this.calbacks.update = updateDB
  },

  // save data to indexDB based on gizmos move
  gizmoCallbacks () {
    if (this.selected) {
      let rotation = this.selected.rotation
      if (this.selected.rotationQuaternion) {
        rotation = this.selected.rotationQuaternion.toEulerAngles()
      }
      const pos = [this.selected.position.x, this.selected.position.y, this.selected.position.z]
      const rot = [rotation.x, rotation.y, rotation.z]
      const scale = [this.selected.scaling.x, this.selected.scaling.y, this.selected.scaling.z]
      this.updateDataToIndexDB(pos, rot, scale, null)
    }
  },

  // import data from indexDB, on init engine
  async importAssets (engineData) {
    if (!engineData || Object.keys(engineData).length === 0 || engineData.length === 0) {
      return
    }    
    console.log('importModel from indexDB ', engineData)
    await this.import3dModel(engineData, false)
  },

  // send data to be saved to indexDB
  getData () {
    this.data = []
    console.log(this.objects)
    for(let key in this.objects) {
      if (key === 'indexDBId') continue

      // console.log(key);
      // console.log(this.objects[key]);
      if (this.sceneLevel === 0) {
        this.data = this.objects[key]
        console.log('part', this.data)
      }
      else {
        for (let key in this.objects) {
          if (key === 'indexDBId') continue

          for(let key2 in this.objects[key]) {
            if (key2 === 'indexDBId') continue
            if (this.sceneLevel === 1) {
              this.data.push(this.objects[key][key2])
              console.log('comp', this.data)
            }
            else {
              this.data.push([])
              for(let key3 in this.objects[key][key2]) {
                if (key3 === 'indexDBId') continue

                this.data[this.data.length - 1].push(this.objects[key][key2][key3])
                console.log('cover', this.data)
              } 
            }
          }       
        }
      }
    }

    console.log(JSON.stringify(this.data))
    return this.data
  },

  // reset data from indexDB
  resetSavedData () {
    this.objects = {}

    if (this.sceneLevel === 1) {
      const uniqueId = BABYLON.Tools.RandomId()
      this.objects[uniqueId] = {}
    }
    else {
      if (this.sceneLevel === 2) {
        const uniqueId = BABYLON.Tools.RandomId()
        this.objects[uniqueId] = {}
      }
      else {
        // this.sceneLevel = 0
      }
    }
    
    this.data = []
  },

  // handle gizmo switch
  activeMod () {
    this.marker.activeMod(this.actualMod)
  },

  undoMove () {
    if (this.actualEditStep > 0) {
      this.actualEditStep--

      this.data = this.editHistory[this.actualEditStep]
      console.log(this.editHistory, this.actualEditStep)
      console.log(this.data)
      this.recreateScene(false)
    }
  },

  redoMove () {
    if (this.actualEditStep < this.editStep) {
      this.actualEditStep++

      this.data = this.editHistory[this.actualEditStep]
      console.log(this.data)
      this.recreateScene(false)
    }
  },

  updateSceneStep () {
    const copy = JSON.parse(JSON.stringify(this.data))
    // const copy = Object.assign({}, this.data)
    this.editHistory.push(copy)
    this.editStep++
    this.actualEditStep++
  },

  // add GUI to scene
  addTooltip () {
    let _this = this
    let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')

    let tooltip = new GUI.Rectangle('tooltip')
    tooltip.width = '100px'
    tooltip.height = '160px'
    tooltip.color = 'white'
    tooltip.thickness = 1
    tooltip.horizontalAlignment = 0
    tooltip.verticalAlignment = 0
    tooltip.background = '#adadad'
    tooltip.isVisible = false

    let button1 = GUI.Button.CreateSimpleButton('but', 'Translate')
    this._customTooltip(button1)
    tooltip.addControl(button1)
    button1.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.actualMod = _this.mod.TRANSLATE
        _this.activeMod()
      }
      _this.tooltip.isVisible = false
    })

    var button2 = GUI.Button.CreateSimpleButton('but', 'Rotate')
    this._customTooltip(button2)
    button2.top = '20px'
    tooltip.addControl(button2)
    button2.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.actualMod = _this.mod.ROTATE
        _this.activeMod()
      }
      _this.tooltip.isVisible = false
    })

    var button3 = GUI.Button.CreateSimpleButton('but', 'Scale')
    this._customTooltip(button3)
    button3.top = '40px'
    tooltip.addControl(button3)
    button3.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.actualMod = _this.mod.SCALE
        _this.activeMod()
      }
      _this.tooltip.isVisible = false
    })

    var input1 = new GUI.InputText()
    this._customTooltipInput(input1)
    input1.top = '60px'
    tooltip.addControl(input1)

    var button4 = GUI.Button.CreateSimpleButton('but', 'AplyX')
    this._customTooltip(button4)
    button4.top = '60px'
    button4.width = '50px'
    button4.horizontalAlignment = 1
    tooltip.addControl(button4)
    button4.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.doTransform(input1.text, 'X')
      }
      _this.tooltip.isVisible = false
    })

    var input2 = new GUI.InputText()
    this._customTooltipInput(input2)
    input2.top = '80px'
    tooltip.addControl(input2)

    var button5 = GUI.Button.CreateSimpleButton('but', 'AplyY')
    this._customTooltip(button5)
    button5.top = '80px'
    button5.width = '50px'
    button5.horizontalAlignment = 1
    tooltip.addControl(button5)
    button5.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.doTransform(input2.text, 'Y')
      }
      _this.tooltip.isVisible = false
    })

    var input3 = new GUI.InputText()
    this._customTooltipInput(input3)
    input3.top = '100px'
    tooltip.addControl(input3)

    var button6 = GUI.Button.CreateSimpleButton('but', 'AplyZ')
    this._customTooltip(button6)
    button6.top = '100px'
    button6.width = '50px'
    button6.horizontalAlignment = 1
    tooltip.addControl(button6)
    button6.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.doTransform(input3.text, 'Z')
      }
      _this.tooltip.isVisible = false
    })

    var button7 = GUI.Button.CreateSimpleButton('but', 'Remove')
    this._customTooltip(button7)
    button7.top = '120px'
    tooltip.addControl(button7)
    button7.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.remove()
      }
      _this.tooltip.isVisible = false
    })

    var button8 = GUI.Button.CreateSimpleButton('but', 'Toggle')
    this._customTooltip(button8)
    button8.top = '140px'
    tooltip.addControl(button8)
    button8.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.toggle()
      }
      _this.tooltip.isVisible = false
    })

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

  // style the right-click menu
  _customTooltipInput (input) {
    input.height = '20px'
    input.width = '50px'
    input.maxWidth = '50px'
    input.text = '0'
    input.color = 'white'
    input.horizontalAlignment = 0
    input.verticalAlignment = 0
    input.background = 'black'
  },

  // change visibility of selected obj
  toggle () {
    const kids = this.selected.getDescendants(false)
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].material) {
        if (kids[i].material.alpha === 1) {
          kids[i].material.transparencyMode = 2
          kids[i].material.alpha = 0.1
        }
        else {
          kids[i].material.transparencyMode = 0
          kids[i].material.alpha = 1
        }
      }
    }
  },

  // change color of selected obj
  // value - hexastring color
  changeColor (value) {
    const kids = this.selected.getDescendants(false)
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].material) {
        kids[i].material.albedoColor = BABYLON.Color3.FromHexString(value).toLinearSpace()
      }
    }

    this.updateDataToIndexDB(null, null, null, value)
  },

  // apply a specific transform to selected obj
  // value - float
  // axis - string X,Y,Z
  doTransform (value, axis) {
    switch (axis) {
      case 'X':
        switch (this.actualMod) {
          case this.mod.TRANSLATE:
            this.selected.position.x = parseFloat(value)
            break
          case this.mod.ROTATE:
            this.selected.rotation.x = parseFloat(value * Math.PI / 180)
            break
          case this.mod.SCALE:
            this.selected.scaling.x = parseFloat(value)
            break
        }
        break
      case 'Y':
        switch (this.actualMod) {
          case this.mod.TRANSLATE:
            this.selected.position.y = parseFloat(value)
            break
          case this.mod.ROTATE:
            this.selected.rotation.y = parseFloat(value * Math.PI / 180)
            break
          case this.mod.SCALE:
            this.selected.scaling.y = parseFloat(value)
            break
        }
        break
      case 'Z':
        switch (this.actualMod) {
          case this.mod.TRANSLATE:
            this.selected.position.z = parseFloat(value)
            break
          case this.mod.ROTATE:
            this.selected.rotation.z = parseFloat(value * Math.PI / 180)
            break
          case this.mod.SCALE:
            this.selected.scaling.z = parseFloat(value)
            break
        }
        break
    }

    this.gizmoCallbacks()
  },

  // show a specific gizmo based on param
  // param - string, type of gizmo
  transform (param) {
    switch (param) {
      case 'translate':
        this.actualMod = this.mod.TRANSLATE
        break
      case 'rotate':
        this.actualMod = this.mod.ROTATE
        break
      case 'scale':
        this.actualMod = this.mod.SCALE
        break
    }
    this.activeMod()
  },

  // remove this engine
  disposeEngine () {
    this.objects = {}
    this.calbacks = {
      select: null,
      update: null
    }
    this.selected = null
    this.editHistory = []
    this.actualEditStep = 0
    this.editStep = 0
    this.actualMod = null
    this.imgBlob = null
    
    this.data = []

    this.marker.dispose()
    this.marker = null

    this.tooltip.parent.dispose()
    this.tooltip = null

    if (this.scene) {
      this.scene.dispose()
      this.scene = null
      delete this.scene
    }
    
    if (this._engine) {
      this._engine.stopRenderLoop()
      this._engine.clear(BABYLON.Color3.White(), true, true, true)
      this._engine.dispose()
      this._engine = null
      delete this._engine
    }

    delete this
  },

  // upload 3d obj, -.obj, .stl, .glb, .gltf
  // event - upload event
  upload3dModel (event) {
    this._engine.displayLoadingUI();
    this.clearScene()
    const _this = this

    const startProcessingFiles = function() { 
      BABYLON.Tools.ClearLogCache() 
    }

    const sceneLoaded = async function (sceneFile, babylonScene) {
      _this._engine.clearInternalTexturesCache()
      
      babylonScene.clearColor = new BABYLON.Color4(0, 0, 0, 0)
      babylonScene.createDefaultCameraOrLight(true, false, false)

      const link = await _this.convertToGLBandUpload(babylonScene, true)

      babylonScene.dispose()

      _this.import3dModel({
        'url': link,
        'transform': {
          'position': [0,0,0],
          'rotation': [0,0,0],
          'scale': [1,1,1],
          'color': null
        }
      })
    }

    const sceneError = function(sceneFile, babylonScene, message) {
      console.log(message.replace("file:[object File]", "'" + sceneFile.name + "'"))
    }

    const filesInput = new BABYLON.FilesInput(this._engine, null, sceneLoaded, null, null, null, startProcessingFiles, null, sceneError)

    for (var i = 0; i < event.target.files.length; i++) {
      BABYLON.FilesInput.FilesToLoad[event.target.files[i].name] = event.target.files[i]
    }
    filesInput.loadFiles(event)
  },

  // import from link
  async add3dModelFromLink (path, filename) {
    console.log(path)
    console.log(filename)
    const meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', path, filename, this.scene)).meshes;
    const kids = meshes[0].getChildren();
    for (let i = 0; i < kids.length; i++) {
      kids[0].setParent(null);
    }
    const link = await this.convertToGLBandUpload(this.scene, false);
    
    for (let i = 0; i < kids.length; i++) {
      kids[0].setParent(meshes[0]);
    }
    meshes[0].dispose(false, true);
   
    await this.import3dModel({
      'url': link,
      'transform': {
        'position': [0,0,0],
        'rotation': [0,0,0],
        'scale': [1,1,1],
        'color': null
      }
    });
  },

  // convert uploaded objects to glb
  // scene - scene used on upload
  async convertToGLBandUpload (scene, noRestriction) {
    let options = {
      shouldExportNode: function (transformNode) {
        if (/plane/.test(transformNode.name) || /gazeTracker/.test(transformNode.name) || /__root__/.test(transformNode.name)) {
            return false;
        }
        return true;
      },
    };

    let glblob
    if (noRestriction) {
      glblob = await Exporter.GLTF2Export.GLBAsync(scene, '3dobject', {})
    }
    else {
      glblob = await Exporter.GLTF2Export.GLBAsync(scene, '3dobject', options)
    }
    
    // this.doDownload('3dobject.glb', glblob.glTFFiles['3dobject.glb'])
    let link = ''
    if (glblob) {
      const { data } = await upload3d(glblob.glTFFiles['3dobject.glb'], '3dobject.glb', true)
      link = getLinkFromUploadData(data)
    }

    return link
  },

  // import function
  // engineData from db
  async import3dModel (engineData) {
    this._engine.displayLoadingUI();

    console.log('engineData on import ', engineData)
    let pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
    let uniqueId = BABYLON.Tools.RandomId()
    let cuniqueId

    if (this.sceneLevel === 1) {
      if (engineData.length === 1) {
        // if is part, import it as object, not array
        engineData = engineData[0]
      }
    }
    if (isArray(engineData)) {
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
        else {
          if (!this.objects[pUniqueId][uniqueId]) {
            this.objects[pUniqueId][uniqueId] = {}
          }
          cuniqueId = BABYLON.Tools.RandomId()
          this.objects[pUniqueId][uniqueId][cuniqueId] = engineData[i]
          await this.handleImport(engineData[i], [cuniqueId, uniqueId, pUniqueId])
        }
      }  
    }
    else {
      if (this.sceneLevel === 1) {
        pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
        this.objects[pUniqueId][uniqueId] = engineData
        await this.handleImport(engineData, [uniqueId, pUniqueId])
      }
      else {
        this.objects[uniqueId] = engineData
        await this.handleImport(engineData, [uniqueId])
      }
    }

    this._engine.hideLoadingUI();
  },

  // import 3d object in scene
  // engineData from db
  // ids - generated ids onload used to link 3d object with engine data
  async handleImport (engineData, ids) {
    const decode = await attachImgToId(engineData.url, true)
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
        id: ids[0], 
        id1: ids[1], 
        id2: ids[2] 
      }
     
      this.actualMod = this.mod.TRANSLATE
      this.tooltip.isVisible = false
      this.resetGizmo(meshes[0])

      // update mesh transforms based on engine data
      this.updateValues(engineData.transform.position, engineData.transform.rotation, engineData.transform.scale, engineData.transform.color)

      const _this = this
      for (let i = 1; i < meshes.length; i++) {
        meshes[i].actionManager = new BABYLON.ActionManager(this.scene)
        meshes[i].actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
            if (_this.calbacks.select !== null) {
              _this.calbacks.select(_this.type[_this.sceneLevel], 'random string')
            }
            _this.tooltip.isVisible = false
            _this.resetGizmo(meshes[0])
          }))
        meshes[i].actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, () => {
            _this.tooltip.isVisible = !_this.tooltip.isVisible
            _this.resetGizmo(meshes[0])
          }))
      }      
    }
  },

  // reset gizmo on load different object or click different object
  // mesh - object loaded/clicked
  resetGizmo(mesh) {
    this.marker.gizmos.attachToMesh(mesh)
    this.selected = mesh
    this.activeMod()
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

    return data
  },

  // update infos from indexDB
  updateDataToIndexDB (pos, rot, scale, color) {
    // console.log(this.selected, this.selected.metadata, this.objects)
    const data = this.getMeshEngineData()
    // console.log(data, this.selected, this.selected.metadata, this.objects)
    if (color) {
      data.transform.color = color
    }

    if (scale) {
      data.transform.scale = scale
    }

    if (rot) {
      const updatedRot = [rot[0] * 180 / Math.PI, rot[1] * 180 / Math.PI, rot[2] * 180 / Math.PI]
      data.transform.rotation = updatedRot
    }

    if (pos) {
      data.transform.position = pos
    }
  },

  // remove selected object
  remove () {
    const keys = this.selected.metadata
    this.selected.dispose(false, true)

    if (this.objects[keys.id2]) {
      delete this.objects[keys.id2][keys.id1][keys.id]
      if (Object.keys(this.objects[keys.id2][keys.id1]).length === 0) {
        delete this.objects[keys.id2][keys.id1]

        if (Object.keys(this.objects[keys.id2]).length === 0) {
          delete this.objects[keys.id2]
        }
      }
    }
    else {
      if (this.objects[keys.id1]) {
        delete this.objects[keys.id1][keys.id]
        if (Object.keys(this.objects[keys.id1]).length === 0) {
          delete this.objects[keys.id1]
        }
      }
      else {
        delete this.objects[keys.id]
      }
    }

    if (this.tooltip) {
      this.tooltip.isVisible = false
    }
    if (this.marker) {
      this.marker.activeMod(-1)
    }

    this.selected = null
  },

  // update transforms of selected object
  updateValues (position, rotation, scale, color) {
    this.selected.position = new BABYLON.Vector3(position[0], position[1], position[2])
    this.selected.rotationQuaternion = null
    this.selected.rotation = new BABYLON.Vector3(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
    this.selected.scaling = new BABYLON.Vector3(scale[0], scale[1], scale[2])

    if (color) {
      const kids = this.selected.getDescendants(false)
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].material) {
          kids[i].material.albedoColor = BABYLON.Color3.FromHexString(color).toLinearSpace()
        }
      }
    }
    else {
      let getColor
      const kids = this.selected.getDescendants(false)
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].material) {
          getColor = kids[i].material.albedoColor.toHexString()
          break
        }
      }

      this.updateDataToIndexDB(null, null, null, getColor)
    }
  },

  // show/hide grid
  toggleGrid (param) {
    this.scene.meshes[1].isVisible = param
  },

  // empty scene
  clearScene () {
    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 2; i--) {
        if (this.scene.meshes[i]) {
          if (this.scene.meshes[i].material) {
            this.scene.meshes[i].material.dispose()
          }
          this.scene.meshes[i].dispose()
        }
      }
    }

    if (this.tooltip) {
      this.tooltip.isVisible = false
    }
    if (this.marker) {
      this.marker.activeMod(-1)
    }
    
    console.log('clear scene, empty indexDB')
    this.resetSavedData()
  },

  // save engine data and an image blob
  async save3DObject () {
    this.scene.activeCamera.alpha = this.cameraSetting.alpha
    this.scene.activeCamera.beta = this.cameraSetting.beta
    this.scene.activeCamera.radius = this.cameraSetting.radius
    this.scene.meshes[0].isVisible = false
    this.scene.meshes[1].isVisible = false
    this.scene.render()

    const _this = this
    BABYLON.Tools.CreateScreenshot(_this.scene.getEngine(), _this.scene.activeCamera, { precision: 1 }, await function (data) {
      _this.imgBlob = data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
    })

    this.scene.meshes[0].isVisible = true
    this.scene.meshes[1].isVisible = true

    const imgblob = b64toBlob(this.imgBlob, 'octet/stream')

    const names = ['preview.png']
    const blobs = [imgblob]

    return [names, blobs]
  },

  // download generated glb - testing purpose
  doDownload (filename, blob) {
    var objectUrl = (window.webkitURL || window.URL).createObjectURL(blob)

    var link = window.document.createElement('a')
    link.href = objectUrl
    link.download = filename
    var click = document.createEvent('MouseEvents')
    click.initEvent('click', true, false)
    link.dispatchEvent(click)

    window.URL.revokeObjectURL(objectUrl)
  }
}