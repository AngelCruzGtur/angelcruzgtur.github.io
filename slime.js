// ── Multi-slime physics engine ──────────────────────────────────────────────
const canvas = document.getElementById("slime-canvas")

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 1000)
camera.position.set(0, 5.8, 48)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)) // cap at 2x — no need for 4K overhead
renderer.setSize(innerWidth, innerHeight)
renderer.setClearColor(0x000000, 0)

scene.add(new THREE.AmbientLight(0xffffff, 0.92))
const dirLight = new THREE.DirectionalLight(0xffffff, 0.68)
dirLight.position.set(8, 12, 10)
scene.add(dirLight)

// ── Bounds helper ────────────────────────────────────────────────────────────
function getBounds() {
  const d = camera.position.z
  const h = 2 * Math.tan(camera.fov * Math.PI / 360) * d
  return { halfW: (h * camera.aspect) / 2, halfH: h / 2, bottom: -h / 2 }
}

// ── Viewport scale — keeps slimes the same visual size on any screen ──────────
function viewScale() {
  return Math.min(innerWidth, innerHeight) / 900
}

// ── Slider / controls UI (responsive) ───────────────────────────────────────
const isMobile = () => innerWidth < 600

const sliderWrap = document.createElement("div")
sliderWrap.id = "slime-slider-wrap"

function applyWrapStyle() {
  if (isMobile()) {
    sliderWrap.style.cssText = `
      position: fixed;
      left: 12px;
      bottom: 20px;
      top: auto;
      transform: none;
      z-index: 10;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      padding: 7px 8px;
      background: #c6c6c6;
      border: 3px solid #1d1d1d;
      box-shadow: inset 2px 2px 0 #f3f3f3, inset -2px -2px 0 #7a7a7a;
      font-family: 'Press Start 2P', cursive;
      color: #3f3f3f;
      pointer-events: all;
      user-select: none;
    `
  } else {
    sliderWrap.style.cssText = `
      position: fixed;
      left: 32px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 10px;
      background: #c6c6c6;
      border: 3px solid #1d1d1d;
      box-shadow: inset 2px 2px 0 #f3f3f3, inset -2px -2px 0 #7a7a7a;
      font-family: 'Press Start 2P', cursive;
      color: #3f3f3f;
      pointer-events: all;
      user-select: none;
    `
  }
}

const label = document.createElement("span")
label.textContent = "SLIMES"
label.style.cssText = `font-size: 7px; letter-spacing: 0.05em; text-align: center;`

const countDisplay = document.createElement("span")
countDisplay.id = "slime-count-display"
countDisplay.textContent = "1"
countDisplay.style.cssText = `font-size: 11px; text-align: center; min-width: 18px;`

// Desktop: vertical slider
const slider = document.createElement("input")
slider.type = "range"
slider.min = "1"
slider.max = "12"
slider.value = "1"
slider.orient = "vertical"
slider.style.cssText = `
  writing-mode: vertical-lr;
  direction: rtl;
  width: 24px;
  height: 130px;
  accent-color: #3f3f3f;
  cursor: pointer;
  appearance: slider-vertical;
  -webkit-appearance: slider-vertical;
`

// Mobile: +/- buttons
function makePxBtn(text, onClick) {
  const btn = document.createElement("button")
  btn.textContent = text
  btn.style.cssText = `
    font-family: 'Press Start 2P', cursive;
    font-size: 13px;
    width: 32px;
    height: 32px;
    background: #c6c6c6;
    color: #3f3f3f;
    border: 3px solid #1d1d1d;
    box-shadow: inset 2px 2px 0 #f3f3f3, inset -2px -2px 0 #7a7a7a;
    cursor: pointer;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `
  btn.addEventListener("mouseenter",  () => { btn.style.background = "#9b9b9b" })
  btn.addEventListener("mouseleave",  () => { btn.style.background = "#c6c6c6" })
  btn.addEventListener("touchstart",  () => { btn.style.background = "#9b9b9b" }, { passive: true })
  btn.addEventListener("touchend",    () => { btn.style.background = "#c6c6c6" }, { passive: true })
  btn.addEventListener("click", onClick)
  return btn
}

