<template>
  <div>
    <canvas ref="canvas" id="canvas" touch-action="none" style="width:100%;height:100%" />
  </div>
</template>

<script>
import * as BABYLON from 'babylonjs'
// engine for technician component schematic
import { pcb3D } from '../../../engines/electronic_user_s' 

export default {
  name: 'etcs',
  
  props: {
    initData: {               // the object used to init the engine
      type: Object,
      default: () => {}    
    },           
    groupButton: {            // group of functions for user interactions
      type: String,
      default: 'move'
    },
    visibleGrid: {              // show/hide grid - by default show
      type: Boolean,
      default: true
    },             
    resolution: {             // grid resolution - by default 10
      type: Number,
      default: 10
    },
    partData : {              // the object used to import a part
      type: Object,
      default: () => {}    
    }
  },

  watch: {
    visibleGrid: (newVal) => {
      pcb3D.toggleGrid(newVal); 
    },
    resolution: (newVal) => {
      pcb3D.changeResolution(newVal);
      pcb3D.toggleGrid(true);
    },
    groupButton: (newVal) => {
      pcb3D.func_(newVal);
    },
    partData: (newVal) => {
      pcb3D.import3dModel(newVal);
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
      this._scene.activeCamera.beta = 0
      this._scene.activeCamera.radius = 10
      this._scene.activeCamera.minZ = 0
      this._scene.activeCamera.lowerRadiusLimit = 1
      this._scene.activeCamera.allowUpsideDown = true
      this._scene.activeCamera.noRotationConstraint = true
      this._scene.activeCamera.upperAlphaLimit = this._scene.activeCamera.lowerAlphaLimit = this._scene.activeCamera.alpha
      this._scene.activeCamera.upperBetaLimit = this._scene.activeCamera.lowerBetaLimit = this._scene.activeCamera.beta
      this._scene.activeCamera.wheelPrecision = 30
      this._scene.activeCamera.panningSensibility = 47
      this._scene.activeCamera.panningInertia = 0   

      this._engine.runRenderLoop(() => {
        this._scene.render()
      })

      this._engine.resize()

      window.addEventListener('resize', () => { if (this._engine) { this._engine.resize() } })
      window.addEventListener('contextmenu', function (e) { e.preventDefault() }, false)
    },

    initCustomEngine () {

      /*{"nets":[],"routing_data":[],"assets":[],"compSize":[20,20],"electData":{"ComponentParts":[],"ComponentToParts":[],"PartToPart":[],"PartToPartNames":[],"need":{},"pass":{}}}*/
      pcb3D.init(this._scene, this.initData)

      // sent selected object to parent to know which menu to show
      pcb3D.addCalbacks(this.selectObject)
    },

    getData() { // to be called from parent on save
      return pcb3D.getData()
    },

    getObjectToBeSaved() { // to be called from parent on show engine details
      return pcb3D.getObjectToBeSaved()
    },

    toDefaultCameraSetting () { // to be called from parent to reset camera
      this._scene.activeCamera.alpha = Math.PI / 2
      this._scene.activeCamera.beta = 0
      this._scene.activeCamera.radius = 10
      this._scene.activeCamera.target = BABYLON.Vector3.Zero()
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
/*#canvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}*/
</style>