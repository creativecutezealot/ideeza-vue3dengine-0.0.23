import * as BABYLON from 'babylonjs'

export default class Gizmo {
    constructor(engine) {
      this.gizmos = this.init(engine)
    }
  
    init (engine) {
      const gizmo = new BABYLON.GizmoManager(engine.scene)

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

      gizmo.gizmos.positionGizmo.xGizmo.dragBehavior.onDragEndObservable.add(() => {
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.positionGizmo.yGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.positionGizmo.zGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.rotationGizmo.xGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.rotationGizmo.yGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.rotationGizmo.zGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.scaleGizmo.xGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.scaleGizmo.yGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })
      gizmo.gizmos.scaleGizmo.zGizmo.dragBehavior.onDragEndObservable.add(() => {			
        engine.gizmoCallbacks()
      })

      return gizmo
    }

    activeMod (mod) {
      switch (mod) {
        case 0:
          this.gizmos.positionGizmoEnabled = true
          this.gizmos.rotationGizmoEnabled = false
          this.gizmos.scaleGizmoEnabled = false
          break
        case 1:
          this.gizmos.positionGizmoEnabled = false
          this.gizmos.rotationGizmoEnabled = true
          this.gizmos.scaleGizmoEnabled = false
          break
        case 2:
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