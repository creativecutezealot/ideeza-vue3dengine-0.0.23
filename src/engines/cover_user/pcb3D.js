/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import * as Exporter from 'babylonjs-serializers'
import { attachImgToId } from '../../helpers/getImg'
import Gizmo from '../../helpers/gizmos'
import MeshScanner from '../../helpers/meshScanner'

// import * as dbHelper from '../../helpers/product-project';
import upload3d from '../../helpers/upload3d'
import getLinkFromUploadData from '../../helpers/getLinkFromUploadData'

import { isArray } from 'util'
import { GridMaterial } from 'babylonjs-materials'
import 'babylonjs-loaders'

export default {
  scene: null,
  objects: {}, // loadded objects in scene
  _engine: null,
  canvas: null,
  calbacks: {
    select: null, // calback when click on component, part, wire
    update: null
  },
  animationSpeed: 5,
  selected: null,
  data: [], // data for scene, which parts, routes
  mod: {
    TRANSLATE: 0,
    ROTATE: 1,
    SCALE: 2
  },
  editHistory: [],
  actualEditStep: 0,
  editStep: 0,
  actualMod: null,
  marker: null,
  tooltip: null,
  helperVR: null,
  items: [],
  coverHoles: [],
  completlyLoaded: false,
  positions: [new BABYLON.Vector3(-150, 0, 150), new BABYLON.Vector3(0, 150, 0), new BABYLON.Vector3(-150, 0, -150), new BABYLON.Vector3(150, 0, 150), new BABYLON.Vector3(150, 0, -150)],
  scannRes: 1,
  scannView: 0,
  holder: null,
  boxCover: null,
  elecShowOnly: [],
  apiPlatform: 'polygoogle',
  searchFor: '',
  // init the entire scene
  async init (scene, data) {
    this.scene = scene
    this._engine = scene.getEngine()
    this.canvas = this._engine.getRenderingCanvas()
    this.actualMod = this.mod.TRANSLATE
    this.objects = {}

    const uniqueId = BABYLON.Tools.RandomId()
    this.objects[uniqueId] = {}

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
    
    this.data.engine = data.engine || [[]]
    this.data.transform = data.transform || []

    this.tooltip = this.addTooltip() 

    this.helperVR = this.scene.createDefaultVRExperience({ createDeviceOrientationCamera: false, useCustomVRButton: true })

    await this.importAssets(this.data.engine[0])
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

  // save data to indexDB based on gizmos move
  async gizmoCallbacks () {
    if (this.selected) {
      // only for cover parts when is box cover in scene
      this.updateCover()

      let rotation = this.selected.rotation
      if (this.selected.rotationQuaternion) {
        rotation = this.selected.rotationQuaternion.toEulerAngles()
      }
      const pos = [this.selected.position.x, this.selected.position.y, this.selected.position.z]
      const rot = [rotation.x, rotation.y, rotation.z]
      const scale = [this.selected.scaling.x, this.selected.scaling.y, this.selected.scaling.z]
      this.updateDataToIndexDB(pos, rot, scale, null)
    }
    else {
      console.log('is different object')
      // await this.updateCoverBasedOnElect()
    }
  },

  // import data from indexDB, on init engine
  async importAssets (engineData) {
    if (engineData.length === 0) {
      this.completlyLoaded = true
      return
    }
    console.log('%c importModel from indexDB', 'background: #222; color: #bada55', engineData)
    await this.import3dModel(engineData)

    this.getData()
    this.completlyLoaded = true

    // update with new values if they exist
    this.updateTransform()

    // do animations
    const _this = this
    setTimeout(() => {
      _this.beginAnimation()
    }, 1000)
  },

  // import function
  // engineData from db
  async import3dModel (engineData) {
    this._engine.displayLoadingUI();

    console.log('engineData on import ', engineData)
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
    if (!engineData.url) {
      meshes = this.addShapeToTheBox(engineData)
      console.log(meshes)
    }
    else {
      const decode = await attachImgToId(engineData.url, true)
      if (!decode) return
      const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
      const blob = new Blob([raw_content])
      const BBJSurl = URL.createObjectURL(blob)
      if (BBJSurl) {
        BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
        console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
        meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      }
    }

    if (meshes.length === 0) {
      console.log('Error on import, empty mesh or wrong data to import')
      return
    } 

    meshes[0].metadata = { 
      id: ids[0], 
      id1: ids[1], 
      id2: ids[2] 
    }

    meshes[0].meta = engineData
    let drill = meshes.find(obj => {
      return obj.name === 'drill'
    })
    if (drill) {
      if (engineData.drillArray) {
        var parent = drill.parent
        var pos = drill.position.clone()
        drill.dispose(false, true)
      
        drill = this.createShapeFromPoints(engineData.drillArray)
        drill.position = pos
        drill.parent = parent
      }
      this.addUVS(drill)
      drill.setEnabled(false)
    }

    meshes[0].electronic = engineData.transform.electronic
    meshes[0].drill = drill

    this.actualMod = this.mod.TRANSLATE
    this.tooltip.isVisible = false
    this.resetGizmo(meshes[0])
    this.marker.activeMod(-1)

    // update mesh transforms based on engine data
    this.updateValues(engineData.transform.position, engineData.transform.rotation, engineData.transform.scale, engineData.transform.color)

    const _this = this
    for (let i = 1; i < meshes.length; i++) {
      _this.fitToView(meshes[i])

      if (meshes[i].name.toLowerCase().indexOf('layer1') !== -1 || meshes[i].name.toLowerCase().indexOf('layer21') !== -1) {
        meshes[i].isVisible = false
      }
     
      if (meshes[i].material) {
        meshes[i].material.backFaceCulling = false
      }
      this.addActionsToMesh(meshes[i], meshes[0])
    } 
    
    this.items.push(meshes[0])
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
          data[0][data[0].length - 1].push(this.objects[key][key2][key3])
          this.items.push(this.getMeshByMeta(key3,key2,key))
        } 
      }       
    }

    this.data.engine = data

    // console.log(JSON.stringify(data))
    return {
      engine: this.data.engine,
      data: this.data.algo,
      transform: this.data.transform,
    }
  },

  // get mesh with specific metadata
  getMeshByMeta (id, id1, id2) {
    let mesh
    for (let i = 1; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata) {
        if (this.scene.meshes[i].metadata['id'] === id &&
          this.scene.meshes[i].metadata['id1'] === id1 &&
          this.scene.meshes[i].metadata['id2'] === id2) {
            mesh = this.scene.meshes[i]
            break
          }
      }
    }

    return mesh
  },

  // add callbacks
  addCalbacks (selectComp, updateComp) {
    this.calbacks.select = selectComp
    this.calbacks.update = updateComp
  },

  // reset data from indexDB
  resetSavedData () {
    this.objects = {}

    const uniqueId = BABYLON.Tools.RandomId()
    this.objects[uniqueId] = {}
    
    this.data.engine = [[]]
    this.data.transform = []
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
        _this.removeItem()
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

  // update transform of objects in scene
  updateTransform (data = null) {
    if ( data !== null) {
      this.data.transform = data

      this.updateTransform()
    }
    else {
      if (this.data.transform.length === 0) {
        return
      }

      let k = 0
      for (let i = 0; i < this.scene.meshes.length; i++) {
        if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.id) {
          this.selected = this.scene.meshes[i]

          // to do: is working only for components with one part
          this.changeColor(this.data.transform[k][0].color)
          this.selected.position = new BABYLON.Vector3(this.data.transform[k][0].position[0], this.data.transform[k][0].position[1], this.data.transform[k][0].position[2])
          this.selected.rotation = new BABYLON.Vector3(this.data.transform[k][0].rotation[0], this.data.transform[k][0].rotation[1], this.data.transform[k][0].rotation[2])
          this.selected.scaling = new BABYLON.Vector3(this.data.transform[k][0].scale[0], this.data.transform[k][0].scale[1], this.data.transform[k][0].scale[2])
          this.gizmoCallbacks()
          k++
        }
      }
    }
  },

  // change camera radius based on mesh
  fitToView (mesh) {
    let radius = mesh.getBoundingInfo().boundingSphere.radiusWorld
    const engine = this.scene.getEngine()
    let aspectRatio = engine.getAspectRatio(this.scene.activeCamera)
    let halfMinFov = this.scene.activeCamera.fov / 2
    if (aspectRatio < 1) {
        halfMinFov = Math.atan(aspectRatio * Math.tan(this.scene.activeCamera.fov / 2))
    }

    let viewRadius = Math.abs(radius / Math.sin(halfMinFov))
    if (viewRadius > this.scene.activeCamera.radius) {
      this.scene.activeCamera.radius = viewRadius
    }
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
    this.helperVR = null
    this.completlyLoaded = false
    this.actualMod = null
    this.animationSpeed = 5
    
    this.data = []
    this.items = []
    this.coverHoles = []
    this.elecShowOnly = []

    if (this.holder) {
      this.holder.dispose()
      this.holder = null
    }
    if (this.marker) {
      this.marker.dispose()
      this.marker = null
    }

    if (this.tooltip) {
      this.tooltip.parent.dispose()
      this.tooltip = null
    }

    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 0; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
      }
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

  // clone selected obkect
  cloneObject () {
    console.log('TODO: add')
  },

  // remove selected object
  removeItem () {
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
    this.getData()
  },

  // change back to electronic
  async elecProperty () {
    if (this.selected) {
      const data = this.getMeshEngineData()
      if (!data.transform.elecPos) {
        alert('You can make electronic only electronic parts')
        return
      }

      this.removeItem()
      // console.log(data)
      /*
      const url_data = dbHelper.getKeyForCurrentRoute()
      const key_electronics = `${url_data.project_id}-${url_data.product_id}-electronics`
      let ele_engine_data = await dbHelper.get_data_indexed_db(key_electronics)
      // console.log(ele_engine_data)
      
      let electronicPart
      for (let i = 0; i < ele_engine_data.length; i++) {
        const pcb = ele_engine_data[i]
        for (let j = 0; j < pcb.engine.length; j++) {
          for (let k = 0; k < pcb.engine[j].length; k++) {
            for (let l = 0; l < pcb.engine[j][k].length; l++) {
              const part = pcb.engine[j][k][l]
              if (part.transform.serial === data.transform.serial) {
                  electronicPart = part
                  break
              }
            }

            if (electronicPart) {
              break
            }
          }

          if (electronicPart) {
            break
          }
        }

        if (electronicPart) {
          break
        }
      }

      if (electronicPart) {
        // console.log('found it')
        electronicPart.transform.display = 0
        await dbHelper.save_data_indexed_db(key_electronics, ele_engine_data)
      }
      */
    }
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
    // is not working good for parts with multiple materials, as example elec parts which have body, pins, name, layer1, layer21
    /*else {
      let getColor
      const kids = this.selected.getDescendants(false)
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].material) {
          getColor = kids[i].material.albedoColor.toHexString()
          break
        }
      }

      this.updateDataToIndexDB(null, null, null, getColor)
    }*/
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
          this.scene.meshes[i].dispose(false, true)
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

  recordScene (param) {
    console.log(param)
  },

  // begin build animation in scene
  beginAnimation () {
    this.scene.stopAllAnimations()

    let animatable = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.id) {
        animatable.push(this.scene.meshes[i])
      }
    }

    this.setAnimOnAnimatable(animatable)
  },

  // do settings to be able to run animations
  setAnimOnAnimatable (animatable) {
    for (let i = 0; i < animatable.length; i++) {
      animatable[i].setEnabled(false)
      this.setAnimKeys(animatable[i], i, animatable)
    }

    this.scene.beginAnimation(animatable[0], 0, 60, false, this.animationSpeed)
  },

  // add animations key to objects
  setAnimKeys (object, index, animatable) {
    index++
    object.animations = []
    const prevPos = object.position.clone()
    const nextPos = this.positions[(index % 5)]
    var animationCam = new BABYLON.Animation('Animation', 'position', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
    var a = []
    a.push({
      frame: 0,
      value: nextPos
    })
    a.push({
      frame: 60,
      value: prevPos
    })
    animationCam.setKeys(a)

    var qe = new BABYLON.QuadraticEase()
    qe.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT)
    animationCam.setEasingFunction(qe)

    let that = this
    var anim2 = new BABYLON.AnimationEvent(0, function () {
      object.setEnabled(true)
    }, false)
    animationCam.addEvent(anim2)

    var anim1 = new BABYLON.AnimationEvent(60, function () {
      if (index !== animatable.length) {
        that.scene.beginAnimation(animatable[index], 0, 60, false, that.animationSpeed)
      }
      else {
        console.log('Animation finish')
      }
    }, false)
    animationCam.addEvent(anim1)

    object.animations.push(animationCam)
  },

  // set speed of animation
  setAnimationSpeed (param) {
    this.animationSpeed = param
  },

  // enter VR mode
  enterVR () {
    if (this.helperVR) {
      this.helperVR.enterVR()
    }
  },

  changeScanRes (param) {
    this.scannRes = param
  },

  changeScanView (param) {
    this.scannView = param
  },

  /*Obsolete, used in general instead */
  scan () {
    // this.items = []
    // const box = new BABYLON.Mesh.CreateBox('box', 3, this.scene)
    // this.items.push(box)
    const scan = new MeshScanner(this.items, {
      gridRes: this.scannRes,
      view: this.scannView,
    }, this.scene)

    console.log(scan)
    console.log(this.items)
  },

  async addScrewCovers (electronic) {
    let objects = []
    if (electronic.board) {
      for (let i = 0; i < electronic.board.fixingHoles.length; i++) {
        // const pos = electronic.board.fixingHoles[i]
        // const scalePosX = pos[0] - electronic.board.pcb_size[0] / 2
        // const scalePosY = pos[1] - electronic.board.pcb_size[1] / 2
        
        // 'user-b9c0a6453b72452abec654d8f985a42f.glb'
      }
    }

    return objects
  },

  mergeScrewCovers (cover, screwCovers) {
    console.log(screwCovers)
    return cover
  },

  // update holes on cover from cover parts
  updateCover () {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].electronic && this.items[i].meta) {
        if (this.items[i].meta.infl !== -1 && this.items[i].meta.sync === true) {
          const side = this.items[i].meta.infl
          if (!this.items[side].orig) {
            const meshes = this.items[side].getDescendants()
            const kid = this.returnValidKid(meshes)
            this.addUVS(kid)
            const orig = kid.clone('orig')
            orig.parent = null
            orig.material = kid.material.clone('mat')
            orig.isVisible = false
            this.items[side].orig = orig
          }

          const kids = this.items[side].getDescendants()
          const kid = this.returnValidKid(kids)
          const parent = kid.parent
          kid.setParent(null)
          kid.dispose(false, true)
        
          const clona = this.items[side].orig.clone('orig')
          // console.log(clona)
          clona.material = this.items[side].orig.material.clone('mat')
          clona.isVisible = true
          clona.parent = parent
            
          this.addActionsToMesh(clona, this.items[side])

          const part = this.items[i]
          if (!part.drill) {
            return
          }
          const cover = this.items[side]

          const box = part.drill.clone('clone')
          box.setEnabled(true)
          box.setParent(null)

          if (part.meta.infl === 4 || part.meta.infl === 5) {
            box.position.y = cover.position.y
            if (part.meta.infl === 5) {
              box.position.y -= 0.25
            }
            else {
              box.position.y += 0.25
            }
          }
          else {
            if (part.meta.infl === 2 || part.meta.infl === 3) {
              box.position.x = cover.position.x
              if (part.meta.infl === 3) {
                box.position.x -= 0.25
              }
              else {
                box.position.x += 0.25
              }
            }
            else {
              box.position.z = cover.position.z
              if (part.meta.infl === 1) {
                box.position.z -= 0.25
              }
              else {
                box.position.z += 0.25
              }
            }
          }
          
          this.cropCover(cover, box)
        }
      }
    }
  },

  cropCover (cover, box) {
    const kids = cover.getDescendants()
    const kid = this.returnValidKid(kids)
    const parent = kid.parent
    const newKid = this.createHoles(kid, box)
    newKid.parent = parent
    
    this.addActionsToMesh(newKid, cover)
  },

  // import electronic part, general, create box for board
  async addElectronicParts (electronic, general) {
    let board // parent of all electronics which are covers
    if (Object.keys(electronic).length !== 0) {
      board = new BABYLON.AbstractMesh('parent', this.scene)

      for (let i = 0; i < electronic.length; i++) {
        const engineData = electronic[i].engine[0]
        
        for (let j = 0; j < engineData.length; j++) {
          const comp = engineData[j]

          for (let k = 0; k < comp.length; k++) {
            const parts = comp[k]

            if (parts.transform.display === 1) {
              this.elecShowOnly.push(parts)
            }
          }
        }
      }
      
      for (let i = 0; i < this.elecShowOnly.length; i++) {
        this.elecShowOnly[i].elem = await this.importElecPart(this.elecShowOnly[i], board)
        const kids = this.elecShowOnly[i].elem.getChildren()
        const body = kids.find(obj => {
          return obj.name === 'Body'
        })
        
        const decal = body.getChildren()[0]
        decal.isPickable = false

        // const _this = this
        body.actionManager = new BABYLON.ActionManager(this.scene)
        body.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
            alert('Denied. Not interractable')
          }))
      }
    }

    if (Object.keys(general).length !== 0) {
      if (this.items.length === 0 || !this.items[0].electronic) {
        return
      }

      this.coverHoles = general.coverHoles
      this.items[0].meta = { cur: 0, opos: 1, axis: 'z' }
      this.items[1].meta = { cur: 1, opos: 0, axis: 'z' }
      this.items[2].meta = { cur: 2, opos: 3, axis: 'x' }
      this.items[3].meta = { cur: 3, opos: 2, axis: 'x' }
      this.items[4].meta = { cur: 4, opos: 5, axis: 'y' }
      this.items[5].meta = { cur: 5, opos: 4, axis: 'y' }

      for (let i = 0; i < 6; i++) {
        this.addHoleToTheBox(i)
      }

      this.updateCover()
    }
    
    console.log('Import box cover directly with dimenions from general scene')
    return
    /*
    // console.log(pos, size)
    // let elec = null
    let coverElect = []
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].electronic) {
        // elec = this.items[i]
        coverElect.push(this.items[i])
      }
    }
    console.log(coverElect)
    
    if (coverElect.length !== 0) {
      coverElect[0].scaling = new BABYLON.Vector3(size.x, size.y, 0.1)
      coverElect[0].meta = { cur: 0, opos: 1, axis: 'z' }
      coverElect[1].scaling = new BABYLON.Vector3(size.x, size.y, 0.1)
      coverElect[1].meta = { cur: 1, opos: 0, axis: 'z' }
      coverElect[2].scaling = new BABYLON.Vector3(0.1, size.y, size.z)
      coverElect[2].meta = { cur: 2, opos: 3, axis: 'x' }
      coverElect[3].scaling = new BABYLON.Vector3(0.1, size.y, size.z)
      coverElect[3].meta = { cur: 3, opos: 2, axis: 'x' }
      coverElect[4].scaling = new BABYLON.Vector3(size.x, 0.1, size.z)
      coverElect[4].meta = { cur: 4, opos: 5, axis: 'y' }
      coverElect[5].scaling = new BABYLON.Vector3(size.x, 0.1, size.z)
      coverElect[5].meta = { cur: 5, opos: 4, axis: 'y' }

      coverElect[0].position = new BABYLON.Vector3(0, size.y / 2, size.z / 2 - 0.05)
      coverElect[1].position = new BABYLON.Vector3(0, size.y / 2, -size.z / 2 + 0.05)
      coverElect[2].position = new BABYLON.Vector3(size.x / 2 - 0.05, size.y / 2, 0)
      coverElect[3].position = new BABYLON.Vector3(-size.x / 2 + 0.05, size.y / 2, 0)
      coverElect[4].position = new BABYLON.Vector3(0,  0.05, 0)
      coverElect[5].position = new BABYLON.Vector3(0, size.y - 0.05, 0)
      await this.gizmoCallbacks()
    }*/
    /*
    // if cover is not already loaded
    else {
      // add box cover based on electronic pcb
      await this.import3dModel({"url":"user-6f7326715bc046f9a6aec22563a2fe4f.glb","transform":{"position":[0, 0, 0],"rotation":[0,0,0],"scale":[1, 1, 1],"color":"#6d0253", "electronic":true}})
 
      this.getData()
      
      // get cover again
      for (let i = 0; i < this.items.length; i++) {
        // console.log(i, this.items[i])
        if (this.items[i].electronic) {
          // box = this.items[i]
          coverElect.push(this.items[i])
        }
      }

      // this.selected = box
      // this.selected.position = new BABYLON.Vector3(pos.x, pos.y, pos.z)
      // this.selected.scaling = new BABYLON.Vector3(size.x, size.y, size.z)
     
      coverElect[0].scaling = new BABYLON.Vector3(size.x, size.y, 0.1)
      coverElect[0].meta = { cur: 0, opos: 1, axis: 'z' }
      coverElect[1].scaling = new BABYLON.Vector3(size.x, size.y, 0.1)
      coverElect[1].meta = { cur: 1, opos: 0, axis: 'z' }
      coverElect[2].scaling = new BABYLON.Vector3(0.1, size.y, size.z)
      coverElect[2].meta = { cur: 2, opos: 3, axis: 'x' }
      coverElect[3].scaling = new BABYLON.Vector3(0.1, size.y, size.z)
      coverElect[3].meta = { cur: 3, opos: 2, axis: 'x' }
      coverElect[4].scaling = new BABYLON.Vector3(size.x, 0.1, size.z)
      coverElect[4].meta = { cur: 4, opos: 5, axis: 'y' }
      coverElect[5].scaling = new BABYLON.Vector3(size.x, 0.1, size.z)
      coverElect[5].meta = { cur: 5, opos: 4, axis: 'y' }

      coverElect[0].position = new BABYLON.Vector3(0, size.y / 2, size.z / 2 - 0.05)
      coverElect[1].position = new BABYLON.Vector3(0, size.y / 2, -size.z / 2 + 0.05)
      coverElect[2].position = new BABYLON.Vector3(size.x / 2 - 0.05, size.y / 2, 0)
      coverElect[3].position = new BABYLON.Vector3(-size.x / 2 + 0.05, size.y / 2, 0)
      coverElect[4].position = new BABYLON.Vector3(0,  0.05, 0)
      coverElect[5].position = new BABYLON.Vector3(0, size.y - 0.05, 0)
      await this.gizmoCallbacks()
    }*/
    /*
    // for csg - bellow
    const _this = this
    setTimeout (async () => {
 
      const kids = _this.selected.getDescendants(false)
      let boxCover = kids[kids.length - 1]
      const screwCovers = _this.addScrewCovers(electronic[0])
      boxCover = _this.mergeScrewCovers(boxCover, screwCovers)

      boxCover.setVerticesData(BABYLON.VertexBuffer.UVKind, [])
      console.log(boxCover)
      let meshes = []
    
      for (let i = 0; i < _this.scene.meshes.length; i++) {
        // this.scene.meshes[i].showBoundingBox = true
        if (_this.scene.meshes[i].name === 'Body') { // check intersection only with body of electronics
          if (boxCover.intersectsMesh(_this.scene.meshes[i], true)) {
            // console.log(i, this.scene.meshes[i].name, this.scene.meshes[i])

            // HERE CREATE ONLY THE BOXES FOR INTERSECTIONS // TODO: IF THERE ARE CYLINDERS
            const bbinfo = _this.scene.meshes[i].getBoundingInfo().boundingBox
            const box = new BABYLON.Mesh.CreateBox('box', 1, _this.scene)
            box.position = bbinfo.centerWorld
            box.scaling = bbinfo.extendSizeWorld.scale(2.03)
            // console.log(box)
            meshes.push(box)
          }
        }
      }

      for (let i = meshes.length - 1; i >= 0; i--) {
        boxCover = await _this.subtractElectronics(meshes[i], boxCover)
        
        // reparent boxCover to glb parent
        boxCover.setParent(_this.selected.getChildren()[0])
        boxCover.position = BABYLON.Vector3.Zero()
        boxCover.scaling = new BABYLON.Vector3(1, -1, -1)
      }

      this.addActionsToMesh(boxCover, this.selected)
      console.log('box cover ', boxCover)
    }, 100)
    */
  },

  addHoleToTheBox (side) {
    // console.log('side ', side)
    const meta = this.items[side].meta
    for (let i = 0; i < this.coverHoles[side].length; i++) {
      
      // console.log('holenr ', i)
      // console.log('meta ', meta)
      // console.log('hole ', this.coverHoles[side][i])

      var mesh = this.createShapeFromPoints(this.coverHoles[side][i][2])
      mesh.position = this.items[side].getAbsolutePosition().clone()
      if (meta.axis === 'x') {
        mesh.rotation.z = Math.PI / 2
        mesh.position.y = this.coverHoles[side][i][0]
        mesh.position.z = this.coverHoles[side][i][1]
        mesh.position.x -= 0.25
      }
      else {
        if (meta.axis === 'y') {
          mesh.position.x = this.coverHoles[side][i][0]
          mesh.position.z = this.coverHoles[side][i][1]
          mesh.position.y += 0.25
        }
        else {
          mesh.rotation.x = Math.PI / 2
          mesh.position.x = this.coverHoles[side][i][0]
          mesh.position.y = this.coverHoles[side][i][1]
          mesh.position.z += 0.25
        }
      }

      const kids = this.items[side].getDescendants()
      const kid = this.returnValidKid(kids)
      this.addUVS(kid)

      const newKid = this.createHoles(kid, mesh)
      newKid.parent = this.items[side].getChildren()[0]
      
      this.addActionsToMesh(newKid, this.items[side])
    }
  },

  // add click actions - left for select, right for tooltip
  addActionsToMesh (mesh, markerHolder) {
    const _this = this
    mesh.actionManager = new BABYLON.ActionManager(this.scene)
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
        if (_this.calbacks.select !== null) {
          _this.calbacks.select('part', 'random string')
        }
        _this.tooltip.isVisible = false
        _this.resetGizmo(markerHolder)
      }))
      mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, () => {
        _this.tooltip.isVisible = !_this.tooltip.isVisible
        _this.resetGizmo(markerHolder)

        if (!_this.tooltip.isVisible) {
          _this.marker.activeMod(-1)
        }
      }))
  },

  // add uvs to mesh to be able to cut
  addUVS (mesh) {
    let uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)
    if (!uvs) {
      const indices = mesh.getIndices()
      uvs = []

      var maxIndice = 0
      for (let i = 0; i < indices.length; i++) {
        maxIndice = Math.max(maxIndice, indices[i])
      }
      for (let i = 0; i <= maxIndice; i++) {
        uvs.push(0,0)
      }
      mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs)
      mesh.setIndices(indices, null)
    }
  },

  // create a shape from points
  createShapeFromPoints (points, height = 0.5) {
    var shape = []
    for (let i = 0; i < points.length; i+=2) {
      shape.push(new BABYLON.Vector2(points[i], points[i + 1]))
    }

    return new BABYLON.PolygonMeshBuilder("drill", shape, this.scene).build(false, height)
  },

  // add shape to a specific side
  addShapeToTheBox (data) {
    var parent = new BABYLON.AbstractMesh('__root__', this.scene)
    var mesh = this.createShapeFromPoints(data.transform['arrayPoints'], 1)
    mesh.name = mesh.id = 'Box2'
    mesh.material = new BABYLON.PBRMaterial('material', this.scene)
    mesh.material.albedoColor = BABYLON.Color3.FromHexString(data.transform['color']).toLinearSpace()
    mesh.material.metallic = 0.4
    mesh.material.roughness = 0.2
    mesh.setParent(parent)
    return [parent, mesh]
  },

  createHoles (mesh1, mesh2) {
    const name = mesh1.name
    const material = mesh1.material
    const innerCSG = BABYLON.CSG.FromMesh(mesh2)
    const outerCSG = BABYLON.CSG.FromMesh(mesh1)

    mesh1.dispose()
    mesh2.dispose()

    const subCSG = outerCSG.subtract(innerCSG)

    this.scene.removeMesh(innerCSG)
    this.scene.removeMesh(outerCSG)

    mesh1 = subCSG.toMesh(name, material, this.scene)
    this.scene.removeMesh(subCSG)

    return mesh1
  },

  // return the kid with geometry
  returnValidKid (kids) {
    let kid
    for (let j = 0; j < kids.length; j++) {
      if (kids[j]._geometry) {
        kid = kids[j]
        break
      }
    }

    return kid
  },

  async subtractElectronics (m1, m2) {
    var name = m2.name
    var material = m2.material

    const innerCSG = BABYLON.CSG.FromMesh(m1)
    const outerCSG = BABYLON.CSG.FromMesh(m2)

    m1.dispose()
    m2.dispose()

    const subCSG = outerCSG.subtract(innerCSG)

    this.scene.removeMesh(innerCSG)
    this.scene.removeMesh(outerCSG)

    const boxcover = subCSG.toMesh(name, material, this.scene)
    this.scene.removeMesh(subCSG)
    return boxcover
  },

  async importElecPart (engineData, board) {
    const decode = await attachImgToId(engineData.url, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    let meshes
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      const pos = engineData.transform['coverPos']
      const rot = engineData.transform['coverRot']
      meshes[0].rotationQuaternion = null

      console.log('electronic part ', meshes[0])
      // console.log(pos, rot)
      meshes[0].position = new BABYLON.Vector3(pos[0], pos[1], pos[2])
      meshes[0].rotation = new BABYLON.Vector3(rot[0], rot[1], rot[2])
      // console.log(meshes[0])
      // console.log(board)
      //console.log(engineData)

      for (let i = 1; i < meshes.length; i++) {
        if (meshes[i].name.toLowerCase().indexOf('layer1') !== -1 || meshes[i].name.toLowerCase().indexOf('layer21') !== -1) {
          meshes[i].isVisible = false
        }
      }

      meshes[0].parent = board
    }

    return meshes[0]
  },

  async importCover (data) {
    const decode = await attachImgToId(data.url, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    let meshes
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
    }
    return meshes
  },

  async upload3dModel (event) {
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

  addHole () {

  },

  addShape () {

  },

  changeShape (param) {
    console.log(param)
    return
    /*
    if (isNaN(parseInt(param))) {
      if (this.holder) {
        this.holder.dispose()
        this.holder = null
      }
      return
    }

    let arrayPoints = []
    if (parseInt(param) === 0) {
      const mesh1 = BABYLON.Mesh.CreatePlane('asd', 2, this.scene)
      const verts1 = mesh1.getVerticesData(BABYLON.VertexBuffer.PositionKind)
      mesh1.dispose(false, true)

      let j = 1
      for (let i = 0; i < verts1.length; i++) {
        if (j % 3 !== 0) {
          arrayPoints.push(verts1[i])
        }
        j++
      }
    }
    else {
      const mesh2 = BABYLON.Mesh.CreateDisc('asd', 1, 32, this.scene)
      const verts2 = mesh2.getVerticesData(BABYLON.VertexBuffer.PositionKind)
      mesh2.dispose(false, true)

      let k = 1
      for (let i = 3; i < verts2.length; i++) {
        if (k % 3 !== 0) {
          arrayPoints.push(verts2[i])
        }
        k++
      }
    }
    // https://www.babylonjs-playground.com/#25B8RK#13

    var mesh = this.createShapeFromPoints(arrayPoints)
    mesh.name = mesh.id = 'Box2'
    mesh.material = new BABYLON.PBRMaterial('material', this.scene)
    mesh.material.metallic = 0.4
    mesh.material.roughness = 0.2

    this.holder = mesh
    */
    /*const pos = this.lastClickedPoint.pickedPoint.clone()

    var axis1 = this.lastClickedPoint.getNormal();							        		
    var axis2 = BABYLON.Vector3.Up();
    var axis3 = BABYLON.Vector3.Up();
    var start = new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0);	//camera.position			

    BABYLON.Vector3.CrossToRef(start, axis1, axis2);
    BABYLON.Vector3.CrossToRef(axis2, axis1, axis3);
    var tmpVec = BABYLON.Vector3.RotationFromAxis(axis3.negate(), axis1, axis2);
    var quat = BABYLON.Quaternion.RotationYawPitchRoll(tmpVec.y, tmpVec.x, tmpVec.z);
    let rot = BABYLON.Vector3.Zero();
    if (this.lastClickedPoint.pickedMesh.rotationQuaternion) {
      rot = this.lastClickedPoint.pickedMesh.rotationQuaternion.multiply(quat).toEulerAngles();
    } 
    else {
      rot = quat.toEulerAngles();
    }

    const finalData = [[pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z], arrayPoints]*/
  }
}