let mobileCount = 1
const subBtn = makePxBtn("−", () => { mobileCount = Math.max(1, mobileCount - 1); setSlimeCount(mobileCount) })
const addBtn = makePxBtn("+", () => { mobileCount++; setSlimeCount(mobileCount) })

function rebuildWidget() {
  sliderWrap.innerHTML = ""
  applyWrapStyle()

  if (isMobile()) {
    sliderWrap.appendChild(subBtn)
    sliderWrap.appendChild(countDisplay)
    sliderWrap.appendChild(addBtn)
  } else {
    sliderWrap.appendChild(label)
    sliderWrap.appendChild(countDisplay)
    sliderWrap.appendChild(slider)
  }
}

rebuildWidget()
document.body.appendChild(sliderWrap)

// ── Sprite sheet ─────────────────────────────────────────────────────────────
const SPRITE_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAFABAMAAADe49A5AAAAJFBMVEVHcExzwmJitkp7ymJaqkN7zmpocwpRoD5+v24WKBB1uWQKCgpRuk/sAAAAB3RSTlMAtLS0tLQI7015YAAAAuhJREFUeNrt3MFtgzAYgFFWYIWs0BW6QlfoCl2hK3SFrJDlKnzAimVTA67A5H2nRvjQPOVi2fzDUNk49TEXPr5NjXPvU7XrhtX9ZBr6CSBAgAABAgQIECBAgBu6TcXvn5jEatcBBAgQIECAAAECBAgQYOVWLiEKOnEDV6TMrdvD1iUlQIAAAQIECBAgQIAAtwLe5nJicdtWsW4j4GMKIECAAAECBAgQIECArweYYIUtWniQAC6vW/8fXOFQCSBAgAABAgQIECBAgOtKiJKzo3hiVLsOIECAAAECBAgQIECAAP8uXlG7PRd3bOEd/9p1e9i6pAQIECBAgAABAgQIEOCGchfYxlIV69YDFm+2AQQIECBAgAABAgQIsDvA1uON/2Vc8mPupL8sgAABAgQIECBAgAABrqv1eOPW6x6ZAAIECBAgQIAAAQIE2Dtg6/HGR41LBggQIECAAAECBAgQYHeADccbt173OQUQIECAAAECBAgQIMDLArYZb3z8uGSAAAECBAgQIECAAAGeH7D1eOPjxyUDBAgQIECAAAECBAjw/ICtxxsfNS4ZIECAAAECBAgQIECAPQHmLpyNpQ5YBxAgQIAAAQIECBAgwCsCLve1o0EAAQIECBAgQIAAAQLcDvg9d5+LTuFjsgQgQIAAAQogQIAAAQJsDBj+KgLGp/QAAgQIECBAgAABAgS4A/D+XA4wUQQIECBAgAIIECBAgACbbOUSxQiY7OIcKgEECBAgQIAAAQIUwCaAXrQBCBAgQIAAAQIECBDgiYjwAgQIECBAgAABAgQIcAdgckUt91J/7gJb7Ws4l778BhAgQIAAAQIECBAgwK2AyfevHS9W8bTICxAgQIAAAQIECBAgQICLr9IUx4tVPC2OUAYIECBAgAABAgQIECDA52+YQ1g+VKo4crrqQACAAAECBAgQIECAAAFuBfSiDUCAAAECBAgQIECAACVJkiRJkiRJkiRJkiRJkiRJkqS1/QLuvlkT9WDO3gAAAABJRU5ErkJggg=="

const TINTS = [
  0x4fc54a, 0x4a8ef5, 0xe05a5a, 0xd4a017, 0xb04ae0,
  0xe07a2a, 0x2ad4c8, 0xe04aa0, 0xffffff, 0x888888,
  0x5a3a1a, 0x1a3a5a,
]

// ── Shared texture loader ────────────────────────────────────────────────────
let sharedSource = null
let sourceReady = false
const pendingCallbacks = []

