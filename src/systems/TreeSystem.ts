import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class TreeSystem {
    private loader = new GLTFLoader();
    // We will save the original X position so when it recycles, it stays on the correct side of the road
    private props: { mesh: THREE.Group, originalX: number }[] = []; 
    private recycleDistance = 150; 

    constructor(private worldGroup: THREE.Group) {
        // Syntax: spawnModel(path, position, scale, rotation in radians)
        
        // 1. Rock: Much smaller scale (changed from 10 to 4)
        this.spawnModel('/models/quaternius_cc0-snowy-rock-1313.glb', new THREE.Vector3(-7, 0, -20), 4, 0);
        
        // 2. Traffic Light: Adjusted scale, rotated 90 degrees (-Math.PI / 2) to face the road
        this.spawnModel('/models/quaternius_cc0-traffic-light-1428.glb', new THREE.Vector3(6, 0, -40), 9, -Math.PI / 2);
        
        // 3. Bench: Much larger scale (changed from 20 to 40), rotated to face the road
        this.spawnModel('/models/manseok_kim-chair-2119.glb', new THREE.Vector3(-8, 0, -60), 40, Math.PI / 2);
        
        // 4. Another Rock
        this.spawnModel('/models/quaternius_cc0-snowy-rock-1313.glb', new THREE.Vector3(8, 0, -80), 3, Math.PI);
        
        // 5. Another Traffic Light on the left side
        this.spawnModel('/models/quaternius_cc0-traffic-light-1428.glb', new THREE.Vector3(-6, 0, -100), 9, Math.PI / 2);
    }

    private spawnModel(path: string, position: THREE.Vector3, scale: number, rotationY: number) {
        this.loader.load(path, (gltf) => {
            const model = gltf.scene;
            model.position.copy(position);
            model.scale.set(scale, scale, scale);
            
            // Apply the rotation!
            model.rotation.y = rotationY; 
            
            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.props.push({ mesh: model, originalX: position.x }); 
            this.worldGroup.add(model);
        });
    }

public update(cameraZ: number, worldZ: number) {
        this.props.forEach(prop => {
            const absoluteZ = worldZ + prop.mesh.position.z;
            
            if (absoluteZ > cameraZ + 30) {
                // Driving Forward: Recycle to the front
                prop.mesh.position.z -= this.recycleDistance; 
                prop.mesh.position.x = prop.originalX + (Math.random() - 0.5) * 2; 
                
            } else if (absoluteZ < cameraZ - this.recycleDistance + 30) {
                // Driving Backward: Recycle to the back!
                prop.mesh.position.z += this.recycleDistance; 
                prop.mesh.position.x = prop.originalX + (Math.random() - 0.5) * 2; 
            }
        });
    }
}