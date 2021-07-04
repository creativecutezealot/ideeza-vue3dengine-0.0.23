import * as BABYLON from 'babylonjs'

export default class Item {
  constructor (meshes, scene, general, indexOfPart) {
    this.engineData = null
    this.metadata = null
    this.boardH = 0
    this._scene = scene

    this.main = meshes[0]
    this.body = null
    this.decal = null
    this.layer1 = []
    this.layer21 = null
    this.pins = []
    this.others = []
    this.mainRot = general.rotation[indexOfPart]

    this.init(meshes)
  }

  init (meshes) {
    for (let i = 0; i < meshes.length; i++) {
      if (meshes[i].name.toLowerCase().indexOf('body') !== -1) {
        this.body = meshes[i]
      }
      else {
        if (meshes[i].name.toLowerCase().indexOf('pin') !== -1) {
          this.pins.push(meshes[i])
        }
        else {
          if (meshes[i].name.toLowerCase().indexOf('decal') !== -1) {
            this.decal = meshes[i]
          }
          else {
            if (meshes[i].name.toLowerCase().indexOf('layer1') !== -1) {
              this.layer1.push(meshes[i])
            }
            else {
              if (meshes[i].name.toLowerCase().indexOf('layer21') !== -1) {
                this.layer21 = meshes[i]
              }
              else {
                this.others.push(meshes[i])
              }
            }
          }
        }
      }
    }

    this.main.item = this

    // console.log(this.main)
  }

  updateTransform (boardSize = null) {
    const position = this.engineData.transform['position']
    const rotation = this.engineData.transform['rotation']

    if (boardSize) {
      const posCoords = this.setPositionByPivot([position[0], position[1]], boardSize)
      this.engineData.transform['position'][0] = posCoords[0]
      this.engineData.transform['position'][2] = posCoords[1]
    }

    if (this.engineData.transform['display'] == null) {
      // if this doesn't come from technician or algo, by default electronic is visible only in electronic
      this.engineData.transform['display'] = 0
    }

    this.main.rotationQuaternion = null
    if (this.engineData.transform['mirror']) {
      this.main.rotation = new BABYLON.Vector3((rotation[0] + 180) * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
      this.main.position = new BABYLON.Vector3(position[0], -position[1], position[2])
    }
    else {
      this.main.rotation = new BABYLON.Vector3(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
      this.main.position = new BABYLON.Vector3(position[0], position[1] + this.boardH, position[2])
    }

    // get position of part based on position on the board
    const pos = this.main.getAbsolutePosition()
    this.engineData.transform['coverPos'] = [pos.x, pos.y, pos.z]
    this.engineData.transform['coverRot'] = [this.main.rotation.x, this.main.rotation.y, this.main.rotation.z]
  }
 
  setMetadata (metadata) {
    this.metadata = metadata
    this.main.metadata = metadata
  } 

  // show toggle pin index
  togglePinIndex (pin, visible) {
    const scene = this.scene
    let pinIndex = pin.name.split('_')[1]

    if (visible) {
      const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', { width: 30, height: 30 }, scene, true)
      dynamicTexture.drawText(pinIndex, 5, 20, 'bold 20px Arial', 'white', 'black', true, true)

      const plane = BABYLON.MeshBuilder.CreatePlane('billboard', { height: 1, width: 1 }, scene, true)
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
      plane.renderingGroupId = 1
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', scene)
      plane.material.backFaceCulling = false
      plane.position = pin.getAbsolutePosition()
      plane.material.diffuseTexture = dynamicTexture

      pin.tooltip = plane
    }
    else {
      if (pin.tooltip) {
        pin.tooltip.dispose(false, true)
        delete pin.tooltip
      }
    }
  }

  // convert
  setPositionByPivot (coords, boardSize) {
    let diff = [boardSize[0] / 2, boardSize[1] / 2]
    if (this.engineData.transform['rotation'][1] % 180 === 0) {
      diff = [boardSize[0] / 2 + this.engineData.transform['pivot'][0], boardSize[1] / 2 + this.engineData.transform['pivot'][1]]
    }
    else {
      diff = [boardSize[0] / 2 + this.engineData.transform['pivot'][1], boardSize[1] / 2 + this.engineData.transform['pivot'][0]]
    }
    return [coords[0] - diff[0], coords[1] - diff[1]]
  }

  // function update position, rotation, layer of this component, based on moshe algo
  updateValues (coords, boardSize) {
    this.engineData.transform['rotation'][1] = -coords[2] * 90 + 180
    
    const posCoords = this.setPositionByPivot([coords[0], coords[1]], boardSize)
    this.engineData.transform['position'][0] = posCoords[0]
    this.engineData.transform['position'][2] = posCoords[1]

    if (coords[3] !== 0) {
      this.engineData.transform['mirror'] = true
    }

    this.updateTransform()
  }

  dispose () {
    this.main.dispose(false, true)
    this.engineData = null
    this.metadata = null
    this.boardH = 0
    this._scene = null

    this.main = null
    this.body = null
    this.decal = null
    this.layer1 = []
    this.layer21 = null
    this.pins = []
    this.others = []

    delete this
  }
}