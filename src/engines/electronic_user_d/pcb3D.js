/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { attachImgToId } from '../../helpers/getImg'
import { DrawText } from '../general/Utils'
import { isArray } from 'util'
import { GridMaterial } from 'babylonjs-materials'
import 'babylonjs-loaders'

export default {
  scene: null,
  objects: {}, // loadded objects in scene
  _engine: null,
  canvas: null,
  calbacks: {
    select: null // calback when click on component, part, wire
  },
  board: null, // the board
  comp: null, // the component
  gridSize: 100,
  selected: null, // selected part, pin
  nets: [], // keep data of routing
  currentNet: -1,
  data: {}, // data for scene, which parts, routes
  electData: {}, // electronic data for algo
  gridResolution: 0.1,
  components: [],
  completlyLoaded: false,
  options: ['move','rotate','mirror','label','route','highlight','delete'],
  curentOpt: 0,
  label: null,
  lastPosition: null,
  _observer: null,
  auxwires: [], // keep yellow lines
  wires: [], // keep normal lines
  auxline: null, // main line 
  auxline2: null, // second line
  clickedPin: null, // clicked pin
  objects3d: [],
  wireMirror: false,
  compEnabled: true,
  wireWidth: 0.1,
  // init the entire scene
  async init (scene, data) {
    this.scene = scene
    this._engine = scene.getEngine()
    this._engine.resize()
    this.canvas = this._engine.getRenderingCanvas()
    this.objects = {}
 
    this.label = this.createLabel()
    console.log('dataaaaa//////// ', data)

    for (let key in data.electData) {
      this.electData[key] = data.electData[key]
    }
    
    this.data.nets = data.nets 
    this.data.routing = this.nets = data.routing
    this.data.assets = data.assets
    this.data.compSize = data.compSize

    this.addComp()
    this.addBoard()

    var _that = this
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnEveryFrameTrigger, (evt) => {
        var pickinfo = _that.scene.pick(_that.scene.pointerX, _that.scene.pointerY, function (mesh) { return mesh === _that.board })

        if (pickinfo.hit) {
          const x = _that.snapToGrip(parseFloat(_that.data.compSize[0] / 2 - pickinfo.pickedPoint.x))
          const z = _that.snapToGrip(parseFloat(_that.data.compSize[1] / 2 - pickinfo.pickedPoint.z))
          this.label.children[0].text = x + ', ' + z

          if (this.curentOpt !== 4) {
            return
          } 
        
          if (this.currentNet === -1) {
            return
          }

          if (this.lastPosition !== null) {
            if (this.auxline !== null) {
              this.auxline.dispose(false, true)
              this.auxline = null
            }
            if (this.auxline2 !== null) {
              this.auxline2.dispose(false, true)
              this.auxline2 = null
            }

            const point = this.getGroundPosition(evt)
            this.auxline = this.createLineBetween2Points(this.lastPosition, point, 2, false)
            this.auxline2 = this.createLineBetween2Points(point, this.closestPointFromNet(point), 1, false)
          }
        }
    }))

    await this.importAssets(this.data.assets)
  },

  // add callbacks
  addCalbacks (selectComp) {
    this.calbacks.select = selectComp
  },

  // get closest point from net
  closestPointFromNet (point) {
    const ckPin = [this.clickedPin.metadata.indexPart, this.clickedPin.metadata.indexPin]
    let globalPos = BABYLON.Vector3.Zero()
    let min = 1000
    for (let i = 0; i < this.data.nets[this.currentNet].pins.length; i++) {
      if (this.data.nets[this.currentNet].pins[i][0] !== -1) {
        if (this.data.nets[this.currentNet].pins[i][0] === ckPin[0] && this.data.nets[this.currentNet].pins[i][1] === ckPin[1]) {
          continue
        }
        else {
          const pin3D = this.getPinObject(this.data.nets[this.currentNet].pins[i])
          const dist = BABYLON.Vector3.Distance(point, pin3D.getAbsolutePosition())
          if (dist < min) {
            min = dist
            globalPos = pin3D.getAbsolutePosition().clone()
          }
        }
      }
    }

    return globalPos
  },

  // create text input to display the names
  createLabel () {
    let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')

    let tooltip = new GUI.Rectangle('tooltip')
    tooltip.width = '100px'
    tooltip.height = '30px'
    tooltip.color = 'white'
    tooltip.thickness = 0
    tooltip.horizontalAlignment = 0
    tooltip.verticalAlignment = 0

    var input = new GUI.TextBlock('text')
    this._customTooltipInput(input)
    tooltip.addControl(input)

    advancedTexture.addControl(tooltip)
    return tooltip
  },

  // style input label
  _customTooltipInput (input) {
    input.height = '30px'
    input.width = '100px'
    input.maxWidth = '50px'
    input.text = ''
    input.color = 'white'
    input.horizontalAlignment = 0
    input.verticalAlignment = 0
    input.background = '#000000'
  },

  // add component holder
  addComp () {
    if (this.comp) {
      this.comp.dispose()
    }

    this.comp = BABYLON.MeshBuilder.CreateBox('rectangle', {height: 0.01, width: parseFloat(this.data.compSize[0]), depth: parseFloat(this.data.compSize[1]), sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    this.comp.material = new GridMaterial('material1', this.scene)
    this.comp.material.majorUnitFrequency = 1 
    this.comp.material.gridRatio = this.gridResolution
    this.comp.material.zOffset = 1
    this.comp.material.mainColor = BABYLON.Color3.FromHexString('#333333')
    this.comp.material.lineColor = BABYLON.Color3.FromHexString('#333333')

    this.comp.enableEdgesRendering()
    this.comp.edgesColor = new BABYLON.Color4(1,1,0,1)
    this.comp.edgesWidth = 2

    var myPoints = [
      new BABYLON.Vector3(1, 0, 0),
      new BABYLON.Vector3(-1, 0, 0),
      new BABYLON.Vector3(0, 0, 0),
      new BABYLON.Vector3(0, 1, 0),
      new BABYLON.Vector3(0, -1, 0)
    ];
    
    //Create lines 
    var lines = BABYLON.MeshBuilder.CreateLines("lines", {points: myPoints}, this.scene)
    lines.setParent(this.comp)
    lines.position = new BABYLON.Vector3(this.data.compSize[0] / 2, 0, this.data.compSize[1] / 2)
    lines.rotation = new BABYLON.Vector3(Math.PI / 2, -Math.PI / 2, 0)
    lines.renderingGroupId = 1

    const _this = this
    this.comp.actionManager = new BABYLON.ActionManager(this.scene)

    this.comp.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt) => {
        if (_this.curentOpt !== 4) {
          return
        }  
        
        if (_this.currentNet === -1) {
          return
        }

        if (_this.lastPosition !== null) {
          if (_this.auxline !== null) {
            _this.auxline.dispose(false, true)
            _this.auxline = null
          }
          if (_this.auxline2 !== null) {
            _this.auxline2.dispose(false, true)
            _this.auxline2 = null
          }

          const point = _this.getGroundPosition(evt)
          const auxline = _this.createLineBetween2Points(_this.lastPosition, point, 2, true)

          _this.addActionOnWire(auxline)
          _this.wires.push(auxline)

          const path = _this.nets[_this.currentNet].path
          path[path.length - 1].push(point)
          const width = _this.nets[_this.currentNet].width
          width[width.length - 1].push(_this.wireWidth)
          const mirror = _this.nets[_this.currentNet].mirror
          mirror[mirror.length - 1].push(_this.wireMirror)
          _this.lastPosition = point
        }
      }))

      this.comp.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, () => {
          if (_this.curentOpt !== 4) {
            return
          }  

          _this.wireMirror = !_this.wireMirror
        }))
  },

  // add grid to scene
  addBoard () {
    if (this.board) {
      this.board.dispose(false, true)
    }

    this.board = BABYLON.MeshBuilder.CreateBox('rectangle', {height: 0.01, width: parseFloat(this.gridSize), depth: parseFloat(this.gridSize), sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    this.board.position.y = -0.015
    this.board.material = new GridMaterial('material2', this.scene)
    this.board.material.majorUnitFrequency = 1 
    this.board.material.gridRatio = this.gridResolution
    this.board.material.mainColor = BABYLON.Color3.FromHexString('#525252')
    this.board.material.lineColor = BABYLON.Color3.FromHexString('#525252')
  },

  // create a line between 2 points
  createLineBetween2Points (p1, p2, type, more = false, width = null, mirror = null) {
    let height = 0.01
    const side = mirror || this.wireMirror
    const material = new BABYLON.StandardMaterial('mat', this.scene)
    switch (type) {
      case 0:
        // yellow line
        height = 0.02
        material.diffuseColor = BABYLON.Color3.Yellow()
        material.emissiveColor = BABYLON.Color3.Black()
        material.specularColor = BABYLON.Color3.Black()
        break;
      case 1:
        // white line
        height = 0.01
        material.diffuseColor = BABYLON.Color3.White()
        material.emissiveColor = BABYLON.Color3.Black()
        material.specularColor = BABYLON.Color3.Black()
        break;
      case 2:
        // red line
        height = (width !== null) ? width : this.wireWidth
        if (!side) {
          material.diffuseColor = BABYLON.Color3.Red()
        }
        else {
          material.diffuseColor = BABYLON.Color3.Blue()
        }
        material.emissiveColor = BABYLON.Color3.Black()
        material.specularColor = BABYLON.Color3.Black()
        break;
      default:
        break;
    }

    const line = BABYLON.MeshBuilder.CreatePlane('wire', {height: height, width: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    var dist = parseFloat(Number(BABYLON.Vector3.Distance(p1, p2)).toFixed(2))
    var rotAngle = Math.atan((p1.x - p2.x) / (p1.z - p2.z))
    
    line.position = BABYLON.Vector3.Center(p1, p2)
    line.position.y = 0.01
    line.rotation = new BABYLON.Vector3(Math.PI / 2, rotAngle + Math.PI / 2, 0)
    line.scaling.x = dist + ((more === true) ? 0.025 : -0.05)
    line.renderingGroupId = 1
    
    line.material = material

    if (more === true) {
      this.addActionOnWire(line)
    }

    return line
  },
  
  // 2d/3d view of selected part
  async toggle2d3d (param) {
    // import 3d objects
    if (!param) {
      if (this.objects3d.length === 0) {
        this._engine.displayLoadingUI();
        for (let i = 0; i < this.data.assets.length; i++) {
          for (let j = 0; j < this.data.assets[i].assets.length; j++) {
            await this.handleImport3dModel(this.data.assets[i].assets[j])
          }
        }
        this._engine.hideLoadingUI();
      }
      else {
        for (let i = 0; i < this.objects3d.length; i++) {
          const engineData = this.objects3d[i].metadata.engineData
          this.objects3d[i].position = new BABYLON.Vector3(engineData.transform.position[0],engineData.transform.position[1],engineData.transform.position[2])
          this.objects3d[i].rotation = new BABYLON.Vector3(engineData.transform.rotation[0]*Math.PI/180,engineData.transform.rotation[1]*Math.PI/180,engineData.transform.rotation[2]*Math.PI/180)
        
          if (engineData.transform.best_p[3] !== 0) {
            this.objects3d[i].position.y = -engineData.transform.position[1] -0.01
            this.objects3d[i].rotation.x += Math.PI
          }
          this.objects3d[i].setEnabled(true)
        }
      }

      this.comp.material.mainColor = BABYLON.Color3.FromHexString('#00dd00')
      this.comp.material.lineColor = BABYLON.Color3.FromHexString('#00dd00')

      this.board.isVisible = false
      this.scene.activeCamera.upperAlphaLimit = this.scene.activeCamera.lowerAlphaLimit = null
      this.scene.activeCamera.upperBetaLimit = this.scene.activeCamera.lowerBetaLimit = null
    }
    else {
      for (let i = 0; i < this.objects3d.length; i++) {
        this.objects3d[i].setEnabled(false)
      }

      this.comp.material.mainColor = BABYLON.Color3.FromHexString('#333333')
      this.comp.material.lineColor = BABYLON.Color3.FromHexString('#333333')

      this.board.isVisible = true
      this.scene.activeCamera.upperAlphaLimit = this.scene.activeCamera.lowerAlphaLimit = this.scene.activeCamera.alpha = Math.PI / 2
      this.scene.activeCamera.upperBetaLimit = this.scene.activeCamera.lowerBetaLimit = this.scene.activeCamera.beta = 0
    }
  },

  // show/hide grid
  toggleGrid (param) {
    if (param) {
      this.comp.material.lineColor = new BABYLON.Color3(1, 1, 1)
    }
    else {
     this.comp.material.lineColor = BABYLON.Color3.FromHexString('#333333')
    }
  },

  // import data from indexDB, on init engine
  async importAssets (engineData) {
    if (engineData.length === 0) {
      this.completlyLoaded = true
      return
    }
    // console.log(JSON.stringify(engineData))
    for (let i = 0; i < engineData.length; i++) {
      console.log('%c importModel from indexDB', 'background: #222; color: #bada55', engineData[i].assets)

      const comp = new BABYLON.Mesh.CreatePlane('comp', 1, this.scene)
      comp.rotation.x = Math.PI / 2
      comp.isVisible = this.compEnabled
      comp.scaling = new BABYLON.Vector3(engineData[i].compSize[0], engineData[i].compSize[1], 1)
      
      var mat1 = new BABYLON.PBRMaterial('mat' + i, this.scene)
      mat1.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND
      var textureGround = new BABYLON.DynamicTexture("dt" + i, {width: engineData[i].compSize[0] * 16, height: engineData[i].compSize[1] * 16}, this.scene) 
      textureGround.hasAlpha = true
      var textureContext = textureGround.getContext()
      
      textureContext.rect(0, 0, engineData[i].compSize[0] * 16, engineData[i].compSize[1] * 16)
      textureContext.fillStyle = "transparent"
      textureContext.fill()
      textureContext.lineWidth = 10
      textureContext.strokeStyle = "white"
      textureContext.stroke()
      
      textureGround.update()
      mat1.albedoTexture = textureGround
      mat1.metallic = 0
      mat1.roughness = 1
      comp.material = mat1

      engineData[i].transform.pivot = [engineData[i].compSize[0]/2, engineData[i].compSize[1]/2]
      comp.metadata = engineData[i]
      const _this = this
      comp.actionManager = new BABYLON.ActionManager(this.scene)

      // left click on body
      comp.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, async (evt) => {
          const _thism = evt.source
          if (!_this.compEnabled) {
            return
          }
          if (evt.sourceEvent.button === 0) {
            switch (_this.curentOpt) {

              case 0:
                _this.selected = _thism
                var startingPoint = _this.getGroundPosition(evt)
                if (!_this._observer) {
                  _this._observer = _this.scene.onPointerObservable.add((evt) => {
                    if (!startingPoint) return
                    var current = _this.getGroundPosition(evt)
                    if (!current) return
        
                    var diff = current.subtract(startingPoint)
                    _this.selected.position.addInPlace(diff)
                    startingPoint = current
        
                    // recreate routes if has routes - todo
                    _this.updateWires()
                  }, BABYLON.PointerEventTypes.POINTERMOVE)
                }
                
                _this.scene.activeCamera.detachControl(_this.canvas)
                break;

              case 1:
                _this.selected = _thism
                _this.selected.rotation.y = ((_this.selected.rotation.y + Math.PI / 2) % (2 * Math.PI))

                var pivot = _this.selected.metadata.transform.pivot
                var rotation = [_this.selected.rotation.x, _this.selected.rotation.y, _this.selected.rotation.z]
                var position = _this.selected.metadata.engineData.transform.position
                var pos = this.setPositionByPivot({'position': position, 'pivot': pivot, 'rotation': rotation})
              
                if (pos[0] < 0 || pos[1] < 0 || pos[0] > this.data.compSize[0] || pos[1] > this.data.compSize[1]) {
                  _this.selected.rotation.y -= Math.PI / 2
                  console.log('intra in if')
                  return
                }

                _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, _this.selected.rotation.x])

                // recreate routes if has routes
                _this.selected.computeWorldMatrix(true)
                _this.updateWires()
                break;

              case 2:
                _this.selected = _thism
                var rot = (_this.selected.metadata.engineData.transform.best_p[3] === 0) ? Math.PI : 0

                if (_this.selected.metadata.engineData.transform.thole) {
                  _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, rot])
                  return
                }

                var kids = _this.selected.getChildren()
                if (rot === 0) {
                  for (let j = 0; j < kids.length; j++) {
                    for (let i = 0; i < kids[j].pins.length; i++) {
                      kids[j].pins[i].material.albedoColor = BABYLON.Color3.Red()
                    }
                  }
                }
                else {
                  for (let j = 0; j < kids.length; j++) {
                    for (let i = 0; i < kids[j].pins.length; i++) {
                      kids[j].pins[i].material.albedoColor = BABYLON.Color3.Blue()
                    }
                  }
                }
                _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, rot])
                break;

              default:
                break;
            }
          }
      }))

      comp.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (evt) => {
          if (!_this.compEnabled) {
            return
          }
          if (evt.sourceEvent.button === 0) {
            if (_this.curentOpt === 0) {
              // if it is outside of part keep link it on mouse 
              const pivot = _this.selected.metadata.transform.pivot
              const rotation = _this.selected.rotation
              const position = [_this.selected.position.x, _this.selected.position.y, _this.selected.position.z]
              const pos = this.setPositionByPivot({'position': position, 'pivot': pivot, 'rotation': rotation})
              if (pos[0] < 0 || pos[1] < 0 || pos[0] > this.data.compSize[0] || pos[1] > this.data.compSize[1]) {
                return
              }
              
              _this.scene.onPointerObservable.remove(_this._observer)
              _this._observer = null
              _this.scene.activeCamera.attachControl(_this.canvas, false)
              
              // update indexDB data
              // _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, _this.selected.rotation.x])
            
              // recreate routes if has routes - todo
              _this.updateWires()
            }
          }
      }))

      this.components.push(comp)
      await this.import3dModel(engineData[i].assets, comp)

      comp.position = new BABYLON.Vector3(this.data.compSize[0] / 2 - engineData[i].transform.pivot[0] - engineData[i].transform.pos_d[0], 0.05, this.data.compSize[1] / 2 - engineData[i].transform.pivot[1] - engineData[i].transform.pos_d[1])
      comp.rotation.y = engineData[i].transform.pos_d[2] * Math.PI / 2
    }
    

    this.updateWires()  
    
    this.completlyLoaded = true
  },

  // create yellow wires based on schematic nets
  createRandomNets () {
    for (let i = 0; i < this.auxwires.length; i++) {
      for (let j = 0; j < this.auxwires[i].length; j++) {
        this.auxwires[i][j].dispose(false, true)
      }
    }

    this.auxwires = []
    for (let i = 0; i < this.data.nets.length; i++) {
      this.auxwires.push([])
      for (let j = 0; j < this.data.nets[i].pins.length; j++) {
        if (this.data.nets[i].pins[j][0] !== -1) {
          const getPin1 = this.getPointFromPin(this.data.nets[i].pins[j])
          
          if (this.data.nets[i].pins[j + 1]) {
            const getPin2 = this.getPointFromPin(this.data.nets[i].pins[j + 1])

            const line = this.createLineBetween2Points(getPin1, getPin2, 0, false)
            line.metadata = {
              pins: [this.data.nets[i].pins[j], this.data.nets[i].pins[j + 1]]
            }

            this.auxwires[i].push(line)
          }
        }
      }
    }

    // create yellow wire between components
    this.createRandomNetBetweenComp()
  },

  createRandomNetBetweenComp () {
    for (let i = 0; i < this.electData.PartToPart2.length; i++) {
      var p1 = null
      var p2 = null
      for (let j = 0; j < this.electData.PartToPart2[i].length; j+=3) {
        const getcompFromData = this.components[this.electData.PartToPart2[i][j]]
        const kids = getcompFromData.getChildren()
        const getPartData = kids[this.electData.PartToPart2[i][j+1]]

        if (getPartData && getPartData.pins) {
          for (let k = 0; k < getPartData.pins.length; k++) {
            if (getPartData.pins[k].metadata && getPartData.pins[k].metadata.indexPin === this.electData.PartToPart2[i][j+2]) {
              // console.log('pinn ', getPartData.pins[k])
              getPartData.pins[k].computeWorldMatrix(true)
              if (p1 === null) {
                p1 = getPartData.pins[k].getAbsolutePosition()
              }
              else {
                p2 = getPartData.pins[k].getAbsolutePosition()
              }
              break;
            }
          }
        } 
        if (p2) {
          break
        }
      }

      if (p1 !== null && p2 !== null) {
        const line = this.createLineBetween2Points(p1, p2, 0, false)
        line.metadata = {
          pins: [-1,-1]
        }
        this.auxwires.push([line])
      }
    }
  },
 
  // create real routing data
  recreateNets () {
    for (let i = 0; i < this.wires.length; i++) {
      for (let j = 0; j < this.wires[i].length; j++) {
        this.wires[i][j].dispose(false, true)
      }
    }

    this.wires = []
    for (let i = 0; i < this.nets.length; i++) {
      for (let j = 0; j < this.nets[i].path.length; j++) {
        for (let k = 0; k < this.nets[i].path[j].length - 1; k++) {
          const p1 = new BABYLON.Vector3(this.nets[i].path[j][k].x, this.nets[i].path[j][k].y, this.nets[i].path[j][k].z)
          
          if (this.nets[i].path[j][k+1]) {
            const p2 = new BABYLON.Vector3(this.nets[i].path[j][k+1].x, this.nets[i].path[j][k+1].y, this.nets[i].path[j][k+1].z)
            const line = this.createLineBetween2Points(p1, p2, 2, true, this.nets[i].width[j][k], this.nets[i].mirror[j][k])
            this.wires.push(line)
          }
        }
      }
    }
  },

  // import function
  // engineData from db
  async import3dModel (engineData, comp) {
    this._engine.displayLoadingUI();

    console.log('engineData on import ', engineData)
    let uniqueId = BABYLON.Tools.RandomId()
    if (isArray(engineData)) {
      for (let i = 0; i < engineData.length; i++) {
        let cuniqueId = BABYLON.Tools.RandomId()
        let pUniqueId
        if (Object.keys(this.objects).length !== 0) {
          pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
        }
        else {
          pUniqueId = uniqueId
          this.objects[pUniqueId] = {}
        }
        
        this.objects[pUniqueId][cuniqueId] = engineData[i]
        await this.handleImport(engineData[i], [cuniqueId, pUniqueId], comp)
      }
    }
    else {
      let pUniqueId
      if (Object.keys(this.objects).length !== 0) {
        pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
      }
      else {
        pUniqueId = uniqueId
        this.objects[pUniqueId] = {}
      }
      

      this.objects[pUniqueId][uniqueId] = engineData
      await this.handleImport(engineData, [uniqueId, pUniqueId], comp)
    }

    this._engine.hideLoadingUI();
  },

  // get index of property in object
  getIndexOfPorp (obj, prop) {
    let j = 0
    for (let k in obj) {
      if (k === prop) {
        console.log(j, ' part id ', k)
        break
      }
      j++
    }
    return j
  },

  // import 3d object in scene
  // engineData from db
  // ids - generated ids onload used to link 3d object with engine data
  async handleImport (engineData, ids, comp) {
    const decode = await attachImgToId(engineData.design, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      const meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      console.log(meshes)
      if (meshes.length === 0) {
        console.log('Error on import, empty mesh or wrong data to import')
        return
      } 

      meshes[0].metadata = { 
        engineData: engineData,
        id: ids[0], 
        id1: ids[1], 
        id2: ids[2] 
      }
    
      console.log(engineData.transform)
      meshes[0].position = new BABYLON.Vector3(engineData.transform.position[0], 0.01, engineData.transform.position[2])
      meshes[0].rotation = new BABYLON.Vector3(0, engineData.transform.rotation[1]  * Math.PI / 180, 0)
      meshes[0].setParent(comp)
      meshes[0].comp = comp

      // do settings related to imported part
      meshes[0].body = null
      meshes[0].pins = []
      meshes[0].nick = null

      for (let i = 0; i < meshes.length; i++) {
        if (meshes[i].name.toLowerCase().indexOf('dn_body') !== -1) {
          meshes[0].body = meshes[i]
        }
        else {
          if (meshes[i].name.toLowerCase().indexOf('dn_pin') !== -1) {
            meshes[0].pins.push(meshes[i])
          }
          else {
            if (meshes[i].name.toLowerCase().indexOf('dn_name') !== -1) {
              meshes[0].nick = meshes[i]
            }
          }
        }
      }

      // make body clickable
      if (meshes[0].body) {
        this.setBody(meshes[0])
      }

      // make pins clickable
      if (meshes[0].pins.length !== 0) {
        for (let i = 0; i < meshes[0].pins.length; i++) {
          this.setPins(meshes[0].pins[i])
        }
      }

      // update text on nickname plane
      if (meshes[0].nick) {
        this.updateNick(meshes[0].nick, meshes[0].metadata.engineData.name2d)
      }

      console.log(meshes[0])
    }
  },

  // update nickname text
  updateNick (mesh, value) {
    if (mesh.material.albedoTexture) {
      delete mesh.material.albedoTexture
    }

    const dim = mesh.getBoundingInfo().boundingBox.extendSizeWorld
    mesh.material.albedoTexture = new DrawText(this.scene, value, {
      color: '#000000',
      background: '#ffffff',
      invertY: true,
      font: 0,
      rotation: -Math.PI / 2,
      scaling: [dim.x, dim.z]
    }, true)
  },

  // setting pins, clickable
  setPins (pin) {
    const main = pin.parent.parent

    if (main.metadata.engineData.transform.thole) {
      pin.material.albedoColor = BABYLON.Color3.Green()
    }
    else {
      if (main.metadata.engineData.transform.best_p[3] === 0) {
        pin.material.albedoColor = BABYLON.Color3.Red()
       }
       else {
         pin.material.albedoColor = BABYLON.Color3.Blue()
       }
    }

    const indexOfPart = this.getIndexOfPorp(this.objects[main.metadata.id1], main.metadata.id)
    const split = pin.name.split('_')
    const scPiNnEEDIncrement = parseInt(split[split.length - 1].trim())
    pin.metadata = { 
      indexPin: scPiNnEEDIncrement,
      indexPart: indexOfPart
    }      

    for (let i = 0; i < this.data.nets.length; i++) {
      for (let j = 0; j < this.data.nets[i].pins.length; j++) {
        if (this.data.nets[i].pins[j][0] === parseInt(pin.metadata.indexPart) && this.data.nets[i].pins[j][1] === parseInt(pin.metadata.indexPin)) {
          pin.metadata = Object.assign({}, pin.metadata, {'net': i})
        }
      }
    }

    const _this = this
    pin.actionManager = new BABYLON.ActionManager(this.scene)

    // show pin index on hover
    pin.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
      _this.togglePinIndex(pin, true)
    }))
    pin.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
      _this.togglePinIndex(pin, false)
    }))

    pin.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, () => {
        _this.checkPinStatus(pin)  
    }))
  },

  // function used to add pin to net, remove pin from net, merge net
  checkPinStatus (pin) {
    if (this.curentOpt !== 4) {
      return
    }      

    if (!pin.metadata.hasOwnProperty('net')) {
      return
    }

    this.currentNet = pin.metadata.net

    if (this.lastPosition === null) {
      // hightlight pins from the same net
      for (let i = 0; i < this.data.nets[pin.metadata.net].pins.length; i++) {
        if (this.data.nets[pin.metadata.net].pins[i][0] !== -1) {
          const getPin = this.getPinObject(this.data.nets[pin.metadata.net].pins[i])
          getPin.material.emissiveColor = BABYLON.Color3.White()
        }
      }
    }
    else {
      // remove hightlight from pins
      for (let i = 0; i < this.data.nets[pin.metadata.net].pins.length; i++) {
        if (this.data.nets[pin.metadata.net].pins[i][0] !== -1) {
          const getPin = this.getPinObject(this.data.nets[pin.metadata.net].pins[i])
          getPin.material.emissiveColor = BABYLON.Color3.Black()
        }
      }
    }

    if (this.lastPosition !== null) {
      console.log("click on pin after I already have a net")
      
      // on end
      const point = pin.getAbsolutePosition()

      if (this.auxline !== null) {
        this.auxline.dispose(false, true)
        this.auxline = null
      }
      if (this.auxline2 !== null) {
        this.auxline2.dispose(false, true)
        this.auxline2 = null
      }

      const auxline = this.createLineBetween2Points(this.lastPosition, point, 2, true)
      this.addActionOnWire(auxline)

      this.wires.push(auxline)

      const path = this.nets[this.currentNet].path
      path[path.length - 1].push(point)
      this.nets[this.currentNet].pins.push([pin.metadata.indexPart, pin.metadata.indexPin])
      const width = this.nets[this.currentNet].width
      width[width.length - 1].push(this.wireWidth)
      const mirror = this.nets[this.currentNet].mirror
      mirror[mirror.length - 1].push(this.wireMirror)
      this.lastPosition = null
    }
    else {
      console.log("click on pin for the first time")
      this.lastPosition = pin.getAbsolutePosition()
      
      // add more
      if (!this.nets[this.currentNet]) {
        this.nets[this.currentNet] = {
          pins: [],
          path: [],
          width: [],
          mirror: []
        }
      }
      
      this.clickedPin = pin
      this.nets[this.currentNet].pins.push([pin.metadata.indexPart, pin.metadata.indexPin])
      this.nets[this.currentNet].path.push([this.lastPosition])
      this.nets[this.currentNet].width.push([])
      this.nets[this.currentNet].mirror.push([])
    }

    return
    // first time click on this pin
    /*if (!pin.metadata.hasOwnProperty('net')) {
      console.log('click on pin after I already build a net')

      if (this.lastPosition !== null) {
        // on end
        const point = pin.getAbsolutePosition()

        if (this.auxline !== null) {
          this.auxline.dispose(false, true)
          this.auxline = null
        }

        const pos = point
        let auxPoint = pos.clone()
        if (this.drawOpt) {
          auxPoint.x = this.lastPosition.x
        }
        else {
          auxPoint.z = this.lastPosition.z
        }

        const l1 = this.createLineBetween2Points(this.lastPosition, auxPoint, 2, true)
        const l2 = this.createLineBetween2Points(auxPoint, pos, 1, true)

        const auxline = BABYLON.Mesh.MergeMeshes([l1,l2], true)
        this.addActionOnWire(auxline)
        this.wires.push(auxline)

        const path = this.nets[this.currentNet].path
        path[path.length - 1].push(auxPoint, pos)
        this.nets[this.currentNet].pins.push([pin.metadata.indexPart, pin.metadata.indexPin])
        this.lastPosition = null
      }
      else {
        console.log('click on pin first, nothing build before')

        // set curentNet which is the length of nets array
        this.currentNet = this.nets.length

        // save last point clicked which is position of clicked pin
        this.lastPosition = pin.getAbsolutePosition()

        // add new net object 
        this.nets.push({
          name: 'Net ' + this.nets.length,
          path: [[this.lastPosition.clone()]],
          pins: [[pin.metadata.indexPart, pin.metadata.indexPin]]
        })
      }

       // set net to pin metadata
       if (pin.metadata.hasOwnProperty('net')) {
        pin.metadata.net = this.currentNet
      }
      else {
        pin.metadata = Object.assign({}, pin.metadata, {'net': this.currentNet})
      }
    }
    else {
      if (pin.metadata.net !== this.currentNet) {
        console.log("click on pin which already have a net different from curent net")
        if (this.lastPosition !== null) {
          console.log("click on pin after I already build a net")
          if (confirm('Do you want to merge curent net ' + this.nets[this.currentNet].name + ' to net ' + this.nets[pin.metadata.net].name)) {
            console.log("merge curent net")        
          }
        }
        else {
          console.log("click on pin for first time")

          this.currentNet = pin.metadata.net

          // save last point clicked which is position of clicked pin
          const point = pin.getAbsolutePosition()

          const path = this.nets[this.currentNet].path
          path.push([point])

          this.lastPosition = point
        }
      }
      else {
        console.log("click on pin which is in the same net")
        
        if (this.lastPosition !== null) {
          console.log("click on pin after I already build a net")

          // save last point clicked which is position of clicked pin
          const point = pin.getAbsolutePosition()

          if (this.auxline !== null) {
            this.auxline.dispose(false, true)
            this.auxline = null
          }
  
          const pos = point
          let auxPoint = pos.clone()
          if (this.drawOpt) {
            auxPoint.x = this.lastPosition.x
          }
          else {
            auxPoint.z = this.lastPosition.z
          }

          const l1 = this.createLineBetween2Points(this.lastPosition, auxPoint, 2, true)
          const l2 = this.createLineBetween2Points(auxPoint, pos, 1, true)

          const auxline = BABYLON.Mesh.MergeMeshes([l1,l2], true)
          this.addActionOnWire(auxline)
          this.wires.push(auxline)

          const path = this.nets[this.currentNet].path
          path[path.length - 1].push(auxPoint, pos)
          
          this.lastPosition = null
        }
        else {
          console.log("click on pin for first time")

          // save last point clicked which is position of clicked pin
          const point = pin.getAbsolutePosition()

          const path = this.nets[this.currentNet].path
          path.push([point])

          this.lastPosition = point
        }
      }
    }*/
  },

  // add action on created wire
  addActionOnWire (line) {
    line.metadata = {
      'net': this.currentNet,
      'width': this.wireWidth,
      'mirror': this.wireMirror
    }

    const _this = this
    line.actionManager = new BABYLON.ActionManager(this.scene)

    // left click on body
    line.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, async (evt) => {
        console.log(evt)
        switch (_this.curentOpt) {
          case 3:
            if (confirm('Do you want to remove this net?')) {
              const curent = evt.source.metadata.net

              // remove 3d objects
              for (let i = _this.wires.length - 1; i >=0; i--) {
                if (_this.wires[i].hasOwnProperty('metadata')) {
                  if (_this.wires[i].metadata.net === evt.source.metadata.net) {
                    _this.wires[i].dispose(false, true)
                    _this.wires.splice(i, 1)
                  }
                }
              }

              // remove net data from pins
              // decrease net index on other pins
              for (let i = 0; i < _this.nets[curent].pins.length; i++) {
                const indPart = _this.nets[curent].pins[i][0]
                const indPin = _this.nets[curent].pins[i][1]
                for (let j = 0; j < _this.scene.meshes.length; j++) {
                  if (_this.scene.meshes[j].metadata && _this.scene.meshes[j].metadata.hasOwnProperty('indexPart') && _this.scene.meshes[j].metadata.hasOwnProperty('indexPin')) {
                    if (_this.scene.meshes[j].metadata.indexPart === indPart && _this.scene.meshes[j].metadata.indexPin === indPin) {
                      delete _this.scene.meshes[j].metadata.net
                    }
                  }
                  if (_this.scene.meshes[j].metadata && _this.scene.meshes[j].metadata.hasOwnProperty('net')) {
                    if (_this.scene.meshes[j].metadata.net > curent) {
                      _this.scene.meshes[j].metadata.net -= 1
                    }
                  }
                }
              }

              // remove net data
              _this.nets.splice(curent, 1)
              _this.currentNet = _this.nets.length - 1
            }
            break;

          case 4:
            // _this.selected = evt.source
            // _this.label.children[0].text = _this.nets[evt.source.metadata.net].name
            // _this.label.isVisible = true
            break;

          case 5:
            // already have a net
            if (_this.lastPosition !== null) {
              // already have a net
              if (evt.source.metadata.net === _this.currentNet) {
                // click on wire from the same net

                if (_this.auxline !== null) {
                  _this.auxline.dispose(false, true)
                  _this.auxline = null
                }

                const pos = _this.getGroundPosition(evt)
                let auxPoint = pos.clone()
                if (_this.drawOpt) {
                  auxPoint.x = _this.lastPosition.x
                }
                else {
                  auxPoint.z = _this.lastPosition.z
                }

                const l1 = _this.createLineBetween2Points(_this.lastPosition, auxPoint, 2, true)
                const l2 = _this.createLineBetween2Points(auxPoint, pos, 1, true)

                const auxline = BABYLON.Mesh.MergeMeshes([l1,l2], true)
                _this.addActionOnWire(auxline)
                _this.wires.push(auxline)

                const path = _this.nets[_this.currentNet].path
                path[path.length - 1].push(auxPoint, pos)
                _this.lastPosition = null
              }
              else {
                // click on wire from different net
                console.log('merge nets')
                if (confirm('Do you want to merge curent net ' + _this.nets[_this.currentNet].name + ' to net ' + _this.nets[evt.source.metadata.net].name)) {
                  console.log('merge curent net')
                }
              }
            }
            else {
              // begin a new net with this click

              // set curentNet from clicked wire
              _this.currentNet = evt.source.metadata.net

              // store clicked point
              _this.lastPosition = _this.getGroundPosition(evt)

              // create a new array for path
              const path = _this.nets[_this.currentNet].path
              path.push([_this.lastPosition.clone()])
            }
            break;
          
          case 6:
            var net = evt.source.metadata.net
            for (let i = 0; i < _this.wires.length; i++) {
              if (_this.wires[i].metadata && _this.wires[i].metadata.hasOwnProperty('net') && _this.wires[i].metadata.net === net) {
                _this.wires[i].overlayColor = new BABYLON.Color3(1, 1, 0)
                _this.wires[i].renderOverlay = true
              }
              else {
                _this.wires[i].renderOverlay = undefined
              }
            }
            break;

          default:
            break;
        }
    }))
  },

  getPinObject (pinData) {
    let pin = null
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.hasOwnProperty('indexPin')) {
        if (parseInt(this.scene.meshes[i].metadata.indexPin) === pinData[1] && parseInt(this.scene.meshes[i].metadata.indexPart) === pinData[0]) {
          pin = this.scene.meshes[i]
          break
        }
      }
    }

    return pin
  },

  // change wire width
  changeWireWidth (param) {
    this.wireWidth = parseFloat(param)
  },

  // show toggle pin index
  togglePinIndex (pin, visible) {
    const scene = this.scene
    const split = pin.name.split('_')
    let pinIndex = split[split.length - 1]

    if (visible) {
      const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', { width: 30, height: 30 }, scene, true)
      dynamicTexture.drawText(pinIndex, 5, 20, 'bold 20px Arial', 'white', 'black', true, true)

      const plane = BABYLON.MeshBuilder.CreatePlane('billboard', { height: 1, width: 1 }, scene, true)
      plane.scaling = new BABYLON.Vector3(0.25,0.25,0.25)
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
  },

  changeComp (param) {
    this.compEnabled = param
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].isVisible = this.compEnabled
    }
  },

  // set comp size
  changeCompSize (dims) {
    this.data.compSize = [parseInt(dims[0]), parseInt(dims[1])]
    this.addComp()
  },

  // setting body, clickable
  setBody(mesh) {
    const main = mesh
    const collider = main.body

    const _this = this
    collider.actionManager = new BABYLON.ActionManager(this.scene)

    // left click on body
    collider.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, async (evt) => {
        const _thism = evt.source.parent.parent
        if (_this.compEnabled) {
          return
        }
        if (evt.sourceEvent.button === 0) {
          switch (_this.curentOpt) {

            case 0:
              _this.selected = _thism
              _this.selected.rot = _this.selected.rotation.clone()
              _this.selected.setParent(null)
              var startingPoint = _this.getGroundPosition(evt)
              if (!_this._observer) {
                _this._observer = _this.scene.onPointerObservable.add((evt) => {
                  if (!startingPoint) return
                  var current = _this.getGroundPosition(evt)
                  if (!current) return
      
                  var diff = current.subtract(startingPoint)
                  _this.selected.position.addInPlace(diff)
                  startingPoint = current
      
                  // recreate routes if has routes - todo
                  _this.updateWires()
                }, BABYLON.PointerEventTypes.POINTERMOVE)
              }
              
              _this.scene.activeCamera.detachControl(_this.canvas)
              break;

            case 1:
              _this.selected = _thism
              _this.selected.setParent(null)
              _this.selected.rotation.y = ((_this.selected.rotation.y + Math.PI / 2) % (2 * Math.PI))

              var pivot = _this.selected.metadata.engineData.transform.pivot
              var rotation = [_this.selected.rotation.x, _this.selected.rotation.y, _this.selected.rotation.z]
              var position = _this.selected.metadata.engineData.transform.position
              var pos = this.setPositionByPivot({'position': position, 'pivot': pivot, 'rotation': rotation})
            
              if (pos[0] < 0 || pos[1] < 0 || pos[0] > this.data.compSize[0] || pos[1] > this.data.compSize[1]) {
                _this.selected.rotation.y -= Math.PI / 2
                console.log('intra in if')
                return
              }

              _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, _this.selected.rotation.x])
              
              // recreate routes if has routes
              _this.selected.computeWorldMatrix(true)
              _this.updateWires()
              _this.selected.setParent(_this.selected.comp)
              break;

            case 2:
              _this.selected = _thism
              var rot = (_this.selected.metadata.engineData.transform.best_p[3] === 0) ? Math.PI : 0

              if (_this.selected.metadata.engineData.transform.thole) {
                _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, rot])
                return
              }

              if (rot === 0) {
                for (let i = 0; i < _this.selected.pins.length; i++) {
                  _this.selected.pins[i].material.albedoColor = BABYLON.Color3.Red()
                }
               }
               else {
                for (let i = 0; i < _this.selected.pins.length; i++) {
                  _this.selected.pins[i].material.albedoColor = BABYLON.Color3.Blue()
                }
               }
              _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, rot])
              break;

            default:
              break;
          }
        }
    }))

    collider.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, (evt) => {
        if (_this.compEnabled) {
          return
        }
        if (evt.sourceEvent.button === 0) {
          if (_this.curentOpt === 0) {
            // if it is outside of part keep link it on mouse 
            const pivot = _this.selected.metadata.engineData.transform.pivot
            const rotation = _this.selected.metadata.engineData.transform.rotation
            const position = [_this.selected.position.x, _this.selected.position.y, _this.selected.position.z]
            const pos = this.setPositionByPivot({'position': position, 'pivot': pivot, 'rotation': rotation})
            if (pos[0] < 0 || pos[1] < 0 || pos[0] > this.data.compSize[0] || pos[1] > this.data.compSize[1]) {
              return
            }
            
            _this.scene.onPointerObservable.remove(_this._observer)
            _this._observer = null
            _this.scene.activeCamera.attachControl(_this.canvas, false)
            
            // update indexDB data
            _this.updateDataToIndexDB([_this.selected.position.x, _this.selected.position.z, _this.selected.rotation.y, _this.selected.rotation.x])
          
            _this.selected.setParent(_this.selected.comp)
            _this.selected.rotation = _this.selected.rot
            
            setTimeout(()=>{
              // _this.recalculateDim()

              // recreate routes if has routes - todo
              _this.updateWires()
            }, 100)
            
          }
        }
    }))
  },

  recalculateDim () {
    const parent = this.selected.comp
    const bnds = parent.getHierarchyBoundingVectors(true)
    // console.log(bnds)
    const pos = BABYLON.Vector3.Center(bnds.max, bnds.min)
    // console.log(pos)
    let scaling = new BABYLON.Vector3(0,0,0)
    bnds.max.subtractToRef(bnds.min, scaling)
    // console.log(scaling)
/*
    const box1 = new BABYLON.Mesh.CreateBox('min', 1, this.scene)
    box1.position = bnds.min

    const box2 = new BABYLON.Mesh.CreateBox('max', 1, this.scene)
    box2.position = bnds.max

    const box3 = new BABYLON.Mesh.CreateBox('pos', 1, this.scene)
    box3.position = pos
*/
    const kids = parent.getChildren()
    for(let i = 0; i < kids.length; i++) {
      kids[i].setParent(null)
    }

    parent.position = pos
    parent.position.y = 0.01
    parent.scaling = new BABYLON.Vector3(parseInt(scaling.x), parseInt(scaling.z), 1)

    for(let i = 0; i < kids.length; i++) {
      kids[i].setParent(parent)
    }
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
  updateDataToIndexDB (value) {
    const data = this.getMeshEngineData()
    // console.log(data, this.selected, this.selected.metadata, this.objects)
    data.transform.position = [value[0], data.transform.position[1], value[1]]
    data.transform.rotation = [data.transform.rotation[0], value[2] * 180 / Math.PI, data.transform.rotation[2]]
    
    const bp = [0,0,0,0]
    if (value[3] !== 0) {
      bp[3] = 1
    }
    bp[2] = parseInt(value[2] / (Math.PI / 2)) % 4

    const posCoords = this.setPositionByPivot(data.transform)
    bp[0] = posCoords[0]
    bp[1] = posCoords[1]
  
    data.transform.best_p = bp
  },
  
  setPositionByPivot (transform) {
    let diff = [this.data.compSize[0] / 2, this.data.compSize[1] / 2]
    if (transform['rotation'][1] % 180 === 0) {
      diff = [this.data.compSize[0] / 2 + transform['pivot'][0], this.data.compSize[1] / 2 + transform['pivot'][1]]
    }
    else {
      diff = [this.data.compSize[0] / 2 + transform['pivot'][1], this.data.compSize[1] / 2 + transform['pivot'][0]]
    }
    return [-(transform['position'][0] - diff[0]), -(transform['position'][2] - diff[1])]
  },

  // send data to be saved to indexDB
  getData () {
    let data = []
    // console.log(this.objects)
    for (let key in this.objects) {
      if (key === 'indexDBId') continue
      for(let key2 in this.objects[key]) {
        if (key2 === 'indexDBId') continue
        data.push(this.objects[key][key2])
      }       
    }

    // console.log(PartToPart, ComponentToParts)
    // console.log(routes, this.completlyLoaded, data)

    if (this.completlyLoaded) {
      this.data.routing = this.nets
      this.data.assets = data
    }

    /*console.log(JSON.stringify({
      nets: this.data.nets,
      routing: this.data.routing,
      assets: this.data.assets,
      compSize: this.data.compSize,
      electData: this.electData
    }))*/
    return {
      nets: this.data.nets,
      routing: this.data.routing,
      assets: this.data.assets,
      compSize: this.data.compSize,
      electData: this.electData
    }
  },

  // recalibrate camera to default settings
  toDefaultCameraSetting () {
    this.scene.activeCamera.alpha = Math.PI / 2
    this.scene.activeCamera.beta = 0
    this.scene.activeCamera.radius = 10
    this.scene.activeCamera.target = BABYLON.Vector3.Zero()
  },

  getCompDimensions () {
    let partInScene = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.hasOwnProperty('id')) {
        partInScene.push(this.scene.meshes[i])
      }
    }

    if (partInScene.length === 0) {
      return [20, 20]
    }

    const parent = new BABYLON.AbstractMesh('parent', this.scene)
    for (let i = 0; i < partInScene.length; i++) {
      partInScene[i].setParent(parent)
    }

    const bnds = parent.getHierarchyBoundingVectors(true)
    const positions = BABYLON.Vector3.Center(bnds.max, bnds.min)
    let scaling = new BABYLON.Vector3(0,0,0)
    bnds.max.subtractToRef(bnds.min, scaling)

    for (let i = 0; i < partInScene.length; i++) {
      partInScene[i].setParent(null)
    }
    parent.dispose()

    return [[parseFloat(Number(positions.x).toFixed(1)), parseFloat(Number(positions.z).toFixed(1))], [parseFloat(Number(scaling.x).toFixed(1)), parseFloat(Number(scaling.z).toFixed(1))]]
  },

  getObjectToBeSaved () {
    const tobesaved = Object.assign({}, this.data)
    delete tobesaved.assets

    return {
      engine: this.data.assets,
      custom: tobesaved,
      data: this.electData,
    }
  },

  // change grid resolution
  changeResolution (param) {
    this.gridResolution = parseFloat(param / 100)

    this.addComp()
  },

  // used on dragging
  getGroundPosition () {
    var _that = this
    var pickinfo = _that.scene.pick(_that.scene.pointerX, _that.scene.pointerY, function (mesh) { return mesh === _that.board })

    const x = _that.snapToGrip(parseFloat(pickinfo.pickedPoint.x))
    const z = _that.snapToGrip(parseFloat(pickinfo.pickedPoint.z))
    // this.label.children[0].text = x + ', ' + z
    if (pickinfo.hit) {
      return new BABYLON.Vector3(x, 0, z)
    }
      return null
  },

  // snap on both sides
  snapToGrip (val) {
    return parseFloat((this.gridResolution * Math.round(val / this.gridResolution)).toFixed(2));
  },

  // return position of pin with index
  getPointFromPin (arrayData) {
    const indexOfPart = arrayData[0]
    const indexOfPin = arrayData[1]
    let pin
    
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata) {
        if (parseInt(this.scene.meshes[i].metadata.indexPin) === indexOfPin && parseInt(this.scene.meshes[i].metadata.indexPart) === indexOfPart) {
          pin = this.scene.meshes[i]
          break
        }
      }
    }
    
    // console.log(pin)
    if (pin) {
      return pin.getAbsolutePosition()
    }
    else {
      return BABYLON.Vector3.Zero()
    }
  },
 
  // recreate wires on edit component/ refresh page
  recreateWires () {
   
  },

  // update wires on replace part, onmove part
  updateWires () {
    this.createRandomNets()
    this.recreateNets()
  },

  updatePlacement (data = null) {
    if ( data !== null) {
      this.changeCompSize([data.grid_x, data.grid_y])

      const pos = data.best_placement
      for(let i =0; i < this.components.length;i++) {
        this.components[i].position = new BABYLON.Vector3(this.data.compSize[0] / 2 - this.components[i].metadata.transform.pivot[0] - pos[i][0], 0.05, this.data.compSize[1] / 2 - this.components[i].metadata.transform.pivot[1] - pos[i][1])
        this.components[i].rotation.y = pos[i][2] * Math.PI / 2
      }

      setTimeout(()=>{
        this.updateWires()
      },100)
      
    }
    else {
      console.log('updatePlacement')
    }
  },

  updateRouting (data = null) {
    if ( data !== null) {
      console.log('updateRouting')
    }
    else {
      console.log('updateRouting')
    }
  },

  // empty scene
  clearScene () {
    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 1; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
        this.scene.meshes.slice(i, 1)
      }
    }

    console.log('clear scene, not empty indexDB')
  },

  getPrice () {
    let names = {}
    if (this.data) {
      for (let i = 0; i < this.data.assets.length; i++) {
        if (names.hasOwnProperty(this.data.assets[i].name)) {
          names[this.data.assets[i].name] += 1
        }
        else {
          names[this.data.assets[i].name] = 1
        }
      }
    }

    console.log(names)
    return names
  },

  disposeEngine () {
    this.clearScene()
    
    this.canvas = null
    this.calbacks = {
      select: null // calback when click on component, part, wire
    },
    this.board = null
    this.selected = null
    this.lastPosition = null
    this.auxline = null
    this.auxline2 = null
    this.clickedPin = null
    this.nets = []
    this.wires = []
    this.currentNet = -1
    this.completlyLoaded = false
  
    this.label.parent.dispose()
    this.label = null

    for (let i = 0; i < this.wires.length; i++) {
      if (this.wires[i]) {
        this.wires[i].dispose()
      }
    }

    this.wires = []
    this.objects3d = []
    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 0; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
      }
      this.scene.dispose()
      delete this.scene
    }

    if (this._engine) {
      this._engine.stopRenderLoop()
      this._engine.clear(BABYLON.Color3.White(), true, true, true)
      this._engine.dispose()
      delete this._engine
    }

    delete this
  },

  func_ (param) {
    for (let i = 0; i < this.wires.length; i++) {
      this.wires[i].renderOverlay = undefined
    }
    this.curentOpt = parseInt(Object.keys(this.options).find(key => this.options[key] === param));
  },

  async handleImport3dModel (engineData) {
    const decode = await attachImgToId(engineData.url, true)
    if (!decode) return
    const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
    const blob = new Blob([raw_content])
    const BBJSurl = URL.createObjectURL(blob)
    if (BBJSurl) {
      BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
      console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
      const meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      console.log(meshes)
      if (meshes.length === 0) {
        console.log('Error on import, empty mesh or wrong data to import')
        return
      }
      
      meshes[0].position = new BABYLON.Vector3(engineData.transform.position[0],engineData.transform.position[1],engineData.transform.position[2])
      meshes[0].rotation = new BABYLON.Vector3(engineData.transform.rotation[0]*Math.PI/180,engineData.transform.rotation[1]*Math.PI/180,engineData.transform.rotation[2]*Math.PI/180)
     
      meshes[0].metadata = {engineData: engineData}
      if (engineData.transform.best_p[3] !== 0) {
        meshes[0].position.y = -engineData.transform.position[1] -0.01
        meshes[0].rotation.x += Math.PI
      }

      this.objects3d.push(meshes[0])
    }
  },

  getCompCode () {
    console.log(JSON.stringify(this.getData()))
  }
}