import * as BABYLON from 'babylonjs'

export default class Gizmo {
    constructor(scene) {
      this.gizmos = this.init(scene)
      this.actualMode = 0
      this.meshType = 0
    }
  
    init (scene) {
      const gizmo = new BABYLON.GizmoManager(scene)
      gizmo.boundingBoxGizmoEnabled = false
      gizmo.attachableMeshes = []
      gizmo.positionGizmoEnabled = true
      gizmo.rotationGizmoEnabled = true
      gizmo.scaleGizmoEnabled = true 
      // gizmo.usePointerToAttachGizmos = false
      // gizmo.clearGizmoOnEmptyPointerEvent = true

      gizmo.gizmos.positionGizmo.updateGizmoPositionToMatchAttachedMesh = false
      gizmo.gizmos.positionGizmo.updateGizmoRotationToMatchAttachedMesh = false
      gizmo.gizmos.rotationGizmo.updateGizmoPositionToMatchAttachedMesh = false
      gizmo.gizmos.rotationGizmo.updateGizmoPositionToMatchAttachedMesh = false
      gizmo.gizmos.scaleGizmo.updateGizmoPositionToMatchAttachedMesh = false
      gizmo.gizmos.scaleGizmo.updateGizmoPositionToMatchAttachedMesh = false

      return gizmo
    }

    activeMod (mod) {
      this.actualMode = parseInt(mod)
      switch (mod) {
        case 0:
          this.gizmos.positionGizmoEnabled = true
          this.gizmos.rotationGizmoEnabled = false
          this.gizmos.scaleGizmoEnabled = false

          if (this.meshType === 1) {
            this.gizmos.gizmos.positionGizmo.yGizmo.attachedMesh = null
          }
          break
        case 1:
          this.gizmos.positionGizmoEnabled = false
          this.gizmos.rotationGizmoEnabled = true
          this.gizmos.scaleGizmoEnabled = false
          
          if (this.meshType === 1) {
            this.gizmos.gizmos.rotationGizmo.snapDistance = Math.PI / 2
            this.gizmos.gizmos.rotationGizmo.xGizmo.attachedMesh = null
            this.gizmos.gizmos.rotationGizmo.zGizmo.attachedMesh = null
          }
          break
        case 2:
          if (this.meshType !== 0) {
            this.activeMod(-1)
            break
          }
          this.gizmos.positionGizmoEnabled = false
          this.gizmos.rotationGizmoEnabled = false
          this.gizmos.scaleGizmoEnabled = true
          break
        case -1:
          this.gizmos.positionGizmoEnabled = false
          this.gizmos.rotationGizmoEnabled = false
          this.gizmos.scaleGizmoEnabled = false
          break
      }
    }

    dispose () {
        this.gizmos.dispose()
        this.gizmos = null

        delete this
    }
  }