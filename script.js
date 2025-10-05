// Thiết lập cảnh, camera và renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Background
const loader = new THREE.TextureLoader();
loader.load('Texture/2k_stars_milky_way.jpg', function (texture) {
    scene.background = texture;
})
// Load texture
var planetTextures = []
for (let i = 0; i <= 8; i++) {
    let filePath = `Texture/2k_${i}.jpg`
    const planetTexture = loader.load(filePath)
    planetTextures.push(planetTexture)
}

// Camera position
let radius = 40
let theta = Math.PI * 0.25
let phi = Math.PI * 0.4
var x = radius * Math.sin(phi) * Math.cos(theta)
var y = radius * Math.cos(phi)
var z = radius * Math.sin(phi) * Math.sin(theta)
camera.position.set(x, y, z)


let target = new THREE.Vector3(0, 0, 0)
function updateCameraPosition() {
    const EPS = 0.001;
    phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
    
    x = radius * Math.sin(phi) * Math.cos(theta);
    y = radius * Math.cos(phi);
    z = radius * Math.sin(phi) * Math.sin(theta);

    camera.position.set(x, y, z);
    camera.lookAt(target);
}
updateCameraPosition();

// Ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
scene.add(ambientLight);
// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
//  Create Stars
function MakeStars() {
    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(0, 0, 0);
    scene.add(light);
    const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
    const material = new THREE.MeshBasicMaterial({ map : planetTextures[0] });
    const Star = new THREE.Mesh(sunGeometry, material);
    scene.add(Star)
    return Star
}
// Create Planets
function MakePlanets(radius, distance, texture, speed, parent) {
    
    const PlanetGeometry = new THREE.SphereGeometry(radius, 24, 24);
    const PlanetMaterial = new THREE.MeshPhongMaterial({ map : texture });
    const Planet = new THREE.Mesh(PlanetGeometry, PlanetMaterial)
    const PlanetOrbit = new THREE.Object3D()
    PlanetOrbit.add(Planet)
    scene.add(PlanetOrbit)
    Planet.position.x = distance
    
    PlanetOrbit.userData = {
        speed : speed,
        planet : Planet
    }
    const points = []
    for (let i = 0; i <100; i++) {
        const angle = (i / 100) * Math.PI * 2
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance
        points.push(new THREE.Vector3(x, 0, z))
    }
    const LineGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const LineMaterial = new THREE.LineDashedMaterial( {color : 0xffffff})
    const orbitLine = new THREE.LineLoop(LineGeometry, LineMaterial);
    parent.add(orbitLine)
    return PlanetOrbit
}
// Make Moon
function MakeMoon(radius, distance, texture, speed, angle, parent) {
    const MoonGeometry = new THREE.SphereGeometry(radius, 24, 24);
    const MoonMaterial = new THREE.MeshPhongMaterial({ color : 0x888888});
    const Moon = new THREE.Mesh(MoonGeometry, MoonMaterial)
    const MoonOrbit = new THREE.Object3D()
    MoonOrbit.add(Moon)
    parent.add(MoonOrbit)
    Moon.position.x = distance
    MoonOrbit.rotation.x = THREE.MathUtils.degToRad(angle)
    MoonOrbit.userData = {
        speed : speed,
        planet : Moon
    }
    return MoonOrbit
}


const Sun = MakeStars()
var Planets = []
var list_radius = [0.5, 0.7, 1, 0.8, 1.7, 1.4, 1, 1]
var list_distance = [8, 11, 14, 17, 23, 27, 30, 33]
var list_speed = [0.04, -0.015, 0.01, 0.008, 0.006, 0.005, 0.003, 0.002]
for (let i = 0; i < 8; i++) {
    const planet = MakePlanets(list_radius[i], list_distance[i], planetTextures[i+1], list_speed[i], Sun)
    Planets.push(planet)
}
const Moon = MakeMoon(0.3, 1.5, null, 0.04, 25, Planets[2].userData.planet)
const innerRadius = 1.4
const outerRadius = 2.4
const SaturnRingGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
const pos = SaturnRingGeometry.attributes.position;
const uv = new Float32Array(pos.count * 2);

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i); // vì RingGeometry nằm trong mặt phẳng XY
  const r = Math.sqrt(x * x + y * y); // tính bán kính hiện tại

  uv[i * 2] = (r - innerRadius) / (outerRadius - innerRadius); // U theo bán kính
  uv[i * 2 + 1] = 0.5; // V cố định giữa ảnh
}

SaturnRingGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
const SaturnRingMaterial = new THREE.MeshBasicMaterial({ map : loader.load('Texture/2k_saturn_ring_alpha.png'), side: THREE.DoubleSide, transparent: true });
const SaturnRing = new THREE.Mesh(SaturnRingGeometry, SaturnRingMaterial);
SaturnRing.rotation.x = THREE.MathUtils.degToRad(80);
Planets[5].userData.planet.add(SaturnRing);

// Animation loop
let animationID
function animate() {
    animationID = requestAnimationFrame(animate);
    Sun.rotation.y += 0.01;
    Planets.forEach(function (planet) {
        planet.rotation.y += planet.userData.speed;
        planet.userData.planet.rotation.y += 0.01;
    })

    Moon.rotation.y += Moon.userData.speed;
    Moon.userData.planet.rotation.y += 0.01;

    renderer.render(scene, camera);
}
animate();
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (animationID) {
            this.cancelAnimationFrame(animationID)
            animationID = null
        } else {
            animate()
        }
    }
})

// ------------------------------------------------------------------------------------------------------------------
//  Move Camera
let isDragging = false;
let prevX = 0;
let prevY = 0;
// sensitivity multipliers
const rotateSpeed = 0.0005; // how fast mouse drag rotates
const zoomSpeed = 0.002;   // wheel zoom sensitivity

// pointer down
renderer.domElement.addEventListener('pointerdown', (e) => {
    // only left button rotate (button === 0)
    if (e.button === 0) {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    // capture pointer so we still get events when cursor leaves canvas
    renderer.domElement.setPointerCapture(e.pointerId);
    }
});
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button === 0) {renderer.domElement.setPointerCapture(e.pointerId); }
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - prevX;
  const deltaY = e.clientY - prevY;
  theta += deltaX * rotateSpeed;
  phi   -= deltaY * rotateSpeed;
  updateCameraPosition();
});
renderer.domElement.addEventListener('pointerup', (e) => {
  isDragging = false;
  try { renderer.domElement.releasePointerCapture(e.pointerId); } catch (_) {}
});
renderer.domElement.addEventListener('pointerleave', () => { isDragging = false; });

// Zoom Camera
renderer.domElement.addEventListener('wheel', function(e) {
    e.preventDefault()
    const delta = e.deltaY
    radius += delta * zoomSpeed * (radius * 0.1)
    radius = Math.max(5, Math.min(200, radius))
    updateCameraPosition()
}, {passive : false })






