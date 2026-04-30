// ── Multi-slime physics engine ──────────────────────────────────────────────
const canvas = document.getElementById("slime-canvas")

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 1000)
camera.position.set(0, 5.8, 48)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
renderer.setPixelRatio(window.devicePixelRatio || 1)
renderer.setSize(innerWidth, innerHeight)
renderer.setClearColor(0x000000, 0)

scene.add(new THREE.AmbientLight(0xffffff, 0.92))
const dirLight = new THREE.DirectionalLight(0xffffff, 0.68)
dirLight.position.set(8, 12, 10)
scene.add(dirLight)

// ── Slider UI ───────────────────────────────────────────────────────────────
const sliderWrap = document.createElement("div")
sliderWrap.id = "slime-slider-wrap"
sliderWrap.style.cssText = `
  position: fixed;
  left: 4vw;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1vh;
  padding: 1.5vh 0.8vw;
  background: #c6c6c6;
  border: 3px solid #1d1d1d;
  box-shadow: inset 2px 2px 0 #f3f3f3, inset -2px -2px 0 #7a7a7a;
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  color: #3f3f3f;
  pointer-events: all;
  user-select: none;
`

const label = document.createElement("span")
label.textContent = "SLIMES"
label.style.cssText = `
  font-size: 7px;
  letter-spacing: 0.05em;
  text-align: center;
`

const countDisplay = document.createElement("span")
countDisplay.id = "slime-count-display"
countDisplay.textContent = "1"
countDisplay.style.cssText = `
  min-width: 16px;
  text-align: center;
`

const slider = document.createElement("input")
slider.type = "range"
slider.min = "1"
slider.max = "12"
slider.value = "1"
slider.orient = "vertical"
slider.style.cssText = `
  writing-mode: vertical-lr;
  direction: rtl;
  width: 2vw;
  height: 15vh;
  accent-color: #3f3f3f;
  cursor: pointer;
  appearance: slider-vertical;
  -webkit-appearance: slider-vertical;
`

sliderWrap.appendChild(label)
sliderWrap.appendChild(countDisplay)
sliderWrap.appendChild(slider)
document.body.appendChild(sliderWrap)

// ── Slime sprite sheet ───────────────────────────────────────────────────────
const SPRITE_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAFABAMAAADe49A5AAAAJFBMVEVHcExzwmJitkp7ymJaqkN7zmpocwpRoD5+v24WKBB1uWQKCgpRuk/sAAAAB3RSTlMAtLS0tLQI7015YAAAAuhJREFUeNrt3MFtgzAYgFFWYIWs0BW6QlfoCl2hK3SFrJDlKnzAimVTA67A5H2nRvjQPOVi2fzDUNk49TEXPr5NjXPvU7XrhtX9ZBr6CSBAgAABAgQIECBAgBu6TcXvn5jEatcBBAgQIECAAAECBAgQYOVWLiEKOnEDV6TMrdvD1iUlQIAAAQIECBAgQIAAtwLe5nJicdtWsW4j4GMKIECAAAECBAgQIECArweYYIUtWniQAC6vW/8fXOFQCSBAgAABAgQIECBAgOtKiJKzo3hiVLsOIECAAAECBAgQIECAAP8uXlG7PRd3bOEd/9p1e9i6pAQIECBAgAABAgQIEOCGchfYxlIV69YDFm+2AQQIECBAgAABAgQIsDvA1uON/2Vc8mPupL8sgAABAgQIECBAgAABrqv1eOPW6x6ZAAIECBAgQIAAAQIE2Dtg6/HGR41LBggQIECAAAECBAgQYHeADccbt173OQUQIECAAAECBAgQIMDLArYZb3z8uGSAAAECBAgQIECAAAGeH7D1eOPjxyUDBAgQIECAAAECBAjw/ICtxxsfNS4ZIECAAAECBAgQIECAPQHmLpyNpQ5YBxAgQIAAAQIECBAgwCsCLve1o0EAAQIECBAgQIAAAQLcDvg9d5+LTuFjsgQgQIAAAQogQIAAAQJsDBj+KgLGp/QAAgQIECBAgAABAgS4A/D+XA4wUQQIECBAgAIIECBAgACbbOUSxQiY7OIcKgEECBAgQIAAAQIUwCaAXrQBCBAgQIAAAQIECBDgiYjwAgQIECBAgAABAgQIcAdgckUt91J/7gJb7Ws4l778BhAgQIAAAQIECBAgwK2AyfevHS9W8bTICxAgQIAAAQIECBAgQICLr9IUx4tVPC2OUAYIECBAgAABAgQIECDA52+YQ1g+VKo4crrqQACAAAECBAgQIECAAAFuBfSiDUCAAAECBAgQIECAACVJkiRJkiRJkiRJkiRJkiRJkqS1/QLuvlkT9WDO3gAAAABJRU5ErkJggg=="

// ── Slime colors (inner cube tints) ─────────────────────────────────────────
const TINTS = [
  0x4fc54a, // classic green
  0x4a8ef5, // blue
  0xe05a5a, // red
  0xd4a017, // yellow
  0xb04ae0, // purple
  0xe07a2a, // orange
  0x2ad4c8, // cyan
  0xe04aa0, // pink
  0xffffff, // white
  0x888888, // grey
  0x5a3a1a, // brown
  0x1a3a5a, // dark blue
]