function withSource(cb) {
  if (sourceReady) { cb(sharedSource); return }
  pendingCallbacks.push(cb)
  if (!sharedSource) {
    sharedSource = new Image()
    sharedSource.onload = () => {
      sourceReady = true
      pendingCallbacks.forEach(fn => fn(sharedSource))
      pendingCallbacks.length = 0
    }
    sharedSource.src = SPRITE_SRC
  }
}

function cropTexture(source, x, y, w, h, outSize = 64) {
  const scale = source.width / 64
  const face = document.createElement("canvas")
  face.width = outSize; face.height = outSize
  const ctx = face.getContext("2d")
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(source, x * scale, y * scale, w * scale, h * scale, 0, 0, outSize, outSize)
  const tex = new THREE.CanvasTexture(face)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  return tex
}

function makeMaterial(source, x, y, w, h, opacity = 0.72) {
  return new THREE.MeshLambertMaterial({
    map: cropTexture(source, x, y, w, h),
    transparent: true, alphaTest: 0.01, opacity, side: THREE.DoubleSide
  })
}

// ── Slime mesh builder ───────────────────────────────────────────────────────
function createSlime(source, tintColor, size) {
  const group = new THREE.Group()

  const outerCube = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    [
      makeMaterial(source,  0, 8, 8, 8),
      makeMaterial(source, 16, 8, 8, 8),
      makeMaterial(source,  8, 0, 8, 8),
      makeMaterial(source, 16, 0, 8, 8),
      makeMaterial(source,  8, 8, 8, 8),
      makeMaterial(source, 24, 8, 8, 8),
    ]
  )

  const innerCube = new THREE.Mesh(
    new THREE.BoxGeometry(size * 0.7, size * 0.7, size * 0.7),
    new THREE.MeshLambertMaterial({ color: tintColor, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
  )
  innerCube.position.y = -0.08

  const faceMat = new THREE.MeshBasicMaterial({ color: 0x315927, transparent: true, opacity: 0.62 })
  function faceBlock(w, h, fx, fy) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), faceMat)
    m.position.set(fx, fy, size / 2 + 0.1)
    return m
  }

  const s = size / 4.7
  group.add(
    outerCube, innerCube,
    faceBlock(0.9 * s, 1.05 * s, -0.9 * s,  0.45 * s),
    faceBlock(0.9 * s, 1.05 * s,  0.9 * s,  0.45 * s),
    faceBlock(0.56 * s, 0.56 * s, 0,        -1.0 * s)
  )
  scene.add(group)
  return group
}

// ── SlimeEntity ──────────────────────────────────────────────────────────────
class SlimeEntity {
  constructor(source, index) {
    // Scale size to viewport so slimes look consistent on any screen
    const vs = viewScale()
    this.size   = (4.7 + Math.random() * 2.0) * vs
    this.radius = this.size * 0.52
    this.tint   = TINTS[index % TINTS.length]
    this.mesh   = createSlime(source, this.tint, this.size)

    const b = getBounds()
    this.x  = (Math.random() - 0.5) * b.halfW * 1.2
    this.y  = b.bottom + this.radius
    this.vx = (Math.random() - 0.5) * 0.4
    this.vy = Math.random() * 0.3

    this.grounded     = false
    this.cooldown     = Math.floor(Math.random() * 120)
    this.wobbleOffset = Math.random() * Math.PI * 2
  }

  dispose() {
    scene.remove(this.mesh)
    this.mesh.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }
}

// ── State ────────────────────────────────────────────────────────────────────
let slimes = []
let mouseX = 0
let tilt = { x: 0, y: -1, active: false, permissionRequested: false }
let screenAngle = 0
let motionListenersAttached = false

window.addEventListener("mousemove", e => {
  mouseX = (e.clientX / innerWidth) * 2 - 1
})

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function updateScreenAngle() {
  if (screen.orientation && typeof screen.orientation.angle === "number") {
    screenAngle = screen.orientation.angle
    return
  }
  if (typeof window.orientation === "number") {
    screenAngle = window.orientation
    return
  }
  screenAngle = 0
}

