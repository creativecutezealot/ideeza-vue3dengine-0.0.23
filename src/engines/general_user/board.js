import * as BABYLON from 'babylonjs'
import { GridMaterial } from 'babylonjs-materials'

const MESHTYPE = {
  COVERPART: 0,
  ELECPART: 1,
  BOARD: 2
}

export default class Board {
  constructor (args, scene) {
    this._args = args
    this._scene = scene

    this.height = 0
    this.name = 'board'    
    this.type = 'board'  
    this.grid = null
    this.layers = new Array(0)
    this.holes = []
    this.THholes = []
    this.parent = null

    this.init()
  }

  init () {
    if (!this._args['visibility']) {
      this._args['visibility'] = []
    }
    this.layers = new Array(this._args['pcb_layers'])
    this.height = this._args['pcb_layers'] * this._args['layerThickness']

    let layer = null
    for (var i = 0; i < this._args['pcb_layers']; i++) {
      if (this._args['isCircle'] === true) {
        layer = BABYLON.MeshBuilder.CreateCylinder('__root__', { height: this._args['layerThickness'], diameterTop: parseFloat(this._args['pcb_size'][0]), diameterBottom: parseFloat(this._args['pcb_size'][0]), tessellation: 64, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this._scene)
      }
      else {
        layer = BABYLON.MeshBuilder.CreateBox('__root__', { height: this._args['layerThickness'], width: parseFloat(this._args['pcb_size'][0]), depth: parseFloat(this._args['pcb_size'][1]), sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this._scene)
      }

      // holes used for fixing
      layer = this.addFixingHolesToBoard(layer)
 
      // routing holes
      layer = this.addHolesToBoard(layer)

      // add th part holes
      layer = this.addTHPartHole(layer)

      layer.material = new BABYLON.PBRMaterial('boardMaterial', this._scene)
      layer.material.metallic = 0.5
      layer.material.roughness = 0.5
      layer.material.albedoColor = BABYLON.Color3.FromHexString(this._args['color']).toLinearSpace()  
      layer.position.y = i * this._args['layerThickness'] + this._args['layerThickness'] / 2
      if (this._args['visibility'][i] === undefined) {
        this._args['visibility'][i] = true
      }
      layer.isVisible = this._args['visibility'][i]
      this.layers[i] = layer
      // console.log('board mat ', layer.material)
      // on right click change camera target
      var _this = this

      layer.animu = true // for general animation
      layer.actionManager = new BABYLON.ActionManager(this._scene)
      layer.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
          if (_this._scene.meshSelected === MESHTYPE.BOARD) {
            _this._scene.selected = layer.parent
            _this._scene.marker.gizmos.attachToMesh(layer.parent)
            _this._scene.marker.activeMod(0)
          }
        }))
    }

