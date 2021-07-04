import * as BABYLON from 'babylonjs'
import Whammy from 'whammy'
export const AnimationHandler = {
  objects: [],
  scene: null,
  canvas: null,
  speed: 1,
  record: false,
  cinematic: null,
  callback: null,
  positions: [new BABYLON.Vector3(-50, 0, 50), new BABYLON.Vector3(0, 50, 0), new BABYLON.Vector3(-50, 0, -50), new BABYLON.Vector3(50, 0, 50), new BABYLON.Vector3(50, 0, -50)],

  init (pcb3D, onEnd = null) {
    if (pcb3D.animatedObjects === undefined) {
      alert('animatedObjects error: We don\'t have set array of objects in pcb3D')
      return
    }

    if (pcb3D.scene === undefined) {
      alert('scene error: We don\'t have set scene in pcb3D')
      return
    }
    if (pcb3D.animationSpeed === undefined) {
      alert('animationSpeed error: We don\'t have set animationSpeed in pcb3D')
      return
    }
    if (pcb3D.recordScene === undefined) {
      alert('recordScene error: We don\'t have set recordScene in pcb3D')
      return
    }

    this.callback = onEnd
    this.objects = pcb3D.animatedObjects
    this.scene = pcb3D.scene
    this.speed = pcb3D.animationSpeed
    this.record = pcb3D.recordScene

    this.scene.stopAllAnimations()

    if (this.record) {
      this.cinematic = new Cinematic(this.scene)
    }

    this.beginAnimation()
  },

  beginAnimation () {
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].setEnabled(false)
      this.setAnimKeys(this.objects[i], i)
    }

    this.scene.beginAnimation(this.objects[0], 0, 30, false, this.speed)
    if (this.record) {
      this.cinematic.startRecording(30, 5000, true)
    }
  },

  setAnimKeys (object, index) {
    index++
    object.animations = []
    const prevPos = (object.PosOrig) ? object.PosOrig : object.position.clone()
    // const nextPos = new BABYLON.Vector3((Math.random() < 0.5) ? (Math.random() * -1) : (Math.random()) * 300, (Math.random() < 0.5) ? (Math.random() * -1) : (Math.random()) * 300, (Math.random() < 0.5) ? (Math.random() * -1) : (Math.random()) * 300)
    const nextPos = this.positions[(index % 5)]
    var animationCam = new BABYLON.Animation('Animation', 'position', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
    var a = []
    a.push({
      frame: 0,
      value: nextPos
    })
    a.push({
      frame: 30,
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

    var anim1 = new BABYLON.AnimationEvent(30, function () {
      if (index !== that.objects.length) {
        that.scene.beginAnimation(that.objects[index], 0, 30, false, that.speed)
      }
      else {
        // console.log('Animation finish')
        if (that.callback) {
          that.callback()
        }
        if (that.record) {
          // that.cinematic.endRecording()
        }
      }
    }, false)
    animationCam.addEvent(anim1)

    object.animations.push(animationCam)
  },

  animateThis (objects, scene, speed, record) {
    this.objects = objects
    this.scene = scene
    this.canvas = this.scene.getEngine().getRenderingCanvas()
    this.speed = speed
    this.record = record

    this.beginAnimation()
  }
}

var Cinematic = (function () {
  function Cinematic (scene) {
    this._frames = []
    this._scene = scene
    this._canvas = scene.getEngine().getRenderingCanvas()
    this._alpha = 0
    this._capture = 2
    this._targetFps = 30
    this._stopped = false
    this._lengthInMs = null
    this._downloadOnEnd = false

    var _this = this
    this._recordFrame = function () {
      _this._frames.push(_this._canvas.toDataURL('image/webp'))
    }
  }

  Cinematic.prototype.runRender = function () {
    // Aim; "Simulate" 60 scene FPS and capture frames at _targetFps.
    var _this = this
    _this._scene.render()
    _this._alpha++

    if (_this._alpha >= _this._capture) {
      _this._alpha = 0
      _this._recordFrame()
    }
    setTimeout(function () {
      if (!_this._stopped) {
        if (!_this._lengthInMs) {
          _this.runRender()
        }
        else if (_this._lengthInMs / 1000 >= _this._frames.length / _this._targetFps) {
          _this.runRender()
        }
        else {
          _this.endRecording()
        }
      }
    }, 50)
  }

  Cinematic.prototype.startRecording = function (fps, lengthInMs, downloadOnEnd) {
    var _this = this
    _this._stopped = false
    _this._targetFps = !isNaN(fps) && fps !== null ? fps : _this._targetFps
    _this._lengthInMs = !isNaN(lengthInMs) && lengthInMs !== null ? lengthInMs : null
    _this._downloadOnEnd = downloadOnEnd
    _this._capture = 60 / _this._targetFps

    _this._scene.getEngine().stopRenderLoop()
    _this.runRender()
  }

  Cinematic.prototype.endRecording = function () {
    var _this = this
    _this._stopped = true

    if (_this._downloadOnEnd) {
      _this.compileAndDownload()
    }
  }

  Cinematic.prototype.compileAndDownload = function () {
    var _this = this
    var video = new Whammy.Video(_this._targetFps, 1)

    // console.log(_this._frames.length)
    for (let i = 0; i < _this._frames.length; i++) {
      video.add(_this._frames[i])
    }

    var output = URL.createObjectURL(video.compile())

    var element = document.createElement('a')
    element.setAttribute('href', output)
    element.setAttribute('download', 'Cinematic_' + (+new Date()) + '.webm')
    element.style.display = 'none'

    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
  return Cinematic
}())

export function CreateText (scene, text, cfgs) {
  if (!cfgs || cfgs.length === 0) return

  var groundTexture = new BABYLON.DynamicTexture('dynamicTexture', 512, scene, true)
  groundTexture.name += 'Text'
  groundTexture.hasAlpha = true

  var dynamicMaterial = new BABYLON.StandardMaterial('mat', scene)
  dynamicMaterial.diffuseTexture = groundTexture
  dynamicMaterial.opacityTexture = groundTexture
  dynamicMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
  dynamicMaterial.backFaceCulling = false

  var ground = BABYLON.Mesh.CreateGround('name', 4, 4, 2, scene)
  ground.name += 'RandomText'
  ground.material = dynamicMaterial
  var font = 'bold ' + cfgs[3] + 'px Segoe UI'

  groundTexture.drawText(text, null, null, font, 'white', 'transparent')

  groundTexture.wAng = cfgs[2]
  ground.position.x = cfgs[0]
  ground.position.y = cfgs[4]
  ground.position.z = cfgs[1]

  return ground
}

export function DrawText (scene, text, cfgs, doNotWrap = false) {
  if (!cfgs || cfgs.length === 0) return
  if (!text) text = ''

  let groundTexture
  const fontSize = [40, 80, 120, 160, 200]
  if (cfgs.scaling) {
    groundTexture = new BABYLON.DynamicTexture('dText_' + Math.random(), {width: 256 * cfgs.scaling[0], height: 256 * cfgs.scaling[1] }, scene, true)
  }
  else {
    groundTexture = new BABYLON.DynamicTexture('dText_' + Math.random(), 512, scene, true)
  }
  groundTexture.hasAlpha = true

  const clearColor = (cfgs.background) ? cfgs.background : '#555555'
  const color = (cfgs.color) ? cfgs.color : '#ffffff'
  const font = fontSize[cfgs.font] + 'px Arial'
  const invertY = cfgs.invertY

  if (doNotWrap) {
    groundTexture.drawText(text, null, null, font, color, clearColor, invertY)
  }
  else {
    var size = groundTexture.getSize()
    var context = groundTexture.getContext()

    context.fillStyle = clearColor
    context.fillRect(0, 0, size.width, size.height)

    context.font = font
    context.fillStyle = color
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    wrapText(context, text, size.width / 2, size.height / 2, 512, fontSize[cfgs.font])

    groundTexture.wAng = cfgs.rotation + Math.PI / 2
    groundTexture.update(invertY)
  }
  
  return groundTexture
}

export function wrapText (context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')

  let line = ''
  let lines = 0
  let testLine
  let metrics
  let testWidth
  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + ' '
    metrics = context.measureText(testLine)
    testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      line = words[n] + ' '
      lines++
    }
    else {
      line = testLine
    }
  }

  line = ''
  var numberOfLines = 0

  y -= lineHeight * (lines / 2)
  if (y < lineHeight) {
    y = lineHeight
  }

  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + ' '
    metrics = context.measureText(testLine)
    testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
      numberOfLines++
    }
    else {
      line = testLine
    }
  }

  context.fillText(line, x, y)

  return numberOfLines
}

