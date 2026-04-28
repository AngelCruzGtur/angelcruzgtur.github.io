// use the canvas from your main page
const canvas = document.getElementById("slime-canvas")

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 1000)
camera.position.set(0, 5.8, 48)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({
	canvas,
	alpha: true,
	antialias: false
})

renderer.setPixelRatio(window.devicePixelRatio || 1)
renderer.setSize(innerWidth, innerHeight)
renderer.setClearColor(0x000000, 0)

scene.add(new THREE.AmbientLight(0xffffff, 0.92))

const light = new THREE.DirectionalLight(0xffffff, 0.68)
light.position.set(8, 12, 10)
scene.add(light)

const source = new Image()

source.onload = () => {

	const slime = new THREE.Group()
	scene.add(slime)

	const size = 4.7
	const scale = source.width / 64

	function cropTexture(x, y, w, h, outSize = 64) {
		const face = document.createElement("canvas")
		face.width = outSize
		face.height = outSize

		const ctx = face.getContext("2d")
		ctx.imageSmoothingEnabled = false

		ctx.drawImage(
			source,
			x * scale,
			y * scale,
			w * scale,
			h * scale,
			0,
			0,
			outSize,
			outSize
		)

		const tex = new THREE.CanvasTexture(face)
		tex.magFilter = THREE.NearestFilter
		tex.minFilter = THREE.NearestFilter
		return tex
	}

	function material(x, y, w, h, opacity = 0.72) {
		return new THREE.MeshLambertMaterial({
			map: cropTexture(x, y, w, h),
			transparent: true,
			alphaTest: 0.01,
			opacity,
			side: THREE.DoubleSide
		})
	}

	const outerCube = new THREE.Mesh(
		new THREE.BoxGeometry(size, size, size),
		[
			material(0, 8, 8, 8),
			material(16, 8, 8, 8),
			material(8, 0, 8, 8),
			material(16, 0, 8, 8),
			material(8, 8, 8, 8),
			material(24, 8, 8, 8)
		]
	)

	const innerCube = new THREE.Mesh(
		new THREE.BoxGeometry(size * 0.7, size * 0.7, size * 0.7),
		new THREE.MeshLambertMaterial({
			color: 0x4fc54a,
			transparent: true,
			opacity: 0.42,
			side: THREE.DoubleSide
		})
	)

	innerCube.position.y = -0.08

	const faceMat = new THREE.MeshBasicMaterial({
		color: 0x315927,
		transparent: true,
		opacity: 0.62
	})

	function faceBlock(w, h, x, y) {
		const mesh = new THREE.Mesh(
			new THREE.BoxGeometry(w, h, 0.14),
			faceMat
		)
		mesh.position.set(x, y, size / 2 + 0.1)
		return mesh
	}

	const leftEye = faceBlock(0.9, 1.05, -0.9, 0.45)
	const rightEye = faceBlock(0.9, 1.05, 0.9, 0.45)
	const mouth = faceBlock(0.56, 0.56, 0, -1.0)

	slime.add(outerCube, innerCube, leftEye, rightEye, mouth)

	let mouseX = 0
	let x = 0
	let y = 0
	let vx = 0
	let vy = 0

	const gravity = -0.055
	const hopPower = 0.48
	const chaseStrength = 0.0028
	const friction = 0.965

	let grounded = true
	let cooldown = 0
	let squish = 0

	window.addEventListener("mousemove", e => {
		mouseX = (e.clientX / innerWidth) * 2 - 1
	})

	function bounds() {
		const d = camera.position.z
		const h = 2 * Math.tan(camera.fov * Math.PI / 360) * d
		return {
			width: h * camera.aspect,
			bottom: -h / 2
		}
	}

	function animate() {
		requestAnimationFrame(animate)

		const b = bounds()
		const halfWidth = size * 0.52
		const halfHeight = size * 0.5
		const floor = b.bottom + halfHeight
		const target = mouseX * (b.width / 2 - halfWidth)

		const dx = target - x

		vx += dx * chaseStrength
		vx *= friction

		if (cooldown > 0) cooldown--

		if (grounded && Math.abs(dx) > 6 && cooldown === 0) {
			vy = hopPower
			grounded = false
			cooldown = 210
		}

		vy += gravity

		x += vx
		y += vy

		const bounce = 0.65

		if (x < -b.width / 2 + halfWidth) {
			x = -b.width / 2 + halfWidth
			vx = -vx * bounce
		}

		if (x > b.width / 2 - halfWidth) {
			x = b.width / 2 - halfWidth
			vx = -vx * bounce
		}

		if (y <= floor) {
			y = floor
			vy = 0
			grounded = true
		}

		const t = performance.now() * 0.002
		const scaleY = 1 + Math.sin(t) * 0.03
		const scaleX = 1 - Math.sin(t) * 0.03

		slime.position.set(x, y, 0)
		slime.scale.set(scaleX, scaleY, scaleX)

		renderer.render(scene, camera)
	}

	animate()
}

