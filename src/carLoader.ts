import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function loadCar(scene: THREE.Scene) {
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

    loadModel(
        '/models/car.glb',
        new THREE.Vector3(0, 0.1, 3),
        { x: 0.12, y: 0.12, z: 0.12 },
        { x: 0, y: Math.PI, z: 0 }
    );
}