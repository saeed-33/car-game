import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// FIX: The PDF forgot to import the RGBELoader, added it here:
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// ============ SCENE, CAMERA, RENDERER (Pages 5, 25, 26) ============
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 30, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 11);
camera.lookAt(0, 0, -50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ============ RESIZE HANDLER (Page 6) ============
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============ LIGHTING (Pages 11, 12, 13, 15) ============
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.6);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff5e6, 2);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
scene.add(sunLight);

// ============ ENVIRONMENT MAP (Page 14) ============
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloppenheim_06_puresky_1k.hdr',
    (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture;
    },
    undefined,
    (error) => {
        console.warn('HDR load failed, using fallback sky');
        scene.background = new THREE.Color(0x87ceeb);
    }
);

// ============ ENVIRONMENT OBJECTS (Pages 16, 17, 18, 19) ============
// Grass
const grassGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9, metalness: 0.0 });
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;
grass.position.set(0, -0.1, -20);
grass.receiveShadow = true;
scene.add(grass);

// Road
const roadGeometry = new THREE.PlaneGeometry(8, 120);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.1 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.01, -30);
road.receiveShadow = true;
scene.add(road);

// Road Markings (Dashed Line)
const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5, emissive: 0x333300 });
for (let i = 0; i < 20; i++) {
    const markingGeometry = new THREE.PlaneGeometry(0.15, 2);
    const marking = new THREE.Mesh(markingGeometry, markingMaterial);
    marking.rotation.x = -Math.PI / 2;
    marking.position.set(0, 0.02, -5 - i * 5);
    scene.add(marking);
}

// Road Edges (White Lines)
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });[-3.8, 3.8].forEach((x) => {
    const edgeGeometry = new THREE.PlaneGeometry(0.1, 120);
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0.02, -30);
    scene.add(edge);
});

// ============ TREES (Pages 20-24) ============
// FIX: The PDF looped over "treePositions" but never defined it. I created coordinates here:
const treePositions =[
    new THREE.Vector3(-6, 0, -10), new THREE.Vector3(6, 0, -20),
    new THREE.Vector3(-8, 0, -30), new THREE.Vector3(7, 0, -40),
    new THREE.Vector3(-5, 0, -50), new THREE.Vector3(8, 0, -60)
];

treePositions.forEach((pos, index) => {
    const scale = 0.8 + Math.random() * 0.4;
    
    const trunkGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 2 * scale, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(pos.x, scale, pos.z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

   const foliageColors =[0x228b22, 0x2e8b2e, 0x3cb371];
    // Tell TypeScript this will definitely be a number, not undefined
    const foliageColor = foliageColors[index % 3] as number; 

    const foliage1Geometry = new THREE.SphereGeometry(1.2 * scale, 8, 8);
    const foliage1Material = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8 });
    const foliage1 = new THREE.Mesh(foliage1Geometry, foliage1Material);
    foliage1.position.set(pos.x, 2.5 * scale, pos.z);
    foliage1.scale.y = 0.8;
    foliage1.castShadow = true;
    foliage1.receiveShadow = true;
    scene.add(foliage1);

    const foliage2Geometry = new THREE.SphereGeometry(1 * scale, 8, 8);
    const foliage2Material = new THREE.MeshStandardMaterial({ color: 0x3cb371, roughness: 0.8 });
    const foliage2 = new THREE.Mesh(foliage2Geometry, foliage2Material);
    foliage2.position.set(pos.x, 3.5 * scale, pos.z);
    foliage2.castShadow = true;
    foliage2.receiveShadow = true;
    scene.add(foliage2);

    const foliage3Geometry = new THREE.SphereGeometry(0.7 * scale, 8, 8);
    const foliage3Material = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
    const foliage3 = new THREE.Mesh(foliage3Geometry, foliage3Material);
    foliage3.position.set(pos.x, 4.3 * scale, pos.z);
    foliage3.castShadow = true;
    foliage3.receiveShadow = true;
    scene.add(foliage3);
});

// ============ MODEL LOADER (Pages 7, 9, 10) ============
const loader = new GLTFLoader();

function loadModel(
    path: string, 
    position: THREE.Vector3, 
    scale: { x: number; y: number; z: number }, 
    rotate: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
) {
    loader.load(
        path, 
        (gltf) => {
            const model = gltf.scene;
            model.position.copy(position);
            model.scale.set(scale.x, scale.y, scale.z);
            model.rotation.set(rotate.x, rotate.y, rotate.z);
            
            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(model);
        },
        undefined, 
        (error) => {
            console.error('Error loading model:', path, error);
        }
    );
}

// Load the car
loadModel(
    '/models/car.glb', // Assumes car.glb is in public/models/
    new THREE.Vector3(0, 0.1, 3),
    { x: 0.12, y: 0.12, z: 0.12 },
    { x: 0, y: Math.PI, z: 0 }
);

// ============ ANIMATION LOOP (Page 6) ============
// FIX: The animate loop must be at the very bottom so everything is loaded first.
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();