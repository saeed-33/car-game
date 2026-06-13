import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class LightingSystem {
    constructor(scene: THREE.Scene) {
        // 1. Basic Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfff5e6, 2);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        scene.add(sunLight);

        // 2. HDR Environment Map (This makes the car shiny and the sky visible!)
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load(
            'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloppenheim_06_puresky_1k.hdr',
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = texture; // Adds reflections to the car
                scene.background = texture;  // Replaces the black background
            },
            undefined,
            (error) => {
                console.warn('HDR load failed, using fallback sky', error);
                scene.background = new THREE.Color(0x87ceeb);
            }
        );
    }
}