function rotateByScreen(x, y, angle) {
  const normalized = ((angle % 360) + 360) % 360
  if (normalized === 90) return { x: -y, y: x }
  if (normalized === 180) return { x: -x, y: -y }
  if (normalized === 270) return { x: y, y: -x }
  return { x, y }
}

function handleOrientation(event) {
  if (typeof event.beta !== "number" || typeof event.gamma !== "number") return
  updateScreenAngle()

  const sx = clamp(event.gamma / 35, -1.35, 1.35)
  const sy = clamp(event.beta / 35, -1.35, 1.35)
  const rotated = rotateByScreen(sx, sy, screenAngle)

  tilt.x = rotated.x
  tilt.y = -rotated.y
  tilt.active = true
}

function handleMotion(event) {
  const accel = event.accelerationIncludingGravity
  if (!accel || typeof accel.x !== "number" || typeof accel.y !== "number") return
  updateScreenAngle()

  const sx = clamp(accel.x / 7.5, -1.35, 1.35)
  const sy = clamp(accel.y / 7.5, -1.35, 1.35)
  const rotated = rotateByScreen(sx, -sy, screenAngle)

  tilt.x = rotated.x
  tilt.y = rotated.y
  tilt.active = true
}

function attachMotionListeners() {
  if (motionListenersAttached) return
  motionListenersAttached = true
  window.addEventListener("deviceorientation", handleOrientation)
  window.addEventListener("devicemotion", handleMotion)
}

function enableTiltControls() {
  if (!isMobile() || tilt.active || tilt.permissionRequested) return
  tilt.permissionRequested = true
  updateScreenAngle()

  const needsPermission =
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"

  if (needsPermission) {
    DeviceOrientationEvent.requestPermission()
      .then(result => {
        if (result === "granted") {
          attachMotionListeners()
        } else {
          tilt.permissionRequested = false
        }
      })
      .catch(() => {
        tilt.permissionRequested = false
      })
    return
  }

  if ("DeviceOrientationEvent" in window || "DeviceMotionEvent" in window) {
    attachMotionListeners()
    return
  }
}

window.addEventListener("orientationchange", updateScreenAngle)
window.addEventListener("touchend", enableTiltControls, { passive: true })
window.addEventListener("pointerup", enableTiltControls, { passive: true })
window.addEventListener("click", enableTiltControls)
if (isMobile()) enableTiltControls()

// ── Physics constants ────────────────────────────────────────────────────────
const GRAVITY      = -0.055
const HOP_POWER    = 0.48
const CHASE        = 0.0022
const FRICTION     = 0.965
const BOUNCE       = 0.55
const SLIME_BOUNCE = 0.45
const MOBILE_GRAVITY = 0.06
const MOBILE_DRAG    = 0.992

// ── Spawn / despawn ──────────────────────────────────────────────────────────
function setSlimeCount(n) {
  while (slimes.length > n) slimes.pop().dispose()
  if (slimes.length < n) {
    withSource(source => {
      while (slimes.length < n) slimes.push(new SlimeEntity(source, slimes.length))
    })
  }
  countDisplay.textContent = n
}

slider.addEventListener("input", () => setSlimeCount(parseInt(slider.value)))
setSlimeCount(1)