export function CreateDecal (scene, text, cfgs) {
  if (!cfgs.mesh) {
    return null
  }
    
  const kids = cfgs.mesh.getChildren()
  for (let i = 0; i < kids.length; i++) {
    kids[i].dispose(false, true)
  }

  const fontSize = [40, 80, 120]
  const texture = DrawText(scene, text, [512, 512, cfgs.rotation, fontSize[cfgs.font], cfgs.invertY, cfgs.background, cfgs.color])
  // const texture = new BABYLON.DynamicTexture('dynamicTexture', 512, scene, true)
  // texture.drawText(text, null, null, 'bold ' + fontSize[cfgs.font] + 'px Segoe UI', cfgs.color, 'transparent')

  var decalMaterial = new BABYLON.PBRMaterial("decalMat", scene)
  decalMaterial.albedoTexture = texture
  // decalMaterial.opacityTexture = texture
  decalMaterial.metallic = 1
  decalMaterial.roughness = 0.5
  decalMaterial.sideOrientation = 0
  decalMaterial.zOffset = -2
  
  var decal = BABYLON.MeshBuilder.CreateDecal("decal", cfgs.mesh, {position: new BABYLON.Vector3(0, cfgs.ypos, 0), normal: new BABYLON.Vector3(0, 1, 0)})
  decal.material = decalMaterial
  
  return decal
}