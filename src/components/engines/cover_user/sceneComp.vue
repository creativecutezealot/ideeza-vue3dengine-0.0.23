<template>
  <div>
    <canvas ref="canvas" id="canvas" touch-action="none" style="width:100%;height:100%" />
  </div>
</template>

<script>
import * as BABYLON from 'babylonjs'
// engine for technician cover part/component/full model
import { pcb3D } from '../../../engines/cover_user' 

export default {
  name: 'ct',
  
  props: {
    initData: {               // the object used to init the engine
      type: Object,
      default: () => {}    
    },      
    router: {                 // type of scene, 0 - part, 1 - component, 2 - cover
      type: Number,
      default: 0
    },
    visibleGrid: {              // show/hide grid - by default show
      type: Boolean,
      default: true
    },   
    background: {              // change background
      type: String,
      default: "#ffffff"
    },   
    transform: {              // type of transform in scene
      type: String,
      default: "translate"
    }, 
    objectData: {             // the object used to import a 3d object
      type: Object,
      default: () => {}    
    },  
    uploadData: {             // the event from upload
      type: Object,
      default: () => null   
    },  
    transformData: {          // the event from upload
      type: Array,
      default: () => []   
    },  
    objectColor: {            // object color
      type: String,
      default: "#ffffff"
    },   
    apiPlatform: {            // site where we search polygoogle/remix3d
      type: String,
      default: "polygoogle"
    },   
    searchFor: {              // text after we search
      type: String,
      default: ""
    },   
    scan: {                   // do scan
      type: Boolean,
      default: false
    },
    scanRes: {                // 1,2,3,5,6,8,10, etc
      type: Number,
      default: 5
    },
    scanView: {               // 0-Outisde / 1-Inside / 2-Border / 3-All
      type: Number,
      default: 3
    }
  },
  watch: {
    visibleGrid: (newVal) => {
      pcb3D.toggleGrid(newVal); 
    },
    background: (newVal) => {
      pcb3D.scene.clearColor = BABYLON.Color3.FromHexString(newVal)
    },
    transform: (newVal) => {
      return pcb3D.transform(newVal)
    },
    objectData: (newVal) => {
      return pcb3D.import3dModel(newVal)
    },
    uploadData: (newVal) => {
      return pcb3D.upload3dModel(newVal)
    },
    transformData: (newVal) => {
      if (pcb3D.selected === null) {
        // console.log('Error: You must select a part/ component/ cover first')
        return
      }
      return pcb3D.doTransform(newVal[0], newVal[1])
    },
    objectColor: (newVal) => { 
      if (pcb3D.selected === null) {
        // console.log('Error: You must select a part/ component/ cover first')
        return
      }
      return pcb3D.changeColor(newVal)
    },
    apiPlatform: (newVal) => {
      pcb3D.getApiResult(newVal, null)
    },
    searchFor: (newVal) => {
      pcb3D.getApiResult(null, newVal)
    },
    scan: (newVal) => {
      if (newVal) {
        return pcb3D.scan()
      }
    },
    scanRes: (newVal) => {
      pcb3D.changeScanRes(newVal)
    },
    scanView: (newVal) => {
      pcb3D.changeScanView(newVal)
    }
  },

  created () {
    this._scene = null
    this._engine = null
  },

  methods: {
    selectObject(data) {
      this.$emit('selectObject', data);
    },

    createScene () {
      BABYLON.SceneLoader.ShowLoadingScreen = false
      
      this._engine.setHardwareScalingLevel(1.0)
      this._scene = new BABYLON.Scene(this._engine)
      this._scene.clearColor = new BABYLON.Color4(1, 1, 1, 1)

      this._scene.createDefaultCamera(true, true, true)
     
      this._scene.createDefaultEnvironment({
        cameraContrast: 2,
        cameraExposure: 1,
        toneMappingEnabled: true,
        createGround: false,
        createSkybox:false
      })
  
      this._scene.activeCamera.alpha = Math.PI / 2
      this._scene.activeCamera.beta = 1.1
      this._scene.activeCamera.radius = 20
      this._scene.activeCamera.minZ = 0
      this._scene.activeCamera.lowerRadiusLimit = 1
      this._scene.activeCamera.allowUpsideDown = true
      this._scene.activeCamera.noRotationConstraint = true
      this._scene.activeCamera.wheelPrecision = 30
      this._scene.activeCamera.panningSensibility = 47
      this._scene.activeCamera.panningInertia = 0

      const light = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this._scene)
      light.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5) 
      light.specular = new BABYLON.Color3(0.5, 0.5, 0.5)

      this._engine.runRenderLoop(() => {
        this._scene.render()
      })

      this._engine.resize()

      window.addEventListener('resize', () => { if (this._engine) { this._engine.resize() } })
      window.addEventListener('contextmenu', function (e) { e.preventDefault() }, false)
    },

    initCustomEngine () {
      /* eslint-disable no-console */
      console.log(this.initData, this.router);
      pcb3D.init(this._scene, this.initData, this.router)

      // sent selected object to parent to know which menu to show
      pcb3D.addCalbacks(this.selectObject)
    },

    getData() { // to be called from parent on save
      return pcb3D.getData()
    },

    removeItem () { // to be called from parent
      if (pcb3D.selected === null) {
        // console.log('Error: You must select a part/ component/ cover first')
        return
      }
      return pcb3D.remove()
    },

    toggleItem () { // to be called from parent
      if (pcb3D.selected === null) {
        // console.log('Error: You must select a part/ component/ cover first')
        return
      }
      return pcb3D.toggle()
    },

    sliceItem () { // to be called from parent
      if (pcb3D.selected === null || pcb3D.selected.type === 'part') {
        // console.log('Error: You must select a component/ cover first')
        return
      }
      return pcb3D.sliceItem()
    },

    save3DObject () { // to be called from parent to save the image view of 3d object
      return pcb3D.save3DObject()
    },

    addHole () { // to be called from parent
      return pcb3D.addHole()
    },
    addShape () { // to be called from parent
      return pcb3D.addShape()
    },
    changeShape (param) { // to be called from parent
      return pcb3D.changeShape(param)
    },
     enterVR () { // to be called from parent
      return pcb3D.enterVR()
    },
    recordScene (param) { // to be called from parent
      pcb3D.recordScene(param)
    },
    beginAnimation () { // to be called from parent
      pcb3D.beginAnimation()
    },
    clearScene () { // to be called from parent to empty the scene
      return pcb3D.clearScene()
    },
    
    disposeCustomEngine () {
      pcb3D.disposeEngine()
    }
  },

  mounted () {
    if (!BABYLON.Engine.isSupported()) {
      alert('WebGL is not supported or it is disable on your browser!')
      return
    }

    const canvas = this.$refs.canvas
    this._engine = new BABYLON.Engine(
      canvas,
      true,
      {
        preserveDrawingBuffer: true,
        stencil: true
      }
    )

    this.createScene()
    this.initCustomEngine()
  },

  beforeDestroy: function () {
    window.removeEventListener('resize', () => { if (this._engine) { this._engine.resize() } })
    window.removeEventListener('contextmenu', function (e) { e.preventDefault() }, false)
    
    this.disposeCustomEngine()
  }
}
</script>

<style scoped>
#canvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>