// ── Animation loop ───────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate)

  const b = getBounds()
  const t = performance.now() * 0.002
  const targetX = mouseX * (b.halfW - 2)
  const mobileTiltMode = isMobile() && tilt.active

  slimes.forEach((s, i) => {
    const floor = b.bottom + s.radius
    const right = b.halfW - s.radius
    const ceiling = b.halfH - s.radius

    if (mobileTiltMode) {
      s.grounded = false
      s.vx += tilt.x * MOBILE_GRAVITY
      s.vy += tilt.y * MOBILE_GRAVITY
      s.vx *= MOBILE_DRAG
      s.vy *= MOBILE_DRAG
      s.x += s.vx
      s.y += s.vy

      if (s.x < -right) { s.x = -right; s.vx =  Math.abs(s.vx) * BOUNCE }
      if (s.x >  right) { s.x =  right; s.vx = -Math.abs(s.vx) * BOUNCE }
      if (s.y < floor) { s.y = floor; s.vy = Math.abs(s.vy) * BOUNCE }
      if (s.y > ceiling) { s.y = ceiling; s.vy = -Math.abs(s.vy) * BOUNCE }
    } else {
      const dx = targetX - s.x
      s.vx += dx * CHASE
      s.vx *= FRICTION

      if (s.cooldown > 0) s.cooldown--
      if (s.grounded && Math.abs(dx) > 5 + s.size && s.cooldown === 0) {
        s.vy = HOP_POWER * (s.size / 4.7)
        s.grounded = false
        s.cooldown = 180 + Math.floor(Math.random() * 120)
      }

      s.vy += GRAVITY
      s.x += s.vx
      s.y += s.vy

      if (s.x < -right) { s.x = -right; s.vx =  Math.abs(s.vx) * BOUNCE }
      if (s.x >  right) { s.x =  right; s.vx = -Math.abs(s.vx) * BOUNCE }
      if (s.y <= floor)  { s.y = floor;  s.vy = 0; s.grounded = true }
    }

    // Slime-slime collisions
    for (let j = i + 1; j < slimes.length; j++) {
      const o = slimes[j]
      const minDist = s.radius + o.radius
      const diffX   = s.x - o.x
      const diffY   = s.y - o.y
      const dist    = Math.sqrt(diffX * diffX + diffY * diffY) || 0.001

      if (dist < minDist) {
        const overlap = (minDist - dist) / 2
        const nx = diffX / dist
        const ny = diffY / dist

        s.x += nx * overlap; s.y += ny * overlap
        o.x -= nx * overlap; o.y -= ny * overlap

        const dvx = s.vx - o.vx
        const dvy = s.vy - o.vy
        const dot = dvx * nx + dvy * ny

        if (dot < 0) {
          const imp = dot * SLIME_BOUNCE
          s.vx -= imp * nx; s.vy -= imp * ny
          o.vx += imp * nx; o.vy += imp * ny
        }

        if (!mobileTiltMode) {
          if (s.y <= b.bottom + s.radius) { s.y = b.bottom + s.radius; s.vy = 0; s.grounded = true }
          if (o.y <= b.bottom + o.radius) { o.y = b.bottom + o.radius; o.vy = 0; o.grounded = true }
        }
      }
    }

    const wobble = Math.sin(t * 1.1 + s.wobbleOffset)
    s.mesh.position.set(s.x, s.y, 0)
    s.mesh.scale.set(1 - wobble * 0.03, 1 + wobble * 0.03, 1 - wobble * 0.03)
    if (mobileTiltMode) {
      s.mesh.rotation.x = clamp(-tilt.y * 0.28 + s.vy * 0.08, -0.8, 0.8)
      s.mesh.rotation.y = clamp(tilt.x * 0.32 + s.vx * 0.08, -0.9, 0.9)
      s.mesh.rotation.z += (s.vx * 0.02 - s.vy * 0.015) - s.mesh.rotation.z * 0.08
    } else {
      s.mesh.rotation.x *= 0.85
      s.mesh.rotation.y *= 0.85
      s.mesh.rotation.z *= 0.82
    }
  })

  renderer.render(scene, camera)
}

animate()

// ── Resize ───────────────────────────────────────────────────────────────────
let lastMobile = isMobile()

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)

  // Rebuild widget if mobile/desktop breakpoint crossed
  const nowMobile = isMobile()
  if (nowMobile !== lastMobile) {
    lastMobile = nowMobile
    rebuildWidget()
  }

  // Clamp slimes back inside new bounds
  const b = getBounds()
  slimes.forEach(s => {
    const right = b.halfW - s.radius
    const floor = b.bottom + s.radius
    const ceiling = b.halfH - s.radius
    if (s.x < -right) s.x = -right
    if (s.x >  right) s.x =  right
    if (s.y < floor) { s.y = floor; s.vy = 0; s.grounded = true }
    if (s.y > ceiling) { s.y = ceiling; s.vy = 0 }
  })
})
