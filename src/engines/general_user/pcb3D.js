/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import cover from './cover'
import elect from './elect'
import { attachImgToId } from '../../helpers/getImg'
import Gizmo from '../../helpers/gizmos_v2'
import MeshScanner from '../../helpers/meshScanner'
import 'babylonjs-loaders'
// import * as dbHelper from '../../helpers/product-project'
import OBJExport from '../general/babylonjs.serializer'

export default {
  scene: null,
  _engine: null,
  animationSpeed: 5,
  selected: null,
  data: {}, // data for scene, which parts, routes
  helperVR: null,
  elect: [],
  cover: null,
  calbacks: {
    select: null // calback when click on component, part, wire
  },
  viewAngle: 0,
  completlyLoaded: false,
  positions: [new BABYLON.Vector3(-150, 0, 150), new BABYLON.Vector3(0, 150, 0), new BABYLON.Vector3(-150, 0, -150), new BABYLON.Vector3(150, 0, 150), new BABYLON.Vector3(150, 0, -150)],
  // init the entire scene
  async init (scene, data) {
    this.scene = scene
    this.scene.selected = null
    this.scene.meshSelected = 0
    this.scene.marker = new Gizmo(this.scene)
    this.scene.setAsElectronic = async () => {
      await this.setAsElectronic(true)
    }
    this.scene.updateBoxHoles = async (param) => {
      await this.updateBoxHoles(param)
    }

    const _this = this
    this.scene.marker.gizmos.gizmos.positionGizmo.xGizmo.dragBehavior.onDragObservable.add(() => {
      _this.gizmoCallbackFunc(true)
    })
    this.scene.marker.gizmos.gizmos.positionGizmo.yGizmo.dragBehavior.onDragObservable.add(() => {
      _this.gizmoCallbackFunc(true)
    })
    this.scene.marker.gizmos.gizmos.positionGizmo.zGizmo.dragBehavior.onDragObservable.add(() => {
      _this.gizmoCallbackFunc(true)
    })
    this.scene.marker.gizmos.gizmos.positionGizmo.xGizmo.dragBehavior.onDragEndObservable.add(() => {
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.positionGizmo.yGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.positionGizmo.zGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.rotationGizmo.xGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.rotationGizmo.yGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.rotationGizmo.zGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.scaleGizmo.xGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.scaleGizmo.yGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })
    this.scene.marker.gizmos.gizmos.scaleGizmo.zGizmo.dragBehavior.onDragEndObservable.add(() => {			
      _this.gizmoCallbackFunc()
    })

    this._engine = scene.getEngine()
  
    if (!data.general || Object.keys(data.general).length === 0) {
      this.data = {
        'position': [[0,0,0]],
        'rotation': [[0,0,0]],
        'scaling': [[1,1,1]],
        'pilon': [[]],
        'wires': [],
        'coverHoles': [[],[],[],[],[],[]],
        // coverHoles [[[0, 0, 1, 2, [2,3, 2,-3, -2,-3, -2,3]], [1, 2, 4, 5, []]],[],[],[],[],[]]
        /* each array represent one side, each side can contains arrays, each array will represent one hole
          first side contain 2 holes. index 0, 1 - position, x,y or x,z or y,z
                                            2 - array with points need to create the custom hole, or empty if predefined shape on index 0 */
        'battery': [{
          'link': '',
          'position': [0,0,0],
          'rotation': [0,0,0],
          'scale': [1,1,1]
        }]
      }
    }
    else {
      this.data = data.general
    }

    if (data.cover) {
      this.cover = await cover.init(this.scene, data)
    }
    if (data.electronics) {
      this.elect.push(await elect.init(this.scene, data.electronics, 0, this.data))
    }

    await this.updateScene()
    
    // covert elect-cover to full cover for movement
    if (this.elect.length !== 0) {
      for (let i = 0; i < this.elect[0].items.length; i++) {
        const item = this.elect[0].items[i]
        if (item.engineData.transform.display === 1) {
          this.scene.selected = item.body.parent
          await this.setAsCover(true)
        }
      }
    }

    if (this.cover) {
      if (this.cover.items.length !== 0) {
        if (this.cover.items[0].metadata2 && this.cover.items[0].metadata2.transform.electronic) {
          // comment this line to let demos to work
          await this.cover.updateGeneratedCover()
        }
      }
    }
    
    setTimeout(() => {
      _this.beginAnimation()
    }, 1000)
    
    this.helperVR = this.scene.createDefaultVRExperience({ createDeviceOrientationCamera: false, useCustomVRButton: true })
    /*
    // enable click on dots scan
    var onPointerDown = function (evt) {
      var p = _this.scene.pick(_this.scene.pointerX, _this.scene.pointerY)
      // console.log(p)
      if (p.hit) {
        const resolution = 0.5
        const offsetX = 8
        const offsetY = 5
        const offsetZ = 5

        const x = parseInt(p.pickedPoint.x)
        const y = parseInt(p.pickedPoint.y)
        const z = parseInt(p.pickedPoint.z)
        // console.log(p.pickedPoint)
        console.log(x,y,z)
        const meh = JSON.stringify([(x + offsetX) / resolution, (y + offsetY) / resolution, (z + offsetZ) / resolution])
        console.log(meh)
        alert(meh)
      }
    }
    this._engine.getRenderingCanvas().addEventListener("pointerdown", onPointerDown, false)
    */
  },

  addCalbacks (selectComp) {
    this.calbacks.select = selectComp
  },

  // update/save holes on box cover
  async updateBoxHoles (arrayHoles) {
    this.data['coverHoles'] = arrayHoles
    // await this.updateKeyGeneral()
  },

  // update key general
  async updateKeyGeneral () {
    // const url_data = dbHelper.getKeyForCurrentRoute()
    // const key_general = `${url_data.project_id}-${url_data.product_id}-general`
    // await dbHelper.save_data_indexed_db(key_general, this.data)
  },

  // gizmo callback function
  gizmoCallbackFunc (param) {
    if (this.scene.meshSelected === 0) {
      if (this.cover) {
        this.cover.gizmoCallbacks(param)
      }
    } 
    else {
      if (this.scene.meshSelected === 1) {
        console.log('do not update electronic yet')
      } 
      else {
        if (this.cover) {
          this.cover.gizmoCallbacks(param)
        }
        // update board
        console.log('do not update board yet')
      }
    }
  },

  // generate ASCII STL string
  async generateSTL (mesh) {
    // based on : https://all3dp.com/what-is-stl-file-format-extension-3d-printing/
    // TODO: convert to binary stl : http://www.johann-oberdorfer.eu/blog/2018/01/12/18-01-12_stl_converter/
    var output = 'solid exportedMesh\r\n';
    var vertices = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var indices = mesh.getIndices();	
  
    for(var i = 0; i<indices.length; i+=3){
      var id = [indices[i]*3,indices[i+1]*3,indices[i+2]*3];
      var v = [
      new BABYLON.Vector3(vertices[id[0]], vertices[id[0]+1], vertices[id[0]+2]),
      new BABYLON.Vector3(vertices[id[1]], vertices[id[1]+1], vertices[id[1]+2]),
      new BABYLON.Vector3(vertices[id[2]], vertices[id[2]+1], vertices[id[2]+2])
          ];
      var p1p2 = v[0].subtract(v[1]); 		
      var p3p2 = v[2].subtract(v[1]); 
      var n = (BABYLON.Vector3.Cross(p1p2, p3p2)).normalize();
      
      output+='facet normal '+n.x+' '+n.y+' '+n.z+'\r\n';
      output+='\touter loop\r\n';
      output+='\t\tvertex '+v[0].x+' '+v[0].y+' '+v[0].z+'\r\n';
      output+='\t\tvertex '+v[1].x+' '+v[1].y+' '+v[1].z+'\r\n';
      output+='\t\tvertex '+v[2].x+' '+v[2].y+' '+v[2].z+'\r\n';		
      output+='\tendloop\r\n';
      output+='endfacet\r\n';
    }
    output += 'endsolid exportedMesh';

    return output
  },

  // download function
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


  // update scene items, board, wires, pilons
  async updateScene () {
    // console.log(this.elect)
    // update boards pos, rot, scale
    for (let i = 0; i < this.elect.length; i++) {
      // console.log(i, this.data.position, this.data.position[i])
      this.elect[i].main.position = new BABYLON.Vector3(this.data.position[i][0], this.data.position[i][1], this.data.position[i][2])
      this.elect[i].main.rotation = new BABYLON.Vector3(this.data.rotation[i][0], this.data.rotation[i][1], this.data.rotation[i][2])
      this.elect[i].main.scaling = new BABYLON.Vector3(this.data.scaling[i][0], this.data.scaling[i][1], this.data.scaling[i][2])
    }

    // add pilons
    if (this.data.pilon) {
      for (let i = 0; i < this.data.pilon.length; i++) {
        // this.createPilons(this.data.pilon[i]) // - build them from code
        await this.createPilons2(this.data.pilon[i]) // import them
      }
    }

    // add wires
    this.createWires(this.data.wires)

    // add bateries
    if (this.data.battery) {
      for (let i = 0; i < this.data.battery.length; i++) {
        await this.importBatteries(this.data.battery[i])
      }
    }

    // const box = new BABYLON.Mesh.CreateBox('sad', 1, this.scene)
    // box.renderOverlay = true

    // console.log('fffff ', box)
  },

  // create pilons from code
  createPilons (data) {
    // this.Gdata['pilon'] = [[12, 0, -12, 1, 2, 0], [12, 0, 12, 1, 2, 0], [-12, 0, -12, 1, 2, 0], [-12, 0, 12, 1, 2, 0]]

    if (!data || (data && data.length === 0)) {
      return
    }
    for (let i = 0; i < data.length; i++) {
      const pilon = BABYLON.MeshBuilder.CreateCylinder('pilon', { diameterTop: data[i][3], diameterBottom: data[i][3], height: data[i][4], tessellation: 32 }, this.scene)
      pilon.position = new BABYLON.Vector3(data[i][0], data[i][1], data[i][2])
      pilon.rotation.x = data[i][5]
      pilon.rotation.z = data[i][6]
      console.log('pilon ', pilon)
      pilon.animu = true // for general animation
      // pilon.parent = parent // - only if you want to move it with the board, positions are related to parent
      pilon.material = new BABYLON.PBRMaterial('mat', this.scene)
      pilon.material.albedoColor = BABYLON.Color3.FromHexString('#858585').toLinearSpace()
      pilon.material.metal = 0.4
      pilon.material.roughness = 0.4
    }
  },

  // import pilons
  async createPilons2 (data) {
    // this.Gdata['pilon'] = [[12, 0, -12, 1, 2, 0], [12, 0, 12, 1, 2, 0], [-12, 0, -12, 1, 2, 0], [-12, 0, 12, 1, 2, 0]]

    if (!data || (data && data.length === 0)) {
      return
    }
    for (let i = 0; i < data.length; i++) {
      const decode = await attachImgToId(data[i][5], true)
      if (!decode) return
      const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
      const blob = new Blob([raw_content])
      const BBJSurl = URL.createObjectURL(blob)
      if (BBJSurl) {
        BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
        console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
        const meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
        console.log(meshes)
        meshes[0].rotationQuaternion = null
        meshes[0].animu = true 
        meshes[0].parent = this.elect[0].main
        meshes[0].position = new BABYLON.Vector3(data[i][0], data[i][1], data[i][2])
        meshes[0].rotation = new BABYLON.Vector3(data[i][3], 0, data[i][4])

        console.log('pilon ',  meshes[0])
      }
    }
  },

  // import battery
  async importBatteries (data) {
    if (data.link === '') {
      return
    }
    console.log(data) 
    const decode = await attachImgToId(data.link, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      const meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      console.log(meshes)
      meshes[0].rotationQuaternion = null
      meshes[0].animu = true // for general animation
      meshes[0].position = new BABYLON.Vector3(data.position[0], data.position[1], data.position[2])
      meshes[0].rotation = new BABYLON.Vector3(data.rotation[0], data.rotation[1], data.rotation[2])
      meshes[0].scaling = new BABYLON.Vector3(data.scale[0], data.scale[1], data.scale[2])
    }
  },

  createWires (data) {
    // this.Gdata['wires'] = [[[[8, 1, 20], [10, 1, 15], [2, 0, 11]], '#0000ff'], [[[8, 1, 16], [4, 0, 11]], '#ff0000']]

    if (!data || (data && data.length === 0)) {
      return
    }

    for (let i = 0; i < data.length; i++) {
      const pathI = data[i][0]
      const color = data[i][1]
      const radius = data[i][2] || 0.05
      let pathF = []
      for (let j = 0; j < pathI.length; j++) {
        pathF.push(new BABYLON.Vector3(pathI[j][0], pathI[j][1], pathI[j][2]))
      }

      const catmullRom = BABYLON.Curve3.CreateCatmullRomSpline(pathF, 30)
      const wire = BABYLON.MeshBuilder.CreateTube('tube', {path: catmullRom.getPoints(), radius: radius, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
      console.log('wire ', wire)
      wire.animu = true // for general animation
      wire.material = new BABYLON.PBRMaterial('mat', this.scene)
      wire.material.albedoColor = BABYLON.Color3.FromHexString(color).toLinearSpace()
      wire.material.metal = 0.4
      wire.material.roughness = 0.4
    }
  },

  // getData
  getData () {
    return this.data
  },

  // reset data from indexDB
  resetSavedData () {
    this.data = {
      'position': [],
      'rotation': [],
      'scaling': [],
      'pilon': [],
      'isPlaced': false,
      'wires': [],
      'coverHoles': [[],[],[],[],[],[]],
      'batHolder': {
        'link': '',
        'position': [],
        'rotation': [],
        'scale': []
      }
    }
  },

  // remove this engine
  disposeEngine () {
    this.selected = null
    this.viewAngle = 0
    this.completlyLoaded = false
    this.animationSpeed = 5
    
    this.data = {}
    this.helperVR = null
    this.elect = []
    this.cover = null

    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 0; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
      }
      if (this.scene.marker) {
        this.scene.marker.dispose()
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

  // clone selected obkect
  cloneObject () {
    console.log('TODO: add')
  },

  // empty scene
  clearScene () {
    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 0; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
      }
    }
    
    console.log('clear scene, empty indexDB')
    this.resetSavedData()
  },

  view2D () {

  },

  transform (param) {
    switch (param) {
      case 'translate':
        this.scene.marker.activeMod(0)
        break
      case 'rotate':
        this.scene.marker.activeMod(1)
        break
      case 'scale':
        this.scene.marker.activeMod(2)
        break
    }
  },

  // save cover as STL file for printing
  async saveAsSTL () {
    let meshes = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].electronic) {
        const kids = this.scene.meshes[i].getDescendants(false)
        meshes.push(kids[kids.length - 1])
      }
      else {
        if (this.scene.meshes[i].metadata2 && this.scene.meshes[i].metadata2.transform.arrayPoints) {
          const kids = this.scene.meshes[i].getDescendants(false)
          meshes.push(kids[kids.length - 1])
        }
      }
    }

    const msh = BABYLON.Mesh.MergeMeshes(meshes, false)
    const result = await this.generateSTL(msh)
    msh.dispose()
    if (result) {
      this.doDownload('mesh.stl', new Blob([result], { type: 'octet/stream' }))
    }
  },

  // save cover as OBJ file for printing
  saveAsObj () {
    let meshes = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].electronic) {
        const kids = this.scene.meshes[i].getDescendants(false)
        meshes.push(kids[kids.length - 1])
      }
    }
    
    const mesh = BABYLON.Mesh.MergeMeshes(meshes, false)
    if (mesh) {
      // save as obj
      const obj = OBJExport.OBJ([mesh], true, 'material')
      const mtl = OBJExport.MTL([mesh])

      mesh.dispose()

      const names = ['3dobject.obj', 'material.mtl']
      const blobs = [new Blob([obj], { type: 'octet/stream' }), new Blob([mtl], { type: 'octet/stream' })]

      this.doDownload(names[0], blobs[0])
      this.doDownload(names[1], blobs[1])

      return [names, blobs]
    }

    return []
  },

  // begin build animation in scene
  beginAnimation () {
    this.scene.stopAllAnimations()

    let animatable = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].animu) {
        // console.log(i, this.scene.meshes[i].name, this.scene.meshes[i])
        animatable.push(this.scene.meshes[i])
      }
    }

    animatable = this.sortObjects(animatable)
    this.setAnimOnAnimatable(animatable)
  },

  // do settings to be able to run animations
  setAnimOnAnimatable (animatable) {
    for (let i = 0; i < animatable.length; i++) {
      animatable[i].setEnabled(false)
      this.setAnimKeys(animatable[i], i, animatable)
    }

    if (animatable.length !== 0)
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

  sortObjects (animatedObjects) {
    let arrayObjs = []
    let posY = []
    for (let i = 0; i < animatedObjects.length; i++) {
      posY.push({ val: animatedObjects[i].getAbsolutePosition().y, index: i })
      // put the wires route with 1 up to show after parts on the board
      if (animatedObjects[i].name === 'wiresParent') {
        posY[i].val += 1
      }
      if (animatedObjects[i].name === 'pilon') {
        posY[i].val -= 0.1
      }
      if (animatedObjects[i].name === 'tube') {
        // posY[i].val += 10
      }
      if (animatedObjects[i].name === 'useCover') {
        // posY[i].val += 10
      }
    }

    posY = posY.sort(function (a, b) {
      return a.val - b.val
    })

    for (let i = 0; i < posY.length; i++) {
      arrayObjs.push(animatedObjects[posY[i].index])
    }
    return arrayObjs
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

  toggleSelection (param) {
    this.scene.meshSelected = parseInt(param)
    this.scene.marker.meshType = parseInt(param)
    this.scene.marker.activeMod(-1)
  },

  async setAsCover (synced = false) {
    if (this.scene.selected && this.scene.selected.item) {
      const item = this.scene.selected.item
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
      item.engineData.transform.display = 2

      this.elect[0].updateKeyElectronics()
      this.scene.marker.activeMod(-1)

      const engineData = item.engineData
      const toBeSave = [
        {
          "transform":
          {
            "color": null, // CONVERT FROM LEFT HANDED TO RIGTH??? TODO - to remove negative scale
            "rotation": [engineData.transform.coverRot[0] * 180 / Math.PI, engineData.transform.coverRot[1] * 180 / Math.PI, engineData.transform.coverRot[2] * 180 / Math.PI],
            "scale": [1,1,-1],
            "position": engineData.transform.coverPos,
            "elecPos": engineData.transform.position,
            "serial": engineData.transform.serial,
            "thole": engineData.transform.thole,
            "sync": synced
          },
          "drillArray": engineData.drillArray,
          "name": engineData.name,
          "url": engineData.url
        }
      ]

      await this.cover.import3dModel(toBeSave)
    }
  },

  async setAsElectronic (param = false) {
    console.log(param)
    return
    /*
    if (this.scene.selected) {
      const data = this.cover.getMeshEngineData()
      // console.log(data)
      if (!data.transform.elecPos) {
        alert('You can make electronic only electronic parts')
        return
      }
  
      this.cover.removeItem()
      // console.log(data)

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
              // console.log("part ", part.transform, data.transform)
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
        console.log('electronicPart    ', electronicPart)
        electronicPart.transform.display = 0
        if (param) {
          electronicPart.transform['position'][0] = data.transform.position[0]
          electronicPart.transform['position'][2] = data.transform.position[2]
          electronicPart.transform['rotation'] = [data.transform.rotation[0], data.transform.rotation[1], data.transform.rotation[2]]
        }
        
        await dbHelper.save_data_indexed_db(key_electronics, ele_engine_data)
      }
      
      let electronic
      // show electronic
      for (let i = 0; i < this.elect.length; i++) {
        const kid = this.elect[i].main.getChildren()
        // console.log(kid)

        for (let j = 0; j < kid.length; j++) {
          if (kid[j].item) {
            if (kid[j].item.engineData.transform.serial === data.transform.serial) {
                  electronic = kid[j].item
                  break
            }
          }
        }

        if (electronic) {
          break
        }
      }

      console.log('electronic ', electronic)
      if (electronic) {
        if (electronic.layer21) {
          electronic.layer21.isVisible = true
        }
        for (let j = 0; j < electronic.layer1.length; j++) {
          electronic.layer1[j].isVisible = true
        }
        if (electronic.decal) {
          electronic.decal.isVisible = true
        }
        if (electronic.body) {
          electronic.body.isVisible = true
        }
        for (let j = 0; j < electronic.pins.length; j++) {
          electronic.pins[j].isVisible = true
        }
      }

      console.log(param, data)
      if (param) {
        electronic.main.position.x = data.transform.position[0]
        electronic.main.position.z = data.transform.position[2]
        electronic.main.rotation = new BABYLON.Vector3(data.transform.rotation[0] * Math.PI / 180, data.transform.rotation[1] * Math.PI / 180, data.transform.rotation[2] * Math.PI / 180)
        electronic.main.computeWorldMatrix(true)
        
        this.elect[0].updateKeyElectronics()
      }
    }*/
  },

  linkWithWire () {

  },

  addWires (param) {
    var radius = 0.15
    var rounded = true
    var color = '#ff0000'

    // [[0,0,0],[128,72,200]]
    const resolution = 0.65
    param = JSON.parse(param)
    // const offsetX = this.elect[0].main.metadata.board.pcb_size[0] / 2
    const offsetX = 10
    // const offsetY = this.elect[0].main.metadata.board.pcb_size[1] / 2
    const offsetY = 9
    const offsetZ = 17

    let pathF = []
    for (let i = 0; i < param.length; i++) {
        pathF.push(new BABYLON.Vector3(param[i][0] * resolution - offsetX, param[i][1] * resolution - offsetY, param[i][2] * resolution - offsetZ))
    }

    let wire
    if (rounded) {
        const catmullRom = BABYLON.Curve3.CreateCatmullRomSpline(pathF, 10)
        wire = BABYLON.MeshBuilder.CreateTube('tube', {path: catmullRom.getPoints(), radius: radius, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    }
    else {
        wire = BABYLON.MeshBuilder.CreateTube('tube', {path: pathF, radius: radius, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    }

    wire.material = new BABYLON.PBRMaterial('mat', this.scene)
    wire.material.albedoColor = BABYLON.Color3.FromHexString(color).toLinearSpace()
    wire.material.metal = 0.4
    wire.material.roughness = 0.4

    wire.actionManager = new BABYLON.ActionManager(this.scene)

    // right click for delete
    wire.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, () => {
        wire.dispose(false, true)
    }))
  },

  scan () {
    let items = []

    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].name === '__root__') {
        items.push(this.scene.meshes[i])
      }
    }
    
    const scan = new MeshScanner(items, {
      gridRes: 0.65,
      view: 3,
    }, this.scene)

    console.log(scan)
  },

  // used to show cover after scan
  showCover () {
    let items = []

    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].name === '__root__') {
        items.push(this.scene.meshes[i])
      }
    }

    for (let i = 0; i < items.length; i++) {
      items[i].setEnabled(true)
    }

    const mh = this.scene.getMeshByName('SPS')
    mh.dispose()
  },

  getRandomPoints (nrOfPoints) {
    let arrayOfRoutes = []
    const xArray = [2,3,4,5,6,7,8,23,24,25,26,27,28,29,30]
    const yArray = [15,16,17,18,23,24,25,26]
    const zArray = [1,2,3,4,5,6,7,8,31,32,33,34,35,36,37,38]
    for (let i = 0; i < 2* nrOfPoints; i++) {
      var x1 = xArray[Math.floor(Math.random() * xArray.length)]
      var y1 = yArray[Math.floor(Math.random() * yArray.length)]
      var z1 = zArray[Math.floor(Math.random() * zArray.length)]
      // const x1 = this.randomIntFromInterval(2, 30)
      // const y1 = this.randomIntFromInterval(10, 18)
      // const z1 = this.randomIntFromInterval(1, 19)

      if (i % 2 === 0) {
        arrayOfRoutes.push([])
      }
      arrayOfRoutes[arrayOfRoutes.length - 1].push([x1,y1,z1])
    }
    console.log(arrayOfRoutes)
    // alert(arrayOfRoutes.join('\n'))
    alert(JSON.stringify(arrayOfRoutes))
  },

  randomIntFromInterval (min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  },

  async addHoleToBoxCover (data) {
    // 0 - 0 means custom, 1 box, 2 circle, etc
    // 1 - 0 doesn't matter, diff 0 => diameter or length depend on shape from index 0
    let arrayPoints = []
    if (data[2]) {
      arrayPoints = JSON.parse("[" + data[2] + "]");
    }
    const holeData = [parseFloat(Number(data[0]).toFixed(2)), parseFloat(Number(data[1]).toFixed(2)), arrayPoints]
    await this.cover.addHoleToBoxCover(holeData)
  },

  async addAccessoryToBoxCover (data) {
    // 0 - 0 means custom, 1 box, 2 circle, etc
    // 1 - 0 doesn't matter, diff 0 => diameter or length depend on shape from index 0
    let arrayPoints = []
    if (data[2]) {
      arrayPoints = JSON.parse("[" + data[2] + "]");
    }
    const holeData = [parseFloat(Number(data[0]).toFixed(2)), parseFloat(Number(data[1]).toFixed(2)), arrayPoints]
    await this.cover.addAccessoryToBoxCover(holeData)
  },

  cameraView (param) {
    if (param) {
      if (this.viewAngle < 4) {
        this.viewAngle++
      }
      else {
        this.viewAngle = 0
      }
    }
    else {
      if (this.viewAngle === 0) {
        this.viewAngle = 4
      }
      else {
        this.viewAngle--
      }
    }

    const pos = [new BABYLON.Vector3(9.2, 76.7, 150.7), new BABYLON.Vector3(-10, 50, 1), new BABYLON.Vector3(-20, -47, 20),  new BABYLON.Vector3(-10, 38, 0),  new BABYLON.Vector3(17, 56, 19)]

    var animCamera = new BABYLON.Animation("animCam", "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)

    var keys = [];
    keys.push({ frame: 0, value: this.scene.activeCamera.position.clone() })
    keys.push({ frame: 60, value: pos[this.viewAngle] })
    animCamera.setKeys(keys);
  
    this.scene.activeCamera.animations = [animCamera]
    this.scene.beginAnimation(this.scene.activeCamera, 0, 60, false)
  },

  async importFlushTankObj () {
    this.scene.activeCamera.maxZ = 10000
    this.scene.activeCamera.wheelPrecision = 5
    
    const link = "user-87ca2148a2a04aafb0eda57704236c4b.glb"
    const decode = await attachImgToId(link, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      const meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      meshes[0].rotate(new BABYLON.Vector3(0,1,0), Math.PI)
      console.log(meshes)
    }
  }
}