source.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAFABAMAAADe49A5AAAAJFBMVEVHcExzwmJitkp7ymJaqkN7zmpocwpRoD5+v24WKBB1uWQKCgpRuk/sAAAAB3RSTlMAtLS0tLQI7015YAAAAuhJREFUeNrt3MFtgzAYgFFWYIWs0BW6QlfoCl2hK3SFrJDlKnzAimVTA67A5H2nRvjQPOVi2fzDUNk49TEXPr5NjXPvU7XrhtX9ZBr6CSBAgAABAgQIECBAgBu6TcXvn5jEatcBBAgQIECAAAECBAgQYOVWLiEKOnEDV6TMrdvD1iUlQIAAAQIECBAgQIAAtwLe5nJicdtWsW4j4GMKIECAAAECBAgQIECArweYYIUtWniQAC6vW/8fXOFQCSBAgAABAgQIECBAgOtKiJKzo3hiVLsOIECAAAECBAgQIECAAP8uXlG7PRd3bOEd/9p1e9i6pAQIECBAgAABAgQIEOCGchfYxlIV69YDFm+2AQQIECBAgAABAgQIsDvA1uON/2Vc8mPupL8sgAABAgQIECBAgAABrqv1eOPW6x6ZAAIECBAgQIAAAQIE2Dtg6/HGR41LBggQIECAAAECBAgQYHeADccbt173OQUQIECAAAECBAgQIMDLArYZb3z8uGSAAAECBAgQIECAAAGeH7D1eOPjxyUDBAgQIECAAAECBAjw/ICtxxsfNS4ZIECAAAECBAgQIECAPQHmLpyNpQ5YBxAgQIAAAQIECBAgwCsCLve1o0EAAQIECBAgQIAAAQLcDvg9d5+LTuFjsgQgQIAAAQogQIAAAQJsDBj+KgLGp/QAAgQIECBAgAABAgS4A/D+XA4wUQQIECBAgAIIECBAgACbbOUSxQiY7OIcKgEECBAgQIAAAQIUwCaAXrQBCBAgQIAAAQIECBDgiYjwAgQIECBAgAABAgQIcAdgckUt91J/7gJb7Ws4l778BhAgQIAAAQIECBAgwK2AyfevHS9W8bTICxAgQIAAAQIECBAgQICLr9IUx4tVPC2OUAYIECBAgAABAgQIECDA52+YQ1g+VKo4crrqQACAAAECBAgQIECAAAFuBfSiDUCAAAECBAgQIECAACVJkiRJkiRJkiRJkiRJkiRJkqS1/QLuvlkT9WDO3gAAAABJRU5ErkJggg=="

window.addEventListener("resize", () => {
	camera.aspect = innerWidth / innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(innerWidth, innerHeight)
})