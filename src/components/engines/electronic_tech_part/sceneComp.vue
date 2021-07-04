<template>
  <div>
    <canvas ref="canvas" id="canvas" touch-action="none" style="width:100%;height:100%" />
  </div>
</template>

<script>
/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
// engine for package
import {
  TQFN,
  FemaleHeader,
  R0805
} from '../../../engines/electronic_tech_part'

export default {
  name: 'etp',
  data () {
    return {
      package: null
    }
  },

  props: {
    initData: {               // name of package we want to import
      type: String,
      default: ""    
    },
    defaultData: {            // all informations from form
      type: Object,
      default: () => {}
    },
    toggle3d: {               // show 3d
      type: Boolean,
      default: true
    },
    toggle2d: {               // show 2d
      type: Boolean,
      default: false
    },
    togglesc: {               // show schematic
      type: Boolean,
      default: false
    },
    togglechecker: {          // show checker
      type: Boolean,
      default: false
    }
  },

  watch: {
    defaultData: {
      handler (val) {
        this.package.updateObject(val)
      },
      deep: true
    },
    toggle3d: {
      handler (val) {
        this.package.view3D(val)
      }
    },
    toggle2d: {
      handler (val) {
        this.package.view2D(val)
      }
    },
    togglesc: {
      handler (val) {
        this.package.viewSchematic(val)
      }
    },
    togglechecker: {
      handler (val) {
        this.package.checkPosition(val)
      }
    },
  },

  created () {
    this._scene = null
    this._engine = null
  },

  methods: {
    createScene () {
      BABYLON.SceneLoader.ShowLoadingScreen = false
      
      this._engine.setHardwareScalingLevel(1.0)
      this._scene = new BABYLON.Scene(this._engine)
      this._scene.clearColor = new BABYLON.Color4(0.0, 0.4, 0.0, 1.0)

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
      switch (this.initData.toUpperCase()) {
        case 'TQFN':
          this.package = new TQFN(this._scene, this.defaultData)
          break
        case 'FEMALEHEADER':
          this.package = new FemaleHeader(this._scene, this.defaultData)
          break
        case 'R0805':
          this.package = new R0805(this._scene, this.defaultData)
          break
        default:
          break
      }

      console.log('this.package ', this.package);
    },

    save () { // to be called from parent on save, this return you the blobs of this part
      return this.package.save3D()
    },

    // after we store the blobs we get 3 links, with those come back and save this
    // this has all the data needed on a part
    getPartDataForAlgo (link, link2, link3) { 
      return { 
        data: {
          Fsize: this.package.metadata.Fsize,
          sizeL1: this.package.metadata.sizeL1,
          size: this.package.metadata.size,
          layer1: this.package.metadata.layer1[1],
          layer21: this.package.metadata.layer21[1],
          hasValue: this.package.metadata.hasValue,
          value: this.package.metadata.value
        },
        engine: {
          url: link,
          design: link2,
          schematic: link3,
          transform: this.package.metadata.transform,
          name: this.package.metadata.name,
          name2d: this.package.metadata.name2d,
        }
      }
    },

    getData() { // to be called from parent , obsolete
      return this.package.getData()
    },

    disposeCustomEngine () {
      this.package.disposeEngine()
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