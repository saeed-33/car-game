// src/streetLights.ts
import * as THREE from 'three';

export function createStreetLights(scene: THREE.Scene) {
    // 1. Materials for the lamp post
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.5 });
    // Emissive material makes the bulb actually look like it's glowing in the camera
    const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 2 });

    // 2. Geometries
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8); // Thin tall cylinder
    const headGeometry = new THREE.BoxGeometry(1.2, 0.2, 0.4);       // Box for the top
    const bulbGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.3);       // Smaller box for the bulb

    // 3. We want street lights every 25 units down the road
    const zPositions =[0, -25, -50, -75, -100];

    zPositions.forEach((z) => {
        // Place lights on the Left side (-4.5) and Right side (4.5) of the road
        [-4.5, 4.5].forEach((x) => {
            // Create a Group to hold all parts of a single lamp post together
            const lampGroup = new THREE.Group();

            // A. The Vertical Pole
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = 2.5; // Move up by half its height so it sits on the ground
            pole.castShadow = true;
            pole.receiveShadow = true;
            lampGroup.add(pole);

            // B. The Lamp Head
            const head = new THREE.Mesh(headGeometry, poleMaterial);
            // If on the left (x is negative), head points right. If on right, head points left.
            const directionOffset = x < 0 ? 0.4 : -0.4; 
            head.position.set(directionOffset, 5, 0); 
            head.castShadow = true;
            lampGroup.add(head);

            // C. The Glowing Bulb
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
            bulb.position.set(directionOffset, 4.85, 0); // slightly below the head
            lampGroup.add(bulb);

            // D. The Actual Light Source
            const light = new THREE.SpotLight(0xffddaa, 50); // Warm color, high intensity
            light.position.set(directionOffset, 4.85, 0);
            light.angle = Math.PI / 4; // Cone spread
            light.penumbra = 0.5;      // Soft edges
            light.decay = 2;           // How light fades over distance
            light.distance = 30;       // Max distance of light
            light.castShadow = true;
            lampGroup.add(light);

            // Spotlights need a "target" to point at. We make a target on the ground in the middle of the road.
            const targetObject = new THREE.Object3D();
            targetObject.position.set(x < 0 ? 2 : -2, 0, 0); 
            lampGroup.add(targetObject);
            light.target = targetObject;

            // 4. Finally, place the whole assembled lamp post in the scene
            lampGroup.position.set(x, 0, z);
            scene.add(lampGroup);
        });
    });
}