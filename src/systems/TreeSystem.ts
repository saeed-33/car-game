import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoadSystem } from './RoadSystem'; // IMPORT THIS!

export class TreeSystem {
    private loader = new GLTFLoader();
    private props: { mesh: THREE.Group, lateralOffset: number, trackZ: number }[] = []; 
    private recycleDistance = 150; 
    private readonly minRoadsideOffset = RoadSystem.ROAD_EDGE_OFFSET + 5;

    constructor(private worldGroup: THREE.Group) {
        this.spawnModel('/models/quaternius_cc0-snowy-rock-1313.glb', new THREE.Vector3(-15, 0, -20), 4, 0);
        this.spawnModel('/models/quaternius_cc0-traffic-light-1428.glb', new THREE.Vector3(15, 0, -40), 9, -Math.PI / 2);
        this.spawnModel('/models/manseok_kim-chair-2119.glb', new THREE.Vector3(-18, 0, -60), 40, Math.PI / 2);
        this.spawnModel('/models/quaternius_cc0-snowy-rock-1313.glb', new THREE.Vector3(17, 0, -80), 3, Math.PI);
        this.spawnModel('/models/quaternius_cc0-traffic-light-1428.glb', new THREE.Vector3(-15, 0, -100), 9, Math.PI / 2);
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

            this.props.push({ mesh: model, lateralOffset: this.keepOffRoad(position.x), trackZ: position.z }); 
            this.worldGroup.add(model);
        });
    }

    public update(_cameraZ: number, progressZ: number) {
        const referenceZ = RoadSystem.START_LINE_Z - progressZ;

        this.props.forEach(prop => {
            const distanceAhead = referenceZ - prop.trackZ;
            
            if (distanceAhead < -30) {
                prop.trackZ -= this.recycleDistance; 
                prop.lateralOffset = this.keepOffRoad(prop.lateralOffset + (Math.random() - 0.5) * 2);
            } else if (distanceAhead > this.recycleDistance - 30) {
                prop.trackZ += this.recycleDistance; 
                prop.lateralOffset = this.keepOffRoad(prop.lateralOffset + (Math.random() - 0.5) * 2);
            }

            const local = RoadSystem.trackToLocal(prop.trackZ, prop.lateralOffset, referenceZ);
            prop.mesh.position.x = local.x;
            prop.mesh.position.z = local.z;
        });
    }

    private keepOffRoad(x: number): number {
        const side = x >= 0 ? 1 : -1;
        return side * Math.max(Math.abs(x), this.minRoadsideOffset);
    }
}
