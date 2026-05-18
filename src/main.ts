import { setupScene } from './sceneSetup';
import { setupLighting } from './lighting';
import { createEnvironment } from './environment';
import { loadCar } from './carLoader';
import { createStreetLights } from './streetLights';

// 1. Import OrbitControls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const { scene, camera, renderer } = setupScene();

setupLighting(scene);
createEnvironment(scene);
loadCar(scene);
createStreetLights(scene);


// ===== NEW: CAMERA CONTROLS =====
const controls = new OrbitControls(camera, renderer.domElement);
// These settings make the camera movement feel smooth and professional
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevents camera from going under the ground
controls.minDistance = 3;  // Prevents zooming too close to the car
controls.maxDistance = 20; // Prevents zooming too far away
controls.target.set(0, 1, 0); // Makes the camera orbit around the car, not the empty ground

function animate() {
    requestAnimationFrame(animate);
    
    // ===== NEW: Update controls every frame =====
    controls.update(); 
    
    renderer.render(scene, camera);
}

animate();