// ── Shared texture builder ───────────────────────────────────────────────────
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
    transparent: true, alphaTest: 0.01, opacity,
    side: THREE.DoubleSide
  })
}

// ── Slime factory ────────────────────────────────────────────────────────────
function createSlime(source, tintColor, size) {
  const group = new THREE.Group()

  const outerCube = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    [
      makeMaterial(source, 0, 8, 8, 8),
      makeMaterial(source, 16, 8, 8, 8),
      makeMaterial(source, 8, 0, 8, 8),
      makeMaterial(source, 16, 0, 8, 8),
      makeMaterial(source, 8, 8, 8, 8),
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
  group.add(outerCube, innerCube, faceBlock(0.9 * s, 1.05 * s, -0.9 * s, 0.45 * s), faceBlock(0.9 * s, 1.05 * s, 0.9 * s, 0.45 * s), faceBlock(0.56 * s, 0.56 * s, 0, -1.0 * s))
  scene.add(group)
  return group
}

// ── Physics state per slime ──────────────────────────────────────────────────
class SlimeEntity {
  constructor(source, index, total) {
    this.size = 3.5 + Math.random() * 3.5
    this.radius = this.size * 0.52
    this.tint = TINTS[index % TINTS.length]
    this.mesh = createSlime(source, this.tint, this.size)

    const spread = 30
    this.x = (Math.random() - 0.5) * spread
    this.y = 0
    this.vx = (Math.random() - 0.5) * 0.4
    this.vy = Math.random() * 0.3

    this.grounded = false
    this.cooldown = Math.floor(Math.random() * 120)
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

// ── Active slimes ────────────────────────────────────────────────────────────
let slimes = []
let mouseX = 0

window.addEventListener("mousemove", e => {
  mouseX = (e.clientX / innerWidth) * 2 - 1
})

// ── Bounds helper ────────────────────────────────────────────────────────────
function getBounds() {
  const d = camera.position.z
  const h = 2 * Math.tan(camera.fov * Math.PI / 360) * d
  return { halfW: (h * camera.aspect) / 2, bottom: -h / 2 }
}

// ── Physics constants ────────────────────────────────────────────────────────
const GRAVITY       = -0.055
const HOP_POWER     = 0.48
const CHASE         = 0.0022
const FRICTION      = 0.965
const BOUNCE        = 0.55
const SLIME_BOUNCE  = 0.45

// ── Spawn / despawn ──────────────────────────────────────────────────────────
function setSlimeCount(n) {
  while (slimes.length > n) {
    slimes.pop().dispose()
  }
  if (slimes.length < n) {
    withSource(source => {
      while (slimes.length < n) {
        slimes.push(new SlimeEntity(source, slimes.length, n))
      }
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

  slimes.forEach((s, i) => {
    const floor = b.bottom + s.radius

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

    const right = b.halfW - s.radius
    if (s.x < -right) { s.x = -right; s.vx = Math.abs(s.vx) * BOUNCE }
    if (s.x >  right) { s.x =  right; s.vx = -Math.abs(s.vx) * BOUNCE }

    if (s.y <= floor) {
      s.y = floor
      s.vy = 0
      s.grounded = true
    }

    for (let j = i + 1; j < slimes.length; j++) {
      const o = slimes[j]
      const minDist = s.radius + o.radius
      const diffX = s.x - o.x
      const diffY = s.y - o.y
      const dist = Math.sqrt(diffX * diffX + diffY * diffY) || 0.001

      if (dist < minDist) {
        const overlap = (minDist - dist) / 2
        const nx = diffX / dist
        const ny = diffY / dist

        s.x += nx * overlap
        s.y += ny * overlap
        o.x -= nx * overlap
        o.y -= ny * overlap

        const dvx = s.vx - o.vx
        const dvy = s.vy - o.vy
        const dot = dvx * nx + dvy * ny

        if (dot < 0) {
          const imp = dot * SLIME_BOUNCE
          s.vx -= imp * nx; s.vy -= imp * ny
          o.vx += imp * nx; o.vy += imp * ny
        }

        if (s.y <= b.bottom + s.radius) { s.y = b.bottom + s.radius; s.vy = 0; s.grounded = true }
        if (o.y <= b.bottom + o.radius) { o.y = b.bottom + o.radius; o.vy = 0; o.grounded = true }
      }
    }

    const wobble = Math.sin(t * 1.1 + s.wobbleOffset)
    const scaleY = 1 + wobble * 0.03
    const scaleX = 1 - wobble * 0.03

    s.mesh.position.set(s.x, s.y, 0)
    s.mesh.scale.set(scaleX, scaleY, scaleX)
  })

  renderer.render(scene, camera)
}

animate()

function resizeSlider() {
  const s = Math.min(innerWidth, innerHeight) / 900
  sliderWrap.style.fontSize = `${Math.round(7 * s)}px`
  slider.style.height = `${Math.round(140 * s)}px`
  slider.style.width = `${Math.round(20 * s)}px`
  sliderWrap.style.padding = `${Math.round(10 * s)}px ${Math.round(6 * s)}px`
  sliderWrap.style.gap = `${Math.round(8 * s)}px`
}

resizeSlider()

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  resizeSlider()
})