import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export function setupLighting(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.05);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.1);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.1);
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
            console.warn('HDR load failed, using fallback sky', error);
            scene.background = new THREE.Color(0x87ceeb);
        }
    );
}