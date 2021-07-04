/* eslint-disable no-console */
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { attachImgToId } from '../../helpers/getImg'
import { isArray } from 'util'
import 'babylonjs-loaders'
// import * as dbHelper from '../../helpers/product-project';

const MESHTYPE = {
  COVERPART: 0,
  ELECPART: 1,
  BOARD: 2
}

export default {
  scene: null,
  objects: {}, // loadded objects in scene
  _engine: null,
  canvas: null,
  calbacks: {
    select: null, // calback when click on component, part, wire
    update: null
  },
  animationSpeed: 5,
  data: [], // data for scene, which parts, routes
  editHistory: [],
  allInfo: null,
  coverHoles: [],
  holeMeshes: [],
  lastClickedPoint: null,
  actualEditStep: 0,
  editStep: 0,
  tooltip: null,
  helperVR: null,
  items: [],
  completlyLoaded: false,
  isGenerative: false,
  positions: [new BABYLON.Vector3(-150, 0, 150), new BABYLON.Vector3(0, 150, 0), new BABYLON.Vector3(-150, 0, -150), new BABYLON.Vector3(150, 0, 150), new BABYLON.Vector3(150, 0, -150)],
  // init the entire scene
  async init (scene, data) {
    this.scene = scene
    this._engine = scene.getEngine()
    this.canvas = this._engine.getRenderingCanvas()
    this.objects = {}

    const uniqueId = BABYLON.Tools.RandomId()
    this.objects[uniqueId] = {}
    
    this.allInfo = data
    this.data.engine = data.cover.engine || [[]]
    this.data.transform = data.cover.transform || []

    this.coverHoles = data.general.coverHoles
    this.tooltip = this.addTooltip() 

    this.helperVR = this.scene.createDefaultVRExperience({ createDeviceOrientationCamera: false, useCustomVRButton: true })

    await this.importAssets(this.data.engine[0])

    return this
  },

  // save data to indexDB based on gizmos move
  // usedOnDrag - bool - default false. used when this function is used onDrag callback
  async gizmoCallbacks (usedOnDrag = false) {
    if (this.scene.selected) {
      if (usedOnDrag) {
        if (this.scene.selected.electronic) {
          this.updateScaleOnCover()
        }
      }
      else {
        if (!this.scene.selected.electronic) {
          console.log('plastic')
          if (this.isGenerative) {
            await this.checkItersection()
          }
          else {
            let rotation = this.scene.selected.rotation
            if (this.scene.selected.rotationQuaternion) {
              rotation = this.scene.selected.rotationQuaternion.toEulerAngles()
            }   
            const pos = [this.scene.selected.position.x, this.scene.selected.position.y, this.scene.selected.position.z]
            const rot = [rotation.x, rotation.y, rotation.z]
            const scale = [this.scene.selected.scaling.x, this.scene.selected.scaling.y, this.scene.selected.scaling.z]
            await this.updateDataToIndexDB(pos, rot, scale, null)
          }
        }
        else {
          console.log('sensor')
          await this.updateCoverHoles()
        }

        const origSelect = this.scene.selected
        for (let i = 6; i < this.items.length; i++) {
          const mesh = this.items[i]
          this.scene.selected = mesh
          let rotation = mesh.rotation
          if (mesh.rotationQuaternion) {
            rotation = mesh.rotationQuaternion.toEulerAngles()
          }
          const pos = [mesh.position.x, mesh.position.y, mesh.position.z]
          const rot = [rotation.x, rotation.y, rotation.z]
          const scale = [mesh.scaling.x, mesh.scaling.y, mesh.scaling.z]
          await this.updateDataToIndexDB(pos, rot, scale, null)
        }
        this.scene.selected = origSelect
      }
    }
  },

  async add3dWires (createNewWire = false) {
    console.log('yeeee ', this.scene.selected)
    for (let i = 0; i < this.scene.selected.pins.length; i++) {
      if (this.scene.selected.pins[i].wire) {
        this.scene.selected.pins[i].wire.dispose(false, true)
        this.scene.selected.pins[i].wire = null
      }
    }

    if (createNewWire) {
      for (let i = 0; i < this.scene.selected.pins.length; i++) {
        this.scene.selected.pins[i].wire = this.createWire(i)
      }
    }
  },

  createWire (pinIndex) {
    const pin = this.scene.selected.pins[pinIndex]
    const current = this.scene.selected.pins[pinIndex].getAbsolutePosition().clone()
    const color = '#ff0000'
    const radius = 0.05
    let pathF = [pin.boardPos.clone(), current]
 
    const catmullRom = BABYLON.Curve3.CreateCatmullRomSpline(pathF, 3)
    const wire = BABYLON.MeshBuilder.CreateTube('tube', {path: catmullRom.getPoints(), radius: radius, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene)
    console.log('wire ', wire)
    wire.animu = true // for general animation
    wire.material = new BABYLON.PBRMaterial('mat', this.scene)
    wire.material.albedoColor = BABYLON.Color3.FromHexString(color).toLinearSpace()
    wire.material.metal = 0.4
    wire.material.roughness = 0.4

    return wire
  },

  async checkItersection () {
    if (this.scene.selected.metadata2 && this.scene.selected.metadata2.sync) {
      var pos = this.scene.selected.drill.getAbsolutePosition()
      var infl = this.scene.selected.metadata2.infl
      if (infl < 0) {
        return
      }

      let sameDir = false
      var ax = this.items[infl].meta.axis
      if (ax === 'y') {
        if (Math.abs(this.items[infl].position.y - pos.y) > 0.1) {
          this.scene.selected.position = this.scene.selected.metadata2.origPos.clone()
          sameDir = true
        }
      }
      else {
        if (ax === 'x') {
          if (Math.abs(this.items[infl].position.x - pos.x) > 0.1) {
            this.scene.selected.position = this.scene.selected.metadata2.origPos.clone()
            sameDir = true
          }
        }
        else {
          if (Math.abs(this.items[infl].position.z - pos.z) > 0.1) {
            this.scene.selected.position = this.scene.selected.metadata2.origPos.clone()
            sameDir = true
          }
        }
      }
    
      if (!sameDir) {
        this.scene.selected.metadata2.origPos = this.scene.selected.getAbsolutePosition().clone()
        this.calcCoverDim(true)
      }
      
      await this.updateCoverHoles()
    }
    else {
      // check board intersection
      let board = null
      for (let i = 0; i < this.scene.meshes.length; i++) {
        if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.board) {
          board = this.scene.meshes[i]
        }
        // console.log(i, this.scene.meshes[i].name, this.scene.meshes[i].metadata, this.scene.meshes[i])
      }
      
      if (board !== null) {
        let intersect = false
        const kids = board.getChildren()
        let meshBoard = null
        for (let j = 0; j < kids.length; j++) {
          if (kids[j]._geometry && kids[j].name.indexOf('__root__') !== -1) {
            meshBoard = kids[j]
            break
          }
        }

        if (meshBoard) {
          for (let i = 0; i < this.scene.selected.pins.length; i++) {
            if (this.scene.selected.pins[i]) {
              if (this.scene.selected.pins[i].intersectsMesh(meshBoard, true)) {
                intersect = true
                break
              }
            }
          }
        }

        if (intersect) {
          this.add3dWires()
          console.log('intersect ')
          if (this.scene.setAsElectronic) {
            await this.scene.setAsElectronic()
            this.scene.selected = null
            this.updateCoverHoles()
            return
          }
        }
        else {
          this.add3dWires(true)
        }
      }

      // check intersection with cover sides
      this.updateCoverHoles(true)
    }
  },

  // update box cover sides based on other sides
  updateScaleOnCover () {
    const actual = this.items[this.scene.selected.meta.cur]
    const opos = this.items[this.scene.selected.meta.opos]
    const dist = actual.position.clone().subtract(opos.position.clone())
    const pos = BABYLON.Vector3.Center(actual.position.clone(), opos.position.clone())
    for (let i = 0; i < 6; i++) {
      if ((i !== parseInt(this.scene.selected.meta.cur)) && (i !== parseInt(this.scene.selected.meta.opos))) {
        
        if (this.scene.selected.meta.axis === 'x') {
          this.items[i].scaling.x = Math.abs(dist.x)

          const posss = this.items[i].position.x - pos.x
          if (this.scene.selected.meta !== null && this.scene.selected.meta.infl) {
            for (let j = 0; j < this.scene.selected.meta.infl.length; j++) {
              this.scene.selected.meta.infl[j].position.x -= posss / 2
              this.scene.selected.meta.infl[j].metadata2.origPos = this.scene.selected.meta.infl[j].getAbsolutePosition().clone()
            }
          }

          for (let j = 6; j < this.items.length; j++) {
            if (this.items[j].metadata2 && this.items[j].metadata2.transform.hasOwnProperty('side')) {
              if (this.items[j].metadata2.transform.side === this.scene.selected.meta.cur) {
                if (this.items[j].metadata2.transform.sync) {
                  this.items[j].position.x -= posss / 2
                }
              }
            }
          }

          this.items[i].position.x = pos.x
        } 
        else {
          if (this.scene.selected.meta.axis === 'y') {
            this.items[i].scaling.y = Math.abs(dist.y)
            
            const posss = this.items[i].position.y - pos.y
                        
            if (this.scene.selected.meta !== null && this.scene.selected.meta.infl) {
              for (let j = 0; j < this.scene.selected.meta.infl.length; j++) {
                this.scene.selected.meta.infl[j].position.y -= posss / 2
                this.scene.selected.meta.infl[j].metadata2.origPos = this.scene.selected.meta.infl[j].getAbsolutePosition().clone()
              }
            }

            for (let j = 6; j < this.items.length; j++) {
              if (this.items[j].metadata2 && this.items[j].metadata2.transform.hasOwnProperty('side')) {
                if (this.items[j].metadata2.transform.side === this.scene.selected.meta.cur) {
                  if (this.items[j].metadata2.transform.sync) {
                    this.items[j].position.y -= posss / 2
                  }
                }
              }
            }

            this.items[i].position.y = pos.y
          }
          else {
            this.items[i].scaling.z = Math.abs(dist.z)
            
            const posss = this.items[i].position.z - pos.z
            if (this.scene.selected.meta !== null && this.scene.selected.meta.infl) {
              for (let j = 0; j < this.scene.selected.meta.infl.length; j++) {
                this.scene.selected.meta.infl[j].position.z -= posss / 2
                this.scene.selected.meta.infl[j].metadata2.origPos = this.scene.selected.meta.infl[j].getAbsolutePosition().clone()
              }
            }

            for (let j = 6; j < this.items.length; j++) {
              if (this.items[j].metadata2 && this.items[j].metadata2.transform.hasOwnProperty('side')) {
                if (this.items[j].metadata2.transform.side === this.scene.selected.meta.cur) {
                  if (this.items[j].metadata2.transform.sync) {
                    this.items[j].position.z -= posss / 2
                  }
                }
              }
            }

            this.items[i].position.z = pos.z
          }
        }
      }
    }
  },

  // import data from indexDB, on init engine
  async importAssets (engineData) {
    if (engineData.length === 0) {
      this.completlyLoaded = true
      return
    }
    console.log('%c importModel from indexDB', 'background: #222; color: #bada55', engineData)
    await this.import3dModel(engineData)

    this.getData()
    this.completlyLoaded = true

    // update with new values if they exist
    this.updateTransform()

    // do animations
    // this.beginAnimation() -- animations start from main script which contain electronics too
  },

  // import function
  // engineData from db
  async import3dModel (engineData) {
    this._engine.displayLoadingUI();

    console.log('engineData on import ', engineData)
    // if import simple part handle it as component with 1 part
    if (!isArray(engineData)) {
      engineData = [engineData]
    }

    const pUniqueId = Object.keys(this.objects)[Object.keys(this.objects).length - 1]
    let uniqueId = BABYLON.Tools.RandomId()
    let cuniqueId
    for (let i = 0; i < engineData.length; i++) {  
      // on refresh page
      if (isArray(engineData[i])) {
        uniqueId = BABYLON.Tools.RandomId()
        this.objects[pUniqueId][uniqueId] = {}

        for (let j = 0; j < engineData[i].length; j++) {
          cuniqueId = BABYLON.Tools.RandomId()
          this.objects[pUniqueId][uniqueId][cuniqueId] = engineData[i][j]
          await this.handleImport(engineData[i][j], [cuniqueId, uniqueId, pUniqueId])
        }
      }
      // on import new component
      else {
        if (!this.objects[pUniqueId][uniqueId]) {
          this.objects[pUniqueId][uniqueId] = {}
        }

        cuniqueId = BABYLON.Tools.RandomId()
        this.objects[pUniqueId][uniqueId][cuniqueId] = engineData[i]
        await this.handleImport(engineData[i], [cuniqueId, uniqueId, pUniqueId])
      }
    }
    
    this._engine.hideLoadingUI();
  },

  // import 3d object in scene
  // engineData from db
  // ids - generated ids onload used to link 3d object with engine data
  async handleImport (engineData, ids) {
    let meshes = []
    console.log('engineData ', engineData)
    if (!engineData.url) {
      meshes = this.addShapeToTheBox(engineData)
      console.log(meshes)
    }
    else {
      const decode = await attachImgToId(engineData.url, true)
      if (!decode) return
      const raw_content = BABYLON.Tools.DecodeBase64('data:base64,' + decode.data.base64)
      const blob = new Blob([raw_content])
      const BBJSurl = URL.createObjectURL(blob)
      if (BBJSurl) {
        BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING
        console.log(BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb'))
        meshes = (await BABYLON.SceneLoader.ImportMeshAsync('', '', BBJSurl, this.scene, null, '.glb')).meshes;
      }
    }  
    
    if (meshes.length === 0) {
      console.log('Error on import, empty mesh or wrong data to import')
      return
    } 

    meshes[0].metadata = { 
      id: ids[0], 
      id1: ids[1], 
      id2: ids[2] 
    }
    
    meshes[0].electronic = engineData.transform.electronic
    if (meshes[0].electronic) {
      const kid = this.returnValidKid(meshes)
      this.addUVS(kid)
      const orig = kid.clone('orig')
      orig.parent = null
      orig.material = kid.material.clone('mat')
      orig.material.albedoColor = BABYLON.Color3.FromHexString(engineData.transform.color).toLinearSpace()
      orig.isVisible = false
      meshes[0].orig = orig
    }

    meshes[0].animu = true // for general animation

    const kids = meshes[0].getDescendants()
    // console.log('kids ', kids)
    const body = kids.find(obj => {
      return obj.name === 'Body'
    })
    let drill = kids.find(obj => {
      return obj.name === 'drill'
    })
    if (drill) {
      if (engineData.drillArray) {
        var parent = drill.parent
        var pos = drill.position.clone()
        drill.dispose(false, true)
      
        drill = this.createShapeFromPoints(engineData.drillArray)
        drill.position = pos
        drill.parent = parent
      }
      this.addUVS(drill)
      drill.setEnabled(false)
    }
    if (engineData.name && engineData.transform.arrayPoints) {
      const lastK = kids[kids.length - 1]
      this.addUVS(lastK)
    }
    let pins = []
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].name.indexOf('Pin') !== -1) {
        pins.push(kids[i])
      }
    }
    meshes[0].pins = pins
    meshes[0].body = body
    meshes[0].drill = drill
    meshes[0].metadata2 = engineData

    this.tooltip.isVisible = false
    this.scene.selected = meshes[0]

    // update mesh transforms based on engine data
    this.updateValues(engineData.transform.position, engineData.transform.rotation, engineData.transform.scale, engineData.transform.color)

    for (let i = 1; i < meshes.length; i++) {
      this.fitToView(meshes[i])

      if (meshes[i].name.toLowerCase().indexOf('layer1') !== -1 || meshes[i].name.toLowerCase().indexOf('layer21') !== -1) {
        meshes[i].isVisible = false
      }

      if (meshes[i].material) {
        meshes[i].material.backFaceCulling = false
      }
      
      this.addActionsToMesh(meshes[i], meshes[0])
    }    
    
    for (let i = 0; i < meshes[0].pins.length; i++) {
      meshes[0].pins[i].boardPos = meshes[0].pins[i].getAbsolutePosition().clone()
    }
    this.scene.marker.activeMod(-1)
    this.items.push(meshes[0])
  },

  // add click actions - left for select, right for tooltip
  addActionsToMesh (mesh, markerHolder) {
    const _this = this
    mesh.actionManager = new BABYLON.ActionManager(this.scene)
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt) => {
        if (_this.scene.meshSelected === MESHTYPE.COVERPART) {
          _this.scene.selected = markerHolder
          _this.scene.marker.gizmos.attachToMesh(markerHolder)
          _this.scene.marker.activeMod(0)
          const pickinfo = _this.scene.pick(evt.pointerX, evt.pointerY)
          _this.lastClickedPoint = pickinfo
        }
        _this.tooltip.isVisible = false
      }))
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnRightPickTrigger, () => {
        if (_this.scene.meshSelected === MESHTYPE.COVERPART) {
          _this.tooltip.isVisible = !_this.tooltip.isVisible
        }
      }))
  },

  // create a shape from points
  createShapeFromPoints (points, height = 0.5) {
    var shape = []
    for (let i = 0; i < points.length; i+=2) {
      shape.push(new BABYLON.Vector2(points[i], points[i + 1]))
    }

    return new BABYLON.PolygonMeshBuilder("drill", shape, this.scene).build(false, height)
    // mesh.setPivotMatrix(BABYLON.Matrix.Translation(0, 0.25, 0), false)
    // mesh.setPivotPoint(new BABYLON.Vector3(0, 0.25, 0))
    // mesh.bakeCurrentTransformIntoVertices()
    // mesh.computeWorldMatrix()

    // return mesh
  },

  // add hole to box cover 
  addHoleToBoxCover (param) {
    if (!this.scene.selected) {
      alert('You have to click one side of cover')
      return
    }
    if (this.scene.selected && this.scene.selected.metadata2 && this.scene.selected.metadata2.transform.color) {
      if (this.lastClickedPoint) {
        let arrayPoints = []
        switch (param[0]) {
          case 0:
            arrayPoints = param[2]
            break
          case 1:
            var mesh1 = BABYLON.Mesh.CreatePlane('asd', param[1], this.scene)
            var verts1 = mesh1.getVerticesData(BABYLON.VertexBuffer.PositionKind)
            mesh1.dispose(false, true)

            var j = 1
            for (let i = 0; i < verts1.length; i++) {
              if (j % 3 !== 0) {
                arrayPoints.push(verts1[i])
              }
              j++
            }
            break
          case 2:
            var mesh2 = BABYLON.Mesh.CreateDisc('asd', param[1] / 2, 32, this.scene)
            var verts2 = mesh2.getVerticesData(BABYLON.VertexBuffer.PositionKind)
            mesh2.dispose(false, true)

            var k = 1
            for (let i = 3; i < verts2.length; i++) {
              if (k % 3 !== 0) {
                arrayPoints.push(verts2[i])
              }
              k++
            }
            break
        }

        const pos = this.lastClickedPoint.pickedPoint.clone()
        
        var axis1 = this.lastClickedPoint.getNormal();							        		
        var axis2 = BABYLON.Vector3.Up();
				var axis3 = BABYLON.Vector3.Up();
				var start = new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0);	//camera.position			

        BABYLON.Vector3.CrossToRef(start, axis1, axis2);
				BABYLON.Vector3.CrossToRef(axis2, axis1, axis3);
				var tmpVec = BABYLON.Vector3.RotationFromAxis(axis3.negate(), axis1, axis2);
        var quat = BABYLON.Quaternion.RotationYawPitchRoll(tmpVec.y, tmpVec.x, tmpVec.z);
        let rot = BABYLON.Vector3.Zero();
				if (this.lastClickedPoint.pickedMesh.rotationQuaternion) {
					rot = this.lastClickedPoint.pickedMesh.rotationQuaternion.multiply(quat).toEulerAngles();
        } 
        else {
          rot = quat.toEulerAngles();
        }

        const finalData = [[pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z], arrayPoints]
        console.log(finalData)
        this.coverHoles[(this.coverHoles.length - 1)].push(finalData)
        // console.log(this.coverHoles)
        if (this.scene.updateBoxHoles) {
          this.scene.updateBoxHoles(this.coverHoles)

          // this.updateCoverHoles()
        }
      }
    }
  },

  // add accessory to box cover 
  async addAccessoryToBoxCover (param) {
    if (!this.scene.selected) {
      alert('You have to click one side of cover')
      return
    }
    if (this.scene.selected && this.scene.selected.metadata2 && this.scene.selected.metadata2.transform.color) {
      if (this.lastClickedPoint) {
        let arrayPoints = []
        switch (param[0]) {
          case 0:
            arrayPoints = param[2]
            break
          case 1:
            var mesh1 = BABYLON.Mesh.CreatePlane('asd', param[1], this.scene)
            var verts1 = mesh1.getVerticesData(BABYLON.VertexBuffer.PositionKind)
            mesh1.dispose(false, true)

            var j = 1
            for (let i = 0; i < verts1.length; i++) {
              if (j % 3 !== 0) {
                arrayPoints.push(verts1[i])
              }
              j++
            }
            break
          case 2:
            var mesh2 = BABYLON.Mesh.CreateDisc('asd', param[1] / 2, 32, this.scene)
            var verts2 = mesh2.getVerticesData(BABYLON.VertexBuffer.PositionKind)
            mesh2.dispose(false, true)

            var k = 1
            for (let i = 3; i < verts2.length; i++) {
              if (k % 3 !== 0) {
                arrayPoints.push(verts2[i])
              }
              k++
            }
            break
        }

        var axis1 = this.lastClickedPoint.getNormal();							        		
        var axis2 = BABYLON.Vector3.Up();
				var axis3 = BABYLON.Vector3.Up();
				var start = new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0);	//camera.position			

        BABYLON.Vector3.CrossToRef(start, axis1, axis2);
				BABYLON.Vector3.CrossToRef(axis2, axis1, axis3);
				var tmpVec = BABYLON.Vector3.RotationFromAxis(axis3.negate(), axis1, axis2);
        var quat = BABYLON.Quaternion.RotationYawPitchRoll(tmpVec.y, tmpVec.x, tmpVec.z);
        let rot = BABYLON.Vector3.Zero();
				if (this.lastClickedPoint.pickedMesh.rotationQuaternion) {
					rot = this.lastClickedPoint.pickedMesh.rotationQuaternion.multiply(quat).toEulerAngles();
        } 
        else {
          rot = quat.toEulerAngles();
        }

        const pos = this.lastClickedPoint.pickedPoint.clone();
        await this.import3dModel([
          {
            "transform":
            {
              "color": "#6d0253",
              "rotation": [rot.x * 180 / Math.PI, rot.y * 180 / Math.PI, rot.z * 180 / Math.PI],
              "scale": [1, 1, 1],
              "position": [pos.x,pos.y,pos.z],
              // "side": parseInt(meta.cur),
              // "sync": true,
              "arrayPoints": arrayPoints
            },
            "url": undefined
          }
        ])
        this.getData()
      }
    }
  },

  // add shape to a specific side
  addShapeToTheBox (data) {
    var parent = new BABYLON.AbstractMesh('__root__', this.scene)
    var mesh = this.createShapeFromPoints(data.transform['arrayPoints'], 1)
    mesh.name = mesh.id = 'Box2'
    mesh.material = new BABYLON.PBRMaterial('material', this.scene)
    mesh.material.albedoColor = BABYLON.Color3.FromHexString(data.transform['color']).toLinearSpace()
    mesh.material.metallic = 0.4
    mesh.material.roughness = 0.2
    mesh.setParent(parent)
    return [parent, mesh]
  },

  // add hole to a specific side
  addHoleToTheBox (side) {
    // console.log('side ', side)
    const meta = this.items[side].meta
    for (let i = 0; i < this.coverHoles[side].length; i++) {
      var mesh = this.createShapeFromPoints(this.coverHoles[side][i][2])
      mesh.position = this.items[side].getAbsolutePosition().clone()
      if (meta.axis === 'x') {
        mesh.rotation.z = Math.PI / 2
        mesh.position.y = this.coverHoles[side][i][0]
        mesh.position.z = this.coverHoles[side][i][1]
        mesh.position.x -= 0.25
      }
      else {
        if (meta.axis === 'y') {
          mesh.position.x = this.coverHoles[side][i][0]
          mesh.position.z = this.coverHoles[side][i][1]
          mesh.position.y += 0.25
        }
        else {
          mesh.rotation.x = Math.PI / 2
          mesh.position.x = this.coverHoles[side][i][0]
          mesh.position.y = this.coverHoles[side][i][1]
          mesh.position.z += 0.25
        }
      }

      const clickable = mesh.clone(mesh.name + i)
      clickable.visibility = 0.01
      clickable.metadata = {
        side: side,
        data: this.coverHoles[side]
      }
      const _this = this
      clickable.actionManager = new BABYLON.ActionManager(this.scene)
      clickable.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          if (_this.scene.meshSelected === MESHTYPE.COVERPART) {
            clickable.renderOverlay = true
          }
        }))
      clickable.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
          if (_this.scene.meshSelected === MESHTYPE.COVERPART) {
            clickable.renderOverlay = false
          }
        }))
      clickable.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnDoublePickTrigger, () => {
          if (_this.scene.meshSelected === MESHTYPE.COVERPART) {
            let j = -1
            const pos = clickable.getAbsolutePosition().clone()
            for (let i = 0; i < clickable.metadata.data.length; i++) {
              if (side === 0 || side === 1) {
                if (parseFloat(Number(pos.x).toFixed(2)) === clickable.metadata.data[i][0] && parseFloat(Number(pos.y).toFixed(2)) === clickable.metadata.data[i][1]) {
                  j = i
                  break
                }
              }
              else {
                if (side === 2 || side === 3) {
                  if (parseFloat(Number(pos.y).toFixed(2)) === clickable.metadata.data[i][0] && parseFloat(Number(pos.z).toFixed(2)) === clickable.metadata.data[i][1]) {
                    j = i
                    break
                  }
                }
                else {
                  if (parseFloat(Number(pos.x).toFixed(2)) === clickable.metadata.data[i][0] && parseFloat(Number(pos.z).toFixed(2)) === clickable.metadata.data[i][1]) {
                    j = i
                    break
                  }
                }
              }
            }

            if (j !== -1) {
              _this.coverHoles[side].splice(j, 1)
              _this.updateCoverHoles()
            }
          }
        }))
      
      this.holeMeshes.push(clickable)
      this.cropCover(this.items[side], mesh)
    }
  },

  // add uvs to mesh to be able to cut
  addUVS (mesh) {
    let uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)
    if (!uvs) {
      const indices = mesh.getIndices()
      uvs = []

      var maxIndice = 0
      for (let i = 0; i < indices.length; i++) {
        maxIndice = Math.max(maxIndice, indices[i])
      }
      for (let i = 0; i <= maxIndice; i++) {
        uvs.push(0,0)
      }
      mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs)
      mesh.setIndices(indices, null)
    }
  },

  // send data to be saved to indexDB
  getData () {
    let data = []
    this.items = []
    // console.log(this.objects)
    for (let key in this.objects) {
      if (key === 'indexDBId') continue
      data.push([])
      for(let key2 in this.objects[key]) {
        if (key2 === 'indexDBId') continue
        data[0].push([])
        for(let key3 in this.objects[key][key2]) {
          if (key3 === 'indexDBId') continue
          data[0][data[0].length - 1].push(this.objects[key][key2][key3])
          this.items.push(this.getMeshByMeta(key3,key2,key))
        } 
      }       
    }

    this.data.engine = data

    // console.log(JSON.stringify(data))
    return {
      engine: this.data.engine,
      data: this.data.algo,
      transform: this.data.transform,
    }
  },

  // get mesh with specific metadata
  getMeshByMeta (id, id1, id2) {
    let mesh
    for (let i = 1; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata) {
        if (this.scene.meshes[i].metadata['id'] === id &&
          this.scene.meshes[i].metadata['id1'] === id1 &&
          this.scene.meshes[i].metadata['id2'] === id2) {
            mesh = this.scene.meshes[i]
            break
          }
      }
    }

    return mesh
  },

  // reset data from indexDB
  resetSavedData () {
    this.objects = {}

    const uniqueId = BABYLON.Tools.RandomId()
    this.objects[uniqueId] = {}
    
    this.data.engine = [[]]
    this.data.transform = []
  },

  undoMove () {
    if (this.actualEditStep > 0) {
      this.actualEditStep--

      this.data = this.editHistory[this.actualEditStep]
      console.log(this.editHistory, this.actualEditStep)
      console.log(this.data)
      this.recreateScene(false)
    }
  },

  redoMove () {
    if (this.actualEditStep < this.editStep) {
      this.actualEditStep++

      this.data = this.editHistory[this.actualEditStep]
      console.log(this.data)
      this.recreateScene(false)
    }
  },

  updateSceneStep () {
    const copy = JSON.parse(JSON.stringify(this.data))
    // const copy = Object.assign({}, this.data)
    this.editHistory.push(copy)
    this.editStep++
    this.actualEditStep++
  },

  // add GUI to scene
  addTooltip () {
    let _this = this
    let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')

    let tooltip = new GUI.Rectangle('tooltip')
    tooltip.width = '200px'
    tooltip.height = '160px'
    tooltip.color = 'white'
    tooltip.thickness = 0
    tooltip.horizontalAlignment = 0
    tooltip.verticalAlignment = 0
    tooltip.isVisible = false

    let button1 = GUI.Button.CreateSimpleButton('but', 'Translate')
    this._customTooltip(button1)
    tooltip.addControl(button1)
    button1.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.scene.marker.activeMod(0)
      }
      _this.tooltip.isVisible = false
    })

    var button2 = GUI.Button.CreateSimpleButton('but', 'Rotate')
    this._customTooltip(button2)
    button2.top = '20px'
    tooltip.addControl(button2)
    button2.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.scene.marker.activeMod(1)
      }
      _this.tooltip.isVisible = false
    })

    var button3 = GUI.Button.CreateSimpleButton('but', 'Unsync')
    this._customTooltip(button3)
    button3.top = '40px'
    tooltip.addControl(button3)
    button3.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        if (_this.scene.meshSelected === MESHTYPE.COVERPART) {
          if (_this.scene.selected.metadata2 && _this.scene.selected.metadata2.sync) {
            const boxSide = _this.items[_this.scene.selected.metadata2.infl].meta
            if (boxSide.infl.length !== 0) {
              let index = -1
              for (let i = 0; i < boxSide.infl.length; i++) {
                if (boxSide.infl[i] === _this.scene.selected) {
                  index = i
                  break
                }
              }
              if (index !== -1) {
                boxSide.infl.splice(index, 1)
              }
            }
            _this.scene.selected.metadata2.sync = false
            _this.scene.selected.metadata2.infl = -1
            delete _this.scene.selected.metadata2.origPos

            _this.updateCoverHoles()
          }
          else {
            if (_this.scene.selected.metadata2 && _this.scene.selected.metadata2.transform.hasOwnProperty('sync')) {
              _this.scene.selected.metadata2.transform.sync = !_this.scene.selected.metadata2.transform.sync
            }
          }
        }
      }
      _this.tooltip.isVisible = false
    })

    var input1 = new GUI.InputText()
    this._customTooltipInput(input1)
    input1.top = '60px'
    tooltip.addControl(input1)

    var button4 = GUI.Button.CreateSimpleButton('but', 'AplyX')
    this._customTooltip(button4)
    button4.top = '60px'
    button4.width = '50px'
    button4.left = '50px'
    tooltip.addControl(button4)
    button4.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.doTransform(input1.text, 'X')
      }
      _this.tooltip.isVisible = false
    })

    var input2 = new GUI.InputText()
    this._customTooltipInput(input2)
    input2.top = '80px'
    tooltip.addControl(input2)

    var button5 = GUI.Button.CreateSimpleButton('but', 'AplyY')
    this._customTooltip(button5)
    button5.top = '80px'
    button5.width = '50px'
    button5.left = '50px'
    tooltip.addControl(button5)
    button5.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.doTransform(input2.text, 'Y')
      }
      _this.tooltip.isVisible = false
    })

    var input3 = new GUI.InputText()
    this._customTooltipInput(input3)
    input3.top = '100px'
    tooltip.addControl(input3)

    var button6 = GUI.Button.CreateSimpleButton('but', 'AplyZ')
    this._customTooltip(button6)
    button6.top = '100px'
    button6.width = '50px'
    button6.left = '50px'
    tooltip.addControl(button6)
    button6.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.doTransform(input3.text, 'Z')
      }
      _this.tooltip.isVisible = false
    })

    var button7 = GUI.Button.CreateSimpleButton('but', 'SetAsElec')
    this._customTooltip(button7)
    button7.top = '120px'
    tooltip.addControl(button7)
    button7.onPointerUpObservable.add(async function (ev) {
      if (ev.buttonIndex === 0) {
        if (_this.scene.meshSelected === MESHTYPE.COVERPART) {
          if (_this.scene.setAsElectronic) {
            await _this.scene.setAsElectronic()
            _this.scene.selected = null
          }
        }
      }
      _this.tooltip.isVisible = false
    })

    var button8 = GUI.Button.CreateSimpleButton('but', 'Toggle')
    this._customTooltip(button8)
    button8.top = '140px'
    tooltip.addControl(button8)
    button8.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.toggle()
      }
      _this.tooltip.isVisible = false
    })
   
    var picker = new GUI.ColorPicker()
    picker.value = (this.selected) ? BABYLON.Color3.FromHexString(this.selected.metadata.transform.color) : BABYLON.Color3.White()
    picker.height = "100px"
    picker.width = "100px"
    tooltip.addControl(picker)
    picker.horizontalAlignment = 1
    picker.verticalAlignment = 0
    picker.onValueChangedObservable.add(function(value) { // value is a color3
      _this.changeColor(value.toHexString())
    })

    var button81 = GUI.Button.CreateSimpleButton('but', 'Remove')
    this._customTooltip(button81)
    button81.top = '100px'
    tooltip.addControl(button81)
    button81.horizontalAlignment = 1
    button81.verticalAlignment = 0
    button81.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.removeItem()
      }
      _this.tooltip.isVisible = false
    })
    var button9 = GUI.Button.CreateSimpleButton('but', 'Selected')
    this._customTooltip(button9)
    button9.top = '120px'
    tooltip.addControl(button9)
    button9.horizontalAlignment = 1
    button9.verticalAlignment = 0
    button9.onPointerUpObservable.add(function (ev) {
      if (ev.buttonIndex === 0) {
        _this.isolateItem()
      }
      _this.tooltip.isVisible = false
    })
    /*
    var slider = new GUI.Slider();
    slider.minimum = 0
    slider.maximum = 1
    slider.value = 1
    slider.top = "100px"
    slider.height = "20px"
    slider.width = "100px"
    tooltip.addControl(slider)
    slider.horizontalAlignment = 1
    slider.verticalAlignment = 0
    slider.onValueChangedObservable.add(function(value) {
      const kids = _this.scene.selected.getDescendants(false)
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].material) {
          kids[i].material.metallic = value
        }
      }
    });
    */
    advancedTexture.addControl(tooltip)
    return tooltip
  },

  // style the right-click menu
  _customTooltip (button) {
    button.height = '20px'
    button.width = '100px'
    button.fontSize = 14
    button.cornerRadius = 5
    button.color = 'white'
    button.horizontalAlignment = 0
    button.verticalAlignment = 0
    button.background = 'black'
  },

  // style the right-click menu
  _customTooltipInput (input) {
    input.height = '20px'
    input.width = '50px'
    input.maxWidth = '50px'
    input.text = '90'
    input.color = 'white'
    input.horizontalAlignment = 0
    input.verticalAlignment = 0
    input.background = 'black'
  },

  isolateItem () {
    if (this.scene.selected) {
      if (!this.scene.activeCamera.target.equals(BABYLON.Vector3.Zero())) {
        this.scene.activeCamera.setTarget(BABYLON.Vector3.Zero())
      }
      else {
        // todo: issue on dragg
        this.scene.activeCamera.setTarget(this.scene.selected.getAbsolutePosition())
      }
      // console.log(this.scene.activeCamera)
    }
  },

  // change visibility of selected obj
  toggle () {
    const kids = this.scene.selected.getDescendants(false)
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].material) {
        if (kids[i].material.alpha === 1) {
          kids[i].material.transparencyMode = 2
          kids[i].material.alpha = 0.1
        }
        else {
          kids[i].material.transparencyMode = 0
          kids[i].material.alpha = 1
        }
      }
    }
  },

  // change color of selected obj
  // value - hexastring color
  changeColor (value) {
    const kids = this.scene.selected.getDescendants(false)
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].material) {
        kids[i].material.albedoColor = BABYLON.Color3.FromHexString(value).toLinearSpace()
      }
    }

    if (this.scene.selected.orig) {
      this.scene.selected.orig.material.albedoColor = BABYLON.Color3.FromHexString(value).toLinearSpace()
    }

    this.updateDataToIndexDB(null, null, null, value)
  },

  // update transform of objects in scene
  updateTransform (data = null) {
    if ( data !== null) {
      this.data.transform = data

      this.updateTransform()
    }
    else {
      if (this.data.transform.length === 0) {
        return
      }

      let k = 0
      for (let i = 0; i < this.scene.meshes.length; i++) {
        if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.id) {
          this.scene.selected = this.scene.meshes[i]

          // to do: is working only for components with one part
          this.changeColor(this.data.transform[k][0].color)
          this.scene.selected.position = new BABYLON.Vector3(this.data.transform[k][0].position[0], this.data.transform[k][0].position[1], this.data.transform[k][0].position[2])
          this.scene.selected.rotation = new BABYLON.Vector3(this.data.transform[k][0].rotation[0], this.data.transform[k][0].rotation[1], this.data.transform[k][0].rotation[2])
          this.scene.selected.scaling = new BABYLON.Vector3(this.data.transform[k][0].scale[0], this.data.transform[k][0].scale[1], this.data.transform[k][0].scale[2])
          this.gizmoCallbacks()
          k++
        }
      }
    }
  },

  // change camera radius based on mesh
  fitToView (mesh) {
    let radius = mesh.getBoundingInfo().boundingSphere.radiusWorld
    const engine = this.scene.getEngine()
    let aspectRatio = engine.getAspectRatio(this.scene.activeCamera)
    let halfMinFov = this.scene.activeCamera.fov / 2
    if (aspectRatio < 1) {
        halfMinFov = Math.atan(aspectRatio * Math.tan(this.scene.activeCamera.fov / 2))
    }

    let viewRadius = Math.abs(radius / Math.sin(halfMinFov))
    if (viewRadius > this.scene.activeCamera.radius) {
      this.scene.activeCamera.radius = viewRadius
    }
  },

  // apply a specific transform to selected obj
  // value - float
  // axis - string X,Y,Z
  doTransform (value, axis) {
    switch (axis) {
      case 'X':
        switch (this.scene.marker.actualMode) {
          case 0:
            this.scene.selected.position.x = parseFloat(value)
            break
          case 1:
            this.scene.selected.rotation.x = parseFloat(value * Math.PI / 180)
            break
          case 2:
            this.scene.selected.scaling.x = parseFloat(value)
            break
        }
        break
      case 'Y':
        switch (this.scene.marker.actualMode) {
          case 0:
            this.scene.selected.position.y = parseFloat(value)
            break
          case 1:
            this.scene.selected.rotation.y = parseFloat(value * Math.PI / 180)
            break
          case 2:
            this.scene.selected.scaling.y = parseFloat(value)
            break
        }
        break
      case 'Z':
        switch (this.scene.marker.actualMode) {
          case 0:
            this.scene.selected.position.z = parseFloat(value)
            break
          case 1:
            this.scene.selected.rotation.z = parseFloat(value * Math.PI / 180)
            break
          case 2:
            this.scene.selected.scaling.z = parseFloat(value)
            break
        }
        break
    }

    this.gizmoCallbacks()
  },

  // remove this engine
  disposeEngine () {
    this.objects = {}
    this.calbacks = {
      select: null,
      update: null
    }
    this.editHistory = []
    this.actualEditStep = 0
    this.editStep = 0
    this.animationSpeed = 5
    
    this.data = []
    this.coverHoles = []
    this.holeMeshes = []
    this.lastClickedPoint = null
    this.allInfo = null
    this.items = []

    this.tooltip.parent.dispose()
    this.tooltip = null

    if (this.scene) {
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

  // get engineData of selected object
  getMeshEngineData () {
    let data = {}

    if (this.objects[this.scene.selected.metadata.id2]) {
      // console.log('3 ', this.objects[this.selected.metadata.id2][this.selected.metadata.id1][this.selected.metadata.id])
      data = this.objects[this.scene.selected.metadata.id2][this.scene.selected.metadata.id1][this.scene.selected.metadata.id]
    }
    else {
      if (this.objects[this.scene.selected.metadata.id1]) {
        // console.log('2 ', this.objects[this.selected.metadata.id1][this.selected.metadata.id])
        data = this.objects[this.scene.selected.metadata.id1][this.scene.selected.metadata.id]
      }
      else {
        // console.log('1 ', this.objects[this.selected.metadata.id])
        data = this.objects[this.scene.selected.metadata.id]
      }
    }

    return data
  },

  // update infos from indexDB
  async updateDataToIndexDB (pos, rot, scale, color) {
    // console.log(this.selected, this.selected.metadata, this.objects)
    const data = this.getMeshEngineData()
    if (!data) {
      return
    }
    // console.log(data, this.scene.selected, this.scene.selected.metadata, this.objects)
    if (color) {
      data.transform.color = color
    }

    if (scale) {
      data.transform.scale = scale
    }

    if (rot) {
      const updatedRot = [rot[0] * 180 / Math.PI, rot[1] * 180 / Math.PI, rot[2] * 180 / Math.PI]
      data.transform.rotation = updatedRot
    }

    if (pos) {
      data.transform.position = pos
    }

    // await this.updateKeyCover()
  },

  // update key cover
  async updateKeyCover () {
    //const data = await this.getData()

    //const url_data = dbHelper.getKeyForCurrentRoute()
    //const key_cover = `${url_data.project_id}-${url_data.product_id}-cover`
    //await dbHelper.save_data_indexed_db(key_cover, data)
  },

  // clone selected obkect
  cloneObject () {
    console.log('TODO: add')
  },

  // remove selected object
  removeItem () {
    const keys = this.scene.selected.metadata
    this.scene.selected.dispose(false, true)

    if (this.objects[keys.id2]) {
      delete this.objects[keys.id2][keys.id1][keys.id]
      if (Object.keys(this.objects[keys.id2][keys.id1]).length === 0) {
        delete this.objects[keys.id2][keys.id1]

        if (Object.keys(this.objects[keys.id2]).length === 0) {
          delete this.objects[keys.id2]
        }
      }
    }
    else {
      if (this.objects[keys.id1]) {
        delete this.objects[keys.id1][keys.id]
        if (Object.keys(this.objects[keys.id1]).length === 0) {
          delete this.objects[keys.id1]
        }
      }
      else {
        delete this.objects[keys.id]
      }
    }

    if (this.tooltip) {
      this.tooltip.isVisible = false
    }
 
    this.scene.selected = null
    this.scene.marker.activeMod(-1)

    this.updateKeyCover()
  },

  // update transforms of selected object
  updateValues (position, rotation, scale, color) {
    this.scene.selected.position = new BABYLON.Vector3(position[0], position[1], position[2])
    this.scene.selected.rotationQuaternion = null
    this.scene.selected.rotation = new BABYLON.Vector3(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
    this.scene.selected.scaling = new BABYLON.Vector3(scale[0], scale[1], scale[2])

    if (color) {
      const kids = this.scene.selected.getDescendants(false)
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].material) {
          kids[i].material.albedoColor = BABYLON.Color3.FromHexString(color).toLinearSpace()
        }
      }
    }
    else {
      // wrong result for objects with multiple materials
      return
      /*let getColor
      const kids = this.scene.selected.getDescendants(false)
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].material) {
          getColor = kids[i].material.albedoColor.toHexString()
          break
        }
      }
      console.log(getColor)
      this.updateDataToIndexDB(null, null, null, getColor)*/
    }
  },

  // show/hide grid
  toggleGrid (param) {
    this.scene.meshes[1].isVisible = param
  },

  // empty scene
  clearScene () {
    if (this.scene) {
      for (let i = this.scene.meshes.length - 1; i >= 2; i--) {
        if (this.scene.meshes[i]) {
          this.scene.meshes[i].dispose(false, true)
        }
      }
    }

    if (this.tooltip) {
      this.tooltip.isVisible = false
    }
    
    console.log('clear scene, empty indexDB')
    this.resetSavedData()
  },

  // begin build animation in scene
  beginAnimation () {
    this.scene.stopAllAnimations()

    let animatable = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i].metadata && this.scene.meshes[i].metadata.id) {
        animatable.push(this.scene.meshes[i])
      }
    }

    this.setAnimOnAnimatable(animatable)
  },

  // do settings to be able to run animations
  setAnimOnAnimatable (animatable) {
    for (let i = 0; i < animatable.length; i++) {
      animatable[i].setEnabled(false)
      this.setAnimKeys(animatable[i], i, animatable)
    }

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

  // calcularte cover dimensions
  calcCoverDim (isUpdate = false) {
    let coverElect = []
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].electronic) {
        coverElect.push(this.items[i])
      }
    }

    let boxes = []
    for (let i = 0; i < this.scene.meshes.length; i++) {
      if (this.scene.meshes[i]._geometry && this.scene.meshes[i].parent) {
        if (this.scene.meshes[i].parent.name.indexOf('__root__') !== -1) {
          if (this.scene.meshes[i].parent.parent && this.scene.meshes[i].parent.parent.electronic) {
            continue
          }
          
          if (this.scene.meshes[i].parent.metadata2 && !this.scene.meshes[i].parent.metadata2.sync) {
            continue
          }

          // console.log(i, this.scene.meshes[i].name, this.scene.meshes[i].parent.name, this.scene.meshes[i].parent)
          const bnds = this.scene.meshes[i].getHierarchyBoundingVectors(true)
            
          let width = Math.abs(bnds.min.x - bnds.max.x)
          let height = Math.abs(bnds.min.y - bnds.max.y)
          let depth = Math.abs(bnds.min.z - bnds.max.z)

          const box = new BABYLON.Mesh.CreateBox('box', 1, this.scene)
          box.scaling = new BABYLON.Vector3(width, height, depth)
          box.position = this.scene.meshes[i].getAbsolutePosition().clone()
          boxes.push(box)
        }
      }
    }
    // console.log(boxes)

    const parent = new BABYLON.AbstractMesh('MEH', this.scene)
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].setParent(parent)
    }
    
    const bnds = parent.getHierarchyBoundingVectors(true)
    
    parent.dispose(false, true)

    const offset = 0.1

    let width = Math.abs(bnds.min.x - bnds.max.x) + offset
    let height = Math.abs(bnds.min.y - bnds.max.y) + offset
    let depth = Math.abs(bnds.min.z - bnds.max.z) + offset

    // const box = new BABYLON.Mesh.CreateBox('box', 1, this.scene)
    // box.scaling = new BABYLON.Vector3(width, height, depth)
    // box.position = BABYLON.Vector3.Center(bnds.min, bnds.max)
    // box.material = new BABYLON.StandardMaterial('stmat', this.scene)
    // box.material.wireframe = true
    const pos = BABYLON.Vector3.Center(bnds.min, bnds.max)
    
    if (coverElect.length < 6) {
      console.log('Not cube')
      return
    }

    if (!isUpdate) {
      coverElect[0].meta = { cur: 0, opos: 1, axis: 'z' }
      coverElect[1].meta = { cur: 1, opos: 0, axis: 'z' }
      coverElect[2].meta = { cur: 2, opos: 3, axis: 'x' }
      coverElect[3].meta = { cur: 3, opos: 2, axis: 'x' }
      coverElect[4].meta = { cur: 4, opos: 5, axis: 'y' }
      coverElect[5].meta = { cur: 5, opos: 4, axis: 'y' }
    }
  
    if (isUpdate) {
      // todo: on drag synced part outside
      /* if (coverElect[0].position.z !== pos.z + depth / 2 - 0.05) {
        console.log('asta1')
        const diff = coverElect[0].position.z - (pos.z + depth / 2 - 0.05)
        for (let i = 0; i < coverElect[1].meta.infl.length; i++) {
          coverElect[0].meta.infl[i].position.z += diff
          coverElect[0].meta.infl[i].metadata2.origPos = coverElect[0].meta.infl[i].getAbsolutePosition().clone()
        }
      }
      if (coverElect[1].position.z !== pos.z - depth / 2 + 0.05) {
        console.log('asta2')
        const diff = coverElect[1].position.z - (pos.z - depth / 2 + 0.05)
        for (let i = 0; i < coverElect[1].meta.infl.length; i++) {
          coverElect[1].meta.infl[i].position.z += diff
          coverElect[1].meta.infl[i].metadata2.origPos = coverElect[1].meta.infl[i].getAbsolutePosition().clone()
        }
      }
      if (coverElect[2].position.x !== pos.x + width / 2 - 0.05) {
        console.log('asta3')
        const diff = coverElect[2].position.x - (pos.x + width / 2 - 0.05)
        for (let i = 0; i < coverElect[2].meta.infl.length; i++) {
          coverElect[2].meta.infl[i].position.x += diff
          coverElect[2].meta.infl[i].metadata2.origPos = coverElect[2].meta.infl[i].getAbsolutePosition().clone()
        }
      }
      if (coverElect[3].position.x !== pos.x - width / 2 + 0.05) {
        console.log('asta4')
        const diff = coverElect[3].position.x - (pos.x - width / 2 + 0.05)
        for (let i = 0; i < coverElect[3].meta.infl.length; i++) {
          coverElect[3].meta.infl[i].position.x += diff
          coverElect[3].meta.infl[i].metadata2.origPos = coverElect[3].meta.infl[i].getAbsolutePosition().clone()
        }
      }
      if (coverElect[4].position.y !== pos.y + height / 2 - 0.05) {
        console.log('asta5')
        const diff = coverElect[4].position.y - (pos.y + height / 2 - 0.05)
        for (let i = 0; i < coverElect[4].meta.infl.length; i++) {
          coverElect[4].meta.infl[i].position.y += diff
          coverElect[4].meta.infl[i].metadata2.origPos = coverElect[4].meta.infl[i].getAbsolutePosition().clone()
        }
      }
      if (coverElect[5].position.y !== pos.y - height / 2 + 0.05) {
        console.log('asta6')
        const diff = coverElect[5].position.y - (pos.y - height / 2 + 0.05)
        for (let i = 0; i < coverElect[5].meta.infl.length; i++) {
          coverElect[5].meta.infl[i].position.y += diff
          coverElect[5].meta.infl[i].metadata2.origPos = coverElect[5].meta.infl[i].getAbsolutePosition().clone()
        }
      } */
    }

    const clona = coverElect[0].position.clone()
    if (!isUpdate && clona.equals(BABYLON.Vector3.Zero())) {
      console.log('updateeee position and scaling')
      coverElect[0].scaling = new BABYLON.Vector3(width, height, 0.1)
      coverElect[1].scaling = new BABYLON.Vector3(width, height, 0.1)
      coverElect[2].scaling = new BABYLON.Vector3(0.1, height, depth)
      coverElect[3].scaling = new BABYLON.Vector3(0.1, height, depth)
      coverElect[4].scaling = new BABYLON.Vector3(width, 0.1, depth)
      coverElect[5].scaling = new BABYLON.Vector3(width, 0.1, depth)

      coverElect[0].position = new BABYLON.Vector3(pos.x, pos.y, pos.z + depth / 2 - 0.05)
      coverElect[1].position = new BABYLON.Vector3(pos.x, pos.y, pos.z - depth / 2 + 0.05)
      coverElect[2].position = new BABYLON.Vector3(pos.x + width / 2 - 0.05, pos.y, pos.z)
      coverElect[3].position = new BABYLON.Vector3(pos.x - width / 2 + 0.05, pos.y, pos.z)
      coverElect[4].position = new BABYLON.Vector3(pos.x, pos.y + height / 2 - 0.05, pos.z)
      coverElect[5].position = new BABYLON.Vector3(pos.x, pos.y - height / 2 + 0.05, pos.z)
    }
  },

  // update box plastic based on electronics inside
  async updateGeneratedCover () {
    this.isGenerative = true
    this.calcCoverDim()
    await this.generalCoverSync()
  },

  // return the kid with geometry
  returnValidKid (kids) {
    let kid
    for (let j = 0; j < kids.length; j++) {
      if (kids[j]._geometry) {
        kid = kids[j]
        break
      }
    }

    return kid
  },

  // general update for crop cover
  async generalCoverSync () {
    ////** set position of box cover and get copy of geometry - start **\\\\
    let coverElect = []
    let coverParts = []
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].electronic) {
        this.items[i].meta.infl = []
        coverElect.push(this.items[i])
      }
      else {
        this.items[i].metadata2.infl = -1
        coverParts.push(this.items[i])
      }
    }
    // return
    for (let i = 0; i < coverParts.length; i++) {
      if (!coverParts[i].drill) {
        continue
      }

      if (coverParts[i].metadata2.transform.sync) {
        // closest part
        var pos0 = coverParts[i].drill.getAbsolutePosition()
        const dists = [Math.abs(coverElect[0].position.z - pos0.z), 
          Math.abs(coverElect[1].position.z - pos0.z),
          Math.abs(coverElect[2].position.x - pos0.x),
          Math.abs(coverElect[3].position.x - pos0.x),
          Math.abs(coverElect[4].position.y - pos0.y),
          Math.abs(coverElect[5].position.y - pos0.y)]
        
        // console.log(dists)
        const min = Math.min(...dists)
        const key = dists.indexOf(min)

        if (min > 0.2) {
          switch(key) {
            case 0:
                coverParts[i].position.z += min
              break
            case 1:
                coverParts[i].position.z -= min
              break
            case 2:
                coverParts[i].position.x += min
              break
            case 3:
                coverParts[i].position.x -= min
              break
            case 4:
                coverParts[i].position.y += min
              break
            case 5:
                coverParts[i].position.y -= min
              break
          }
          
          coverParts[i].computeWorldMatrix(true)
          coverParts[i].refreshBoundingInfo()
          this.scene.render()
        }
        // console.log(min, key)
      }
      
      var pos = coverParts[i].drill.getAbsolutePosition()
      // console.log(4, coverElect[4], Math.abs(coverElect[4].position.y - pos.y))
      if (Math.abs(coverElect[4].position.y - pos.y) < 0.2) {
        coverElect[4].meta.infl.push(coverParts[i])
        coverParts[i].metadata2.infl = 4
        coverParts[i].metadata2.sync = true
        coverParts[i].metadata2.origPos = coverParts[i].getAbsolutePosition().clone()
        // console.log(coverParts[i])
        continue
      }

      // console.log(5, coverElect[5], Math.abs(coverElect[5].position.y - pos.y))
      if (Math.abs(coverElect[5].position.y - pos.y) < 0.2) {
        coverElect[5].meta.infl.push(coverParts[i])
        coverParts[i].metadata2.infl = 5
        coverParts[i].metadata2.sync = true
        coverParts[i].metadata2.origPos = coverParts[i].getAbsolutePosition().clone()
        // console.log(coverParts[i])
        continue
      }
      
      // console.log(2, coverElect[2], Math.abs(coverElect[2].position.x - pos.x))
      if (Math.abs(coverElect[2].position.x - pos.x) < 0.2) {
        coverElect[2].meta.infl.push(coverParts[i])
        coverParts[i].metadata2.infl = 2
        coverParts[i].metadata2.sync = true
        coverParts[i].metadata2.origPos = coverParts[i].getAbsolutePosition().clone()
        // console.log(coverParts[i])
        continue
      }
      
      // console.log(3, coverElect[3], Math.abs(coverElect[3].position.x - pos.x))
      if (Math.abs(coverElect[3].position.x - pos.x) < 0.2) {
        coverElect[3].meta.infl.push(coverParts[i])
        coverParts[i].metadata2.infl = 3
        coverParts[i].metadata2.sync = true
        coverParts[i].metadata2.origPos = coverParts[i].getAbsolutePosition().clone()
        // console.log(coverParts[i])
        continue
      }
      
      // console.log(0,coverElect[0],Math.abs(coverElect[0].position.z - pos.z))
      if (Math.abs(coverElect[0].position.z - pos.z) < 0.2) {
        coverElect[0].meta.infl.push(coverParts[i])
        coverParts[i].metadata2.infl = 0
        coverParts[i].metadata2.sync = true
        coverParts[i].metadata2.origPos = coverParts[i].getAbsolutePosition().clone()
        // console.log(coverParts[i])
        continue
      }
      
      // console.log(1,coverElect[1],Math.abs(coverElect[1].position.z - pos.z))
      if (Math.abs(coverElect[1].position.z - pos.z) < 0.2) {
        coverElect[1].meta.infl.push(coverParts[i])
        coverParts[i].metadata2.infl = 1
        coverParts[i].metadata2.sync = true
        coverParts[i].metadata2.origPos = coverParts[i].getAbsolutePosition().clone()
        // console.log(coverParts[i])
        continue
      }
    }
   
    await this.updateCoverHoles()
  },
    
  // update cover holes all parts sync/unsync
  async updateCoverHoles (askForSync = false) {
    for (let i = 0; i < this.holeMeshes.length; i++) {
      this.holeMeshes[i].dispose(false, true)
    }
    this.holeMeshes = []

    for (let i = 0; i < 6; i++) {
      if (!this.items[i]) {
        break
      }
      const kids = this.items[i].getDescendants()
      const kid = this.returnValidKid(kids)
      const parent = kid.parent
      kid.setParent(null)
      kid.dispose(false, true)
    
      if (this.items[i].orig) {
        const clona = this.items[i].orig.clone('orig')
        // console.log('clona ', clona)
        clona.material = this.items[i].orig.material.clone('mat')
        clona.isVisible = true
        clona.parent = parent
        
        this.addActionsToMesh(clona, this.items[i])
        this.addHoleToTheBox(i)
      }
    }

    for (let i = 6; i < this.items.length; i++) {
      if (this.items[i].metadata2 && this.items[i].metadata2.infl >= 0) {
        this.checkSyncParts(this.items[i])
      }
      else {
        this.checkUnsyncParts(this.items[i], askForSync)
      }
    }  

    await this.updateDBGenerateCover()
  },

  // check sync part with which side are sync
  checkSyncParts (part) {
    if (!part.drill) {
      return
    }
    const cover = this.items[part.metadata2.infl]

    const box = part.drill.clone('clone')
    box.setEnabled(true)
    box.setParent(null)

    if (part.metadata2.infl === 4 || part.metadata2.infl === 5) {
      box.position.y = cover.position.y
      if (part.metadata2.infl === 5) {
        box.position.y -= 0.25
      }
      else {
        box.position.y += 0.25
      }
    }
    else {
      if (part.metadata2.infl === 2 || part.metadata2.infl === 3) {
        box.position.x = cover.position.x
        if (part.metadata2.infl === 3) {
          box.position.x -= 0.25
        }
        else {
          box.position.x += 0.25
        }
      }
      else {
        box.position.z = cover.position.z
        if (part.metadata2.infl === 1) {
          box.position.z -= 0.25
        }
        else {
          box.position.z += 0.25
        }
      }
    }

    this.cropCover(cover, box)
  },

  // check if unsync part is outside of box
  checkOutsidePos (part) {
    part.body.refreshBoundingInfo()
    const dims = part.body.getBoundingInfo().boundingBox
    const max = dims.maximumWorld
    const min = dims.minimumWorld
 
    if ((this.items[4].position.y - max.y) < 0.01) {
      console.log('4 ', this.items[4])
      return this.items[4]
    }
    if ((this.items[5].position.y - min.y) > 0.01) {
      console.log('5 ', this.items[4])
      return this.items[5]
    }
    if ((this.items[2].position.x - max.x) < 0.01) {
      console.log('2 ', this.items[4])
      return this.items[2]
    }
    if ((this.items[3].position.x - min.x) > 0.01) {
      console.log('3 ', this.items[4])
      return this.items[3]
    }
    if ((this.items[0].position.z - max.z) < 0.01) {
      console.log('0 ', this.items[4])
      return this.items[0]
    }
    if ((this.items[1].position.z - min.z) > 0.01) {
      console.log('1 ', this.items[4])
      return this.items[1]
    }

    return null
  },

  // check unsync part which side intersect
  checkUnsyncParts (part, askForSync) {
    if (!part.drill) {
      return
    }
    
    const side = this.checkOutsidePos(part)
    if (side !== null) {
      const cover = side
    
      const box = part.drill.clone('clone')
      box.setEnabled(true)
      box.setParent(null)
      console.log(cover)
      if (cover.meta) {
        if (cover.meta.axis === 'x') {
          box.position.x = cover.position.x
          if (parseInt(cover.meta.cur) === 3) {
            box.position.x -= 0.25
          }
          else {
            box.position.x += 0.25
          }
        }
        else {
          if (cover.meta.axis === 'y') {
            box.position.y = cover.position.y
            if (parseInt(cover.meta.cur) === 5) {
              box.position.y -= 0.25
            }
            else {
              box.position.y += 0.25
            }
          }
          else {
            box.position.z = cover.position.z
            if (parseInt(cover.meta.cur) === 1) {
              box.position.z -= 0.25
            }
            else {
              box.position.z += 0.25
            }
          }
        }
   
        this.cropCover(cover, box)
  
        if (askForSync) {
          if (confirm('Do you want to sync it?')) {
            cover.meta.infl.push(part)
            part.metadata2.infl = cover.meta.cur
            part.metadata2.sync = true
  
            const offset = 0
            const coverPos = cover.position.clone()
            const drillPos = part.drill.getAbsolutePosition().clone()
            if (cover.meta.axis === 'x') {
              if (parseInt(cover.meta.cur) === 2) {
                part.position.x -= (drillPos.x + offset - coverPos.x)
              }
              else {
                part.position.x -= (drillPos.x - offset - coverPos.x)
              }
            }
            else {
              if (cover.meta.axis === 'y') {
                if (parseInt(cover.meta.cur) === 4) {
                  part.position.y -= (drillPos.y + offset - coverPos.y)
                }
                else {
                  part.position.y += (drillPos.y + offset - coverPos.y)
                }
              }
              else {
                if (parseInt(cover.meta.cur) === 0) {
                  part.position.z -= (drillPos.z + offset - coverPos.z)
                }
                else {
                  part.position.z -= (drillPos.z - offset - coverPos.z)
                }
                console.log(part.position)
              }
            }
            part.metadata2.origPos = part.getAbsolutePosition().clone()
            this.updateCoverHoles()
          }
        }
      }
    }
  },

  // crop cover
  cropCover (cover, box) {
    const kids = cover.getDescendants()
    const kid = this.returnValidKid(kids)
    const parent = kid.parent
    const newKid = this.createHoles(kid, box)
    newKid.parent = parent
    
    this.addActionsToMesh(newKid, cover)
  },

  createHoles (mesh1, mesh2) {
    const name = mesh1.name
    const material = mesh1.material
    const innerCSG = BABYLON.CSG.FromMesh(mesh2)
    const outerCSG = BABYLON.CSG.FromMesh(mesh1)

    mesh1.dispose()
    mesh2.dispose()

    const subCSG = outerCSG.subtract(innerCSG)

    this.scene.removeMesh(innerCSG)
    this.scene.removeMesh(outerCSG)

    mesh1 = subCSG.toMesh(name, material, this.scene)
    this.scene.removeMesh(subCSG)

    return mesh1
  },

  async updateDBGenerateCover () {
    const select = this.scene.selected
    for (let i = 0; i < 6; i++) {
      this.scene.selected = this.items[i]
      
      let rotation = this.scene.selected.rotation
      if (this.scene.selected.rotationQuaternion) {
        rotation = this.scene.selected.rotationQuaternion.toEulerAngles()
      }   
      const pos = [this.scene.selected.position.x, this.scene.selected.position.y, this.scene.selected.position.z]
      const rot = [rotation.x, rotation.y, rotation.z]
      const scale = [this.scene.selected.scaling.x, this.scene.selected.scaling.y, this.scene.selected.scaling.z]
      await this.updateDataToIndexDB(pos, rot, scale, null)
    }

    this.scene.selected = select
  }
}