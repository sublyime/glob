import './styles.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import WebGL from 'three/examples/jsm/capabilities/WebGL.js'
import Globe from 'three-globe'
import { scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'

const RADIUS = 200

function showWebGLMessage(message) {
  const container = document.getElementById('globe-container')
  const warning = document.createElement('div')
  warning.style.position = 'absolute'
  warning.style.top = '50%'
  warning.style.left = '50%'
  warning.style.transform = 'translate(-50%, -50%)'
  warning.style.color = '#fff'
  warning.style.padding = '24px 32px'
  warning.style.background = 'rgba(0, 0, 0, 0.8)'
  warning.style.border = '1px solid #00ffd5'
  warning.style.borderRadius = '12px'
  warning.style.maxWidth = '420px'
  warning.style.textAlign = 'center'
  warning.style.fontFamily = 'Inter, Arial, sans-serif'
  warning.innerHTML = `<strong>WebGL is unavailable</strong><br><br>${message}`
  container.style.position = 'relative'
  container.appendChild(warning)
}

if (!WebGL.isWebGLAvailable()) {
  showWebGLMessage('Your browser or system does not support WebGL. Try a different browser, enable hardware acceleration, or update your graphics drivers.')
  throw new Error('WebGL is not available')
}

const globeContainer = document.getElementById('globe-container')
if (!globeContainer) {
  throw new Error('Globe container element not found')
}

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(0x000011, 1)
renderer.toneMappingExposure = 1
globeContainer.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000011)

const camera = new THREE.PerspectiveCamera(60, globeContainer.clientWidth / globeContainer.clientHeight, 1, RADIUS * 20)
camera.position.set(RADIUS * 1.9, RADIUS * 0.8, RADIUS * 2.2)
camera.lookAt(0, 0, 0)

function resizeRenderer() {
  const width = Math.max(320, globeContainer.clientWidth)
  const height = Math.max(240, globeContainer.clientHeight)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}
resizeRenderer()

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.14
controls.enablePan = true
controls.panSpeed = 1.6
controls.enableZoom = true
controls.zoomSpeed = 0.8
controls.enableRotate = true
controls.rotateSpeed = 0.6
controls.screenSpacePanning = false
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
}
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
}
controls.minDistance = RADIUS * 1.05
controls.maxDistance = RADIUS * 8
controls.minPolarAngle = 0.05
controls.maxPolarAngle = Math.PI - 0.05
controls.target.set(0, 0, 0)
controls.update()

renderer.domElement.style.touchAction = 'none'

const light = new THREE.DirectionalLight(0xffffff, 0.9)
light.position.set(1, 1, 1)
scene.add(light)
scene.add(new THREE.AmbientLight(0xbbccff, 0.2))

// starfield
function makeStars() {
  const starsGeometry = new THREE.BufferGeometry()
  const starsCount = 6000
  const positions = new Float32Array(starsCount * 3)
  for (let i = 0; i < starsCount; i++) {
    const r = 1200 * Math.random() + 600
    const phi = Math.acos(2 * Math.random() - 1)
    const theta = 2 * Math.PI * Math.random()
    positions[3 * i] = r * Math.sin(phi) * Math.cos(theta)
    positions[3 * i + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[3 * i + 2] = r * Math.cos(phi)
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, opacity: 0.8, transparent: true })
  const stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)
}
makeStars()

const world = new Globe({ animateIn: false, waitForGlobeReady: false })
world.globeMaterial().color = new THREE.Color(0x122140)
world.globeMaterial().emissive = new THREE.Color(0x002244)
world.globeMaterial().emissiveIntensity = 0.8
world.globeMaterial().flatShading = true

// set a dark, slightly emissive Earth texture for futuristic look
fetch('https://unpkg.com/three-globe/example/img/earth-night.jpg')
  .then(() => {
    world.globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
  })
  .catch(() => console.warn('Globe texture failed to load, using fallback color.'))

if (typeof world.showAtmosphere === 'function') {
  world.showAtmosphere(false)
} else {
  world.showAtmosphere = false
}

if (typeof world.showGlobe === 'function') {
  world.showGlobe(true)
} else {
  world.showGlobe = true
}

if (typeof world.showGraticules === 'function') {
  world.showGraticules(true)
} else {
  world.showGraticules = true
}

scene.add(world)

// outer glow sphere
const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffd5, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.02 })
const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.02, 48, 48), glowMat)
scene.add(glowSphere)

// color scale for heat
const colorScale = scaleSequential(interpolateInferno).domain([0, 1])

let points = []
let baseTime = Date.now()
const navState = {
  panX: 0,
  panY: 0,
  rotateX: 0,
  rotateY: 0,
  zoomIn: 0,
  zoomOut: 0
}

function applyPoints(data, latKey = 'lat', lngKey = 'lng', weightKey = 'weight'){
  const source = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  points = source.map(d => ({
    lat: +d[latKey],
    lng: +d[lngKey],
    weight: d[weightKey] != null ? +d[weightKey] : 1,
    label: d.label || d.name || `${d[latKey]}, ${d[lngKey]}`
  })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))

  const max = Math.max(...points.map(p => p.weight), 1)
  const altitudeScale = d => 0.03 * (d.weight / max) + 0.005
  const radiusScale = d => 0.8 + 1.2 * (d.weight / max)

  world.pointsData(points)
    .pointLat('lat')
    .pointLng('lng')
    .pointAltitude(altitudeScale)
    .pointColor(d => colorScale(d.weight / max))
    .pointRadius(radiusScale)

  world.labelsData(points)
    .labelLat('lat')
    .labelLng('lng')
    .labelAltitude(0.01)
    .labelText(d => d.label || `${d.lat}, ${d.lng}`)
    .labelSize(1.5)
    .labelColor(() => 'white')
}

// animate pulse and auto-rotate
let lastFrameTime = Date.now()
function animate(){
  requestAnimationFrame(animate)
  const now = Date.now()
  const deltaSeconds = Math.min(0.05, (now - lastFrameTime) / 1000)
  lastFrameTime = now

  const t = (now - baseTime) / 1000
  world.rotation.y += 0.0008

  applyKeyboardNavigation(deltaSeconds)

  // pulse altitude
  const pts = world.pointsData()
  if (Array.isArray(pts) && pts.length > 0) {
    const max = Math.max(...pts.map(p => p.weight), 1)
    world.pointAltitude(d => {
      const base = 0.03 * (d.weight / max) + 0.005
      return base * (1 + 0.35 * Math.sin(t * 2 + d.weight))
    })
  }
  controls.update()
  renderer.render(scene, camera)
}
animate()

// UI wiring
document.getElementById('dataUrl').value = '/data/airports_delay.json'
document.getElementById('loadBtn').addEventListener('click', async () => {
  const url = document.getElementById('dataUrl').value.trim()
  const latKey = document.getElementById('latKey').value.trim() || 'lat'
  const lngKey = document.getElementById('lngKey').value.trim() || 'lng'
  const weightKey = document.getElementById('weightKey').value.trim() || 'weight'
  try{
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    applyPoints(data, latKey, lngKey, weightKey)
  }catch(e){
    console.error('Failed to load', e)
    alert('Failed to load dataset: ' + e.message)
  }
})

// load default dataset on start
document.getElementById('loadBtn').click()

// keyboard and advanced navigation
const keyMap = {
  ArrowLeft: 'panX',
  ArrowRight: 'panX',
  ArrowUp: 'panY',
  ArrowDown: 'panY',
  KeyA: 'panX',
  KeyD: 'panX',
  KeyW: 'panY',
  KeyS: 'panY',
  KeyQ: 'rotateX',
  KeyE: 'rotateX',
  PageUp: 'rotateY',
  PageDown: 'rotateY',
  Equal: 'zoomIn',
  NumpadAdd: 'zoomIn',
  Minus: 'zoomOut',
  NumpadSubtract: 'zoomOut'
}

window.addEventListener('keydown', (event) => {
  if (!keyMap[event.code]) return
  event.preventDefault()
  const stateKey = keyMap[event.code]
  if (stateKey === 'panX') {
    navState.panX = event.code === 'ArrowRight' || event.code === 'KeyD' ? 1 : event.code === 'ArrowLeft' || event.code === 'KeyA' ? -1 : navState.panX
  } else if (stateKey === 'panY') {
    navState.panY = event.code === 'ArrowUp' || event.code === 'KeyW' ? 1 : event.code === 'ArrowDown' || event.code === 'KeyS' ? -1 : navState.panY
  } else if (stateKey === 'rotateX') {
    navState.rotateX = event.code === 'KeyQ' ? 1 : event.code === 'KeyE' ? -1 : navState.rotateX
  } else if (stateKey === 'rotateY') {
    navState.rotateY = event.code === 'PageUp' ? 1 : event.code === 'PageDown' ? -1 : navState.rotateY
  } else if (stateKey === 'zoomIn') {
    navState.zoomIn = 1
  } else if (stateKey === 'zoomOut') {
    navState.zoomOut = 1
  }
})

window.addEventListener('keyup', (event) => {
  if (!keyMap[event.code]) return
  event.preventDefault()
  const stateKey = keyMap[event.code]
  if (stateKey === 'panX') navState.panX = 0
  if (stateKey === 'panY') navState.panY = 0
  if (stateKey === 'rotateX') navState.rotateX = 0
  if (stateKey === 'rotateY') navState.rotateY = 0
  if (stateKey === 'zoomIn') navState.zoomIn = 0
  if (stateKey === 'zoomOut') navState.zoomOut = 0
})

function applyKeyboardNavigation(deltaSeconds) {
  const panDistance = RADIUS * 0.02 * deltaSeconds
  const rotateAngle = 0.7 * deltaSeconds
  const zoomFactor = Math.pow(0.95, deltaSeconds * 10)

  if (navState.panX !== 0) controls.panLeft(navState.panX * panDistance, camera.matrix)
  if (navState.panY !== 0) controls.panUp(navState.panY * panDistance, camera.matrix)
  if (navState.rotateX !== 0) controls.rotateLeft(navState.rotateX * rotateAngle)
  if (navState.rotateY !== 0) controls.rotateUp(navState.rotateY * rotateAngle)
  if (navState.zoomIn) controls.dollyIn(1 / zoomFactor)
  if (navState.zoomOut) controls.dollyOut(1 / zoomFactor)
}

// resize handling
window.addEventListener('resize', resizeRenderer)
