import * as THREE from 'three'
import Globe from 'three-globe'
import { scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'

const RADIUS = 200

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth - 320, window.innerHeight)
renderer.toneMappingExposure = 1
document.getElementById('globe-container').appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000011)

const camera = new THREE.PerspectiveCamera()
camera.aspect = (window.innerWidth - 320) / window.innerHeight
camera.updateProjectionMatrix()
camera.position.z = RADIUS * 2.2

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

const world = new Globe({ animateIn: false })
world.globeMaterial().color = new THREE.Color(0x0a0f21)
world.globeMaterial().emissive = new THREE.Color(0x001122)
world.globeMaterial().emissiveIntensity = 0.6

// set a dark, slightly emissive Earth texture for futuristic look
world.setGlobeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
world.showAtmosphere = false

scene.add(world)

// outer glow sphere
const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffd5, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.02 })
const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.02, 48, 48), glowMat)
scene.add(glowSphere)

// color scale for heat
const colorScale = scaleSequential(interpolateInferno).domain([0, 1])

let points = []
let baseTime = Date.now()

function applyPoints(data, latKey = 'lat', lngKey = 'lng', weightKey = 'weight'){
  points = data.map(d => ({
    lat: d[latKey],
    lng: d[lngKey],
    weight: d[weightKey] != null ? +d[weightKey] : 1,
    label: d.label || d.name || ''
  }))
  const max = Math.max(...points.map(p=>p.weight), 1)
  world.pointsData(points)
    .pointLat('lat')
    .pointLng('lng')
    .pointAltitude(d => 0.0015 * (d.weight / max))
    .pointColor(d => colorScale(d.weight / max))
    .pointRadius(0.6)
    .pointLabel(d => `${d.label}\n${d.weight}`)
}

// animate pulse and auto-rotate
function animate(){
  requestAnimationFrame(animate)
  const t = (Date.now() - baseTime) / 1000
  world.rotation.y += 0.0008
  // pulse altitude
  if (world.pointsData()){
    const pts = world.pointsData()
    const max = Math.max(...pts.map(p=>p.weight),1)
    world.pointAltitude(d => {
      const base = 0.0015 * (d.weight / max)
      return base * (1 + 0.6 * Math.sin(t * 2 + d.weight))
    })
  }
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
    const data = await res.json()
    applyPoints(data, latKey, lngKey, weightKey)
  }catch(e){
    console.error('Failed to load', e)
    alert('Failed to load dataset: ' + e.message)
  }
})

// load default dataset on start
document.getElementById('loadBtn').click()

// resize handling
window.addEventListener('resize', () => {
  camera.aspect = (window.innerWidth - 320) / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth - 320, window.innerHeight)
})
