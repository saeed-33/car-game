import { setupScene } from './sceneSetup';
import { setupLighting } from './lighting';
import { createEnvironment } from './environment';
import { loadCar } from './carloader';
import { createStreetLights } from './streetLights';

// 1. Initialize core components
const { scene, camera, renderer } = setupScene();

// 2. Add elements to the scene
setupLighting(scene);
createEnvironment(scene);
loadCar(scene)
createStreetLights(scene);

// 3. Start the animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();