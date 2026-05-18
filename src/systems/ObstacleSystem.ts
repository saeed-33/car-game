import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface Obstacle {
    mesh: THREE.Group;
    isHit: boolean;
}

export class ObstacleSystem {
    private loader = new GLTFLoader();
    public obstacles: Obstacle[] = [];

    constructor(private worldGroup: THREE.Group) {
        // Spawn 12 cones (a good amount so the screen isn't entirely flooded)
        for (let i = 0; i < 12; i++) {
            this.spawnCone(new THREE.Vector3(
                this.getRandomLane(), 
                0, 
                -50 - (i * 60) // Initial safe spacing: one cone every 60 units
            ));
        }
    }

    // LOGICAL FIX 1: Strict Lanes!
    // Instead of completely random X values, cones can only spawn in 3 distinct lanes.
    // This ensures there is almost always a gap for the car to drive through.
    private getRandomLane(): number {
        const lanes = [-2.5, 0, 2.5]; // Left lane, Center lane, Right lane
        const randomIndex = Math.floor(Math.random() * lanes.length);
        return lanes[randomIndex]??0;
    }

    private spawnCone(position: THREE.Vector3) {
        this.loader.load('/models/pixellabs-traffic-cone-4223.glb', (gltf) => {
            const model = gltf.scene;
            model.position.copy(position);
            
            // INCREASED SCALE: 1.3 looks like a proper highway cone!
            model.scale.set(1.3, 1.3, 1.3); 
            
            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.obstacles.push({ mesh: model, isHit: false });
            this.worldGroup.add(model);
        });
    }

    public update(cameraZ: number, worldZ: number, progress: number) {
        // DYNAMIC DIFFICULTY: 
        // Start at 60 units apart. Shrink to 20 units apart at the very end of the game.
        const currentSpacing = THREE.MathUtils.lerp(60, 20, progress);

        // LOGICAL FIX 3: Chain Spawning!
        // We find the cone that is currently the FURTHEST away...
        let furthestZ = 0;
        if (this.obstacles.length > 0) {
            furthestZ = Math.min(...this.obstacles.map(o => o.mesh.position.z));
        }

        this.obstacles.forEach(obs => {
            const absoluteZ = worldZ + obs.mesh.position.z;
            
            if (absoluteZ > cameraZ + 20) {
                // ...and we place the newly recycled cone exactly `currentSpacing` behind it!
                // This guarantees they NEVER overlap on the Z axis.
                obs.mesh.position.z = furthestZ - currentSpacing; 
                obs.mesh.position.x = this.getRandomLane(); 
                this.resetCone(obs);
                
                // Update furthestZ so if multiple cones recycle at once, they form a perfect line
                furthestZ = obs.mesh.position.z; 
                
            } else if (absoluteZ < cameraZ - 800) {
                // Reverse edge-case
                obs.mesh.position.z += 800;
                obs.mesh.position.x = this.getRandomLane();
                this.resetCone(obs);
            }

            if (obs.isHit) {
                // Animate it falling over backwards
                obs.mesh.rotation.x = THREE.MathUtils.lerp(obs.mesh.rotation.x, -Math.PI / 2, 0.1);
            }
        });
    }

    private resetCone(obs: Obstacle) {
        obs.isHit = false;
        obs.mesh.rotation.x = 0; 
    }
}