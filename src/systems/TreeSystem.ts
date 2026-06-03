import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class TreeSystem {
    private loader = new GLTFLoader();
    private props: { mesh: THREE.Group, originalX: number }[] = []; 
    private recycleDistance = 150; 

    constructor(private worldGroup: THREE.Group) {
        this.spawnModel('/models/quaternius_cc0-snowy-rock-1313.glb', new THREE.Vector3(-7, 0, -20), 4, 0);
        this.spawnModel('/models/quaternius_cc0-traffic-light-1428.glb', new THREE.Vector3(6, 0, -40), 9, -Math.PI / 2);
        this.spawnModel('/models/manseok_kim-chair-2119.glb', new THREE.Vector3(-8, 0, -60), 40, Math.PI / 2);
        this.spawnModel('/models/quaternius_cc0-snowy-rock-1313.glb', new THREE.Vector3(8, 0, -80), 3, Math.PI);
        this.spawnModel('/models/quaternius_cc0-traffic-light-1428.glb', new THREE.Vector3(-6, 0, -100), 9, Math.PI / 2);
    }

    private spawnModel(path: string, position: THREE.Vector3, scale: number, rotationY: number) {
        this.loader.load(path, (gltf) => {
            const model = gltf.scene;
            model.position.copy(position);
            model.scale.set(scale, scale, scale);
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
                prop.mesh.position.z -= this.recycleDistance; 
                prop.originalX = prop.originalX + (Math.random() - 0.5) * 2; 
            } else if (absoluteZ < cameraZ - this.recycleDistance + 30) {
                prop.mesh.position.z += this.recycleDistance; 
                prop.originalX = prop.originalX + (Math.random() - 0.5) * 2; 
            }

            prop.mesh.position.x = prop.originalX;
        });
    }
}