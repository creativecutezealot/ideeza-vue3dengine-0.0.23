import * as BABYLON from 'babylonjs'
import { attachImgToId } from '../../helpers/getImg'
import 'babylonjs-loaders'

export default {
  scene: null,
  engine: null,
  url: [],

  async init (scene, url) {
    this.scene = scene
    this.engine = this.scene.getEngine()

    await this.importMesh(url)
  },

  async importMesh (url) {
    this.emptyScene()
    this.engine.displayLoadingUI();

    const decode = await attachImgToId(url, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)

    let meshes = null;
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      // console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
    }
    
    this.fitToView(meshes[0]);
    this.engine.hideLoadingUI();
  },

  fitToView (mesh) {
    let radius = mesh.getBoundingInfo().boundingSphere.radiusWorld
    if (!isFinite(radius)) {
      return
    }
    let aspectRatio = this.engine.getAspectRatio(this.scene.activeCamera)
    let halfMinFov = this.scene.activeCamera.fov / 2
    if (aspectRatio < 1) {
      halfMinFov = Math.atan(aspectRatio * Math.tan(this.scene.activeCamera.fov / 2))
    }

    let viewRadius = Math.abs(radius / Math.sin(halfMinFov))
    if (viewRadius > this.scene.activeCamera.radius) {
      this.scene.activeCamera.radius = viewRadius
    }
  },

  emptyScene () {
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i]) {
        this.scene.meshes[i].dispose(true, true)
      }
    }
  },

  disposeEngine () {
    if (this.scene) {
      this.emptyScene()
      this.scene.dispose()
      delete this.scene
      // console.log('------ ENGINE KILLED 1 -----')
    }
    if (this.engine) {
      this.engine.stopRenderLoop()
      this.engine.clear(BABYLON.Color3.White(), true, true, true)
      this.engine.dispose()
      delete this.engine
      // console.log('------ ENGINE KILLED 2 -----')
    }

    delete this
  }
}