    if (this._args['isCircle'] === true) {
      this.grid = BABYLON.MeshBuilder.CreateCylinder('disc2', { height: this._args['layerThickness'] * this._args['pcb_layers'], diameterTop: parseFloat(this._args['pcb_size'][0]), diameterBottom: parseFloat(this._args['pcb_size'][0]), tessellation: 64, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this._scene)
    }
    else {
      this.grid = BABYLON.MeshBuilder.CreateBox('rectangle2', { height: this._args['layerThickness'] * this._args['pcb_layers'], width: parseFloat(this._args['pcb_size'][0]), depth: parseFloat(this._args['pcb_size'][1]), sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this._scene)
    }
    this.grid.isVisible = this._args['enableGrid']
    this.grid.isPickable = false
    this.grid.position.y = (this._args['layerThickness'] * this._args['pcb_layers']) / 2

    const gridRatio = [1, 0.1, 0.01]
    this.grid.material = new GridMaterial('gridMaterial', this._scene)
    this.grid.material.majorUnitFrequency = 1 
    this.grid.material.gridRatio = gridRatio[this._args['gridResolution']]
    this.grid.material.opacity = 0.99
    this.grid.material.zOffset = -2
    this.grid.material.mainColor = BABYLON.Color3.White()
    this.grid.material.lineColor = new BABYLON.Color3(0, 0, 0)
    // console.log('grid mat ', this.grid.material)
  }

  // reRender the board on data change - for watch function
  recreateBoard () {
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].parent) {
        this.parent = this.layers[i].parent
      }
      this.layers[i].dispose(false, true)
    }
    this.grid.dispose(false, true)
    this.layers = []

    this.init()
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].isVisible = this._args['visibility']
      if (this.parent) {
        this.layers[i].parent = this.parent
        this.grid.parent = this.parent
      }
    }
  }
  
  // add hole of th part
  addTHPartHole (layer) {
    let holes = []
    for (let j = 0; j < this.THholes.length; j++) {
      const hole = BABYLON.Mesh.CreateCylinder('pilon ', this._args['layerThickness'] + 0.01, this.THholes[j][1], this.THholes[j][1], 32, this._scene)
      hole.position.x = this.THholes[j][2]
      hole.position.z = this.THholes[j][3]
      holes.push(hole)
    }
    
    if (holes.length !== 0) {
      const mergeH = BABYLON.Mesh.MergeMeshes(holes, true)
      layer = this._createHoles(layer, mergeH, this._scene)
    }
    
    return layer
  }
  
  // add fixing hole to a layer
  addFixingHolesToBoard (layer) {
    let holes = []
    for (let j = 0; j < this._args['fixingHoles'].length; j++) {
      const hole = BABYLON.Mesh.CreateCylinder('pilon ', this._args['layerThickness'] + 0.01, this._args['fixingHoles'][j][2], this._args['fixingHoles'][j][2], 32, this._scene)
      const coords = this._projecTo3D([this._args['fixingHoles'][j][0], this._args['fixingHoles'][j][1]])

      hole.position = coords 
      holes.push(hole)
    }
    
    if (holes.length !== 0) {
      const mergeH = BABYLON.Mesh.MergeMeshes(holes, true)
      layer = this._createHoles(layer, mergeH, this._scene)
    }
    
    return layer
  }

  // convert vector 2d points to vector 3d points
  _projecTo3D (param) {
    var x = -this._args.pcb_size[0] / 2 + param[0]
    var y = (param[2]) ? param[2] : 0
    var z = -this._args.pcb_size[1] / 2 + param[1]

    return new BABYLON.Vector3(parseFloat(Number(x).toFixed(2)), parseFloat(Number(y).toFixed(2)), parseFloat(Number(z).toFixed(2)))
  }

  // add a hole to a layer
  addHolesToBoard (layer) {
    let holes = []
    for (let j = 0; j < this.holes.length; j++) {
      const hole = BABYLON.Mesh.CreateCylinder('pilon ', this._args['layerThickness'] + 0.01, this.holes[j][1], this.holes[j][1], 32, this._scene)
      hole.position.x = this.holes[j][2]
      hole.position.z = this.holes[j][3]
      holes.push(hole)
    }
    
    if (holes.length !== 0) {
      const mergeH = BABYLON.Mesh.MergeMeshes(holes, true)
      layer = this._createHoles(layer, mergeH, this._scene)
    }
    
    return layer
  }

  _createHoles (mesh1, mesh2, scene) {
    const name = mesh1.name
    const innerCSG = BABYLON.CSG.FromMesh(mesh2)
    const outerCSG = BABYLON.CSG.FromMesh(mesh1)

    mesh1.dispose()
    mesh2.dispose()

    const subCSG = outerCSG.subtract(innerCSG)

    scene.removeMesh(innerCSG)
    scene.removeMesh(outerCSG)

    mesh1 = subCSG.toMesh(name, null, scene)
    scene.removeMesh(subCSG)

    return mesh1
  }

  // dispose meshes
  dispose () {
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].dispose(false, true)
    }
    this.grid.dispose(false, true)
    this.layers = []
    this._args = null

    delete this
  }

/*
  // create holes in the board
  _createHoles (layer) {
    if (this._pcb.hole === null || this._pcb.hole.main === null) return layer

    const name = layer.name
    const innerCSG = BABYLON.CSG.FromMesh(this._pcb.hole.main)
    const outerCSG = BABYLON.CSG.FromMesh(layer)

    layer.dispose()

    const subCSG = outerCSG.subtract(innerCSG)

    this.scene.removeMesh(innerCSG)
    this.scene.removeMesh(outerCSG)

    layer = subCSG.toMesh(name, null, this.scene)
    this.scene.removeMesh(subCSG)

    return layer
  }

  checkDimensionsFit () {
    let intersect = true
    for (let i = 0; i < this._pcb.parts.length; i++) {
      if (this._pcb.parts[i].boardIntersect() === true) {
        intersect = false
        break
      }
    }

    for (let i = 0; i < this._pcb.components.length; i++) {
      for (let j = 0; j < this._pcb.components[i]._parts.length; j++) {
        if (this._pcb.components[i]._parts[j].boardIntersect() === true) {
          intersect = false
          break
        }
      }
      if (intersect === false) { break }
    }

    return intersect
  }
*/
}
