import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface Obstacle {
    mesh: THREE.Group;
    isHit: boolean;
    velocity: THREE.Vector3;
    laneOffset: number;
}

export class ObstacleSystem {
    private loader = new GLTFLoader();
    public obstacles: Obstacle[] = [];

    constructor(private worldGroup: THREE.Group) {
        this.loader.load('/models/pixellabs-traffic-cone-4223.glb', (gltf) => {
            const baseModel = gltf.scene;
            baseModel.scale.set(1.3, 1.3, 1.3);
            
            baseModel.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            for (let i = 0; i < 20; i++) {
                const clone = baseModel.clone();
                const laneX = this.getRandomLane();
                
                clone.position.set(laneX, 0, -30 - (i * 60)); 
                
                this.obstacles.push({ 
                    mesh: clone, 
                    isHit: false, 
                    velocity: new THREE.Vector3(0,0,0), 
                    laneOffset: laneX 
                });
                
                this.worldGroup.add(clone);
            }
        });
    }

    private getRandomLane(): number {
        const lanes = [-2.5, 0, 2.5];
        const randomIndex = Math.floor(Math.random() * lanes.length);
        return lanes[randomIndex] as number; 
    }

    public update(cameraZ: number, worldZ: number, progress: number, delta: number) {
        const currentSpacing = THREE.MathUtils.lerp(60, 20, progress);

        let furthestZ = 0;
        if (this.obstacles.length > 0) {
            furthestZ = Math.min(...this.obstacles.map(o => o.mesh.position.z));
        }

        this.obstacles.forEach(obs => {
            const absoluteZ = worldZ + obs.mesh.position.z;
            
            if (absoluteZ > cameraZ + 20) {
                obs.mesh.position.z = furthestZ - currentSpacing; 
                obs.laneOffset = this.getRandomLane(); 
                this.resetCone(obs);
                furthestZ = obs.mesh.position.z; 
                
            } else if (absoluteZ < cameraZ - 800) {
                obs.mesh.position.z += 800;
                obs.laneOffset = this.getRandomLane();
                this.resetCone(obs);
            }

            if (!obs.isHit) {
                obs.mesh.position.x = obs.laneOffset;
            }

            if (obs.isHit) {
                obs.velocity.y -= 40 * delta; 
                obs.mesh.position.addScaledVector(obs.velocity, delta);
                obs.mesh.rotation.x += 10 * delta;
                obs.mesh.rotation.y += 15 * delta;
                obs.mesh.rotation.z += 5 * delta;
            }
        });
    }

    private resetCone(obs: Obstacle) {
        obs.isHit = false;
        obs.mesh.rotation.set(0, 0, 0); 
        obs.mesh.position.y = 0; 
        obs.velocity.set(0, 0, 0); 
    }
}