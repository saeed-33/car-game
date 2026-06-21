// --- START OF FILE PowerUpSystem.ts ---
import * as THREE from 'three';
import { RoadSystem } from './RoadSystem';

export type PowerUpType = 'turbo' | 'shield';

export interface PowerUp {
    mesh: THREE.Group;
    type: PowerUpType;
    isHit: boolean;
    laneOffset: number;
    trackZ: number;
}

export class PowerUpSystem {
    public powerUps: PowerUp[] = [];
    private readonly itemCount = 8; // Less frequent than cones

    constructor(private worldGroup: THREE.Group) {
        for (let i = 0; i < this.itemCount; i++) {
            const type: PowerUpType = Math.random() > 0.5 ? 'turbo' : 'shield';
            const mesh = this.createPowerUpMesh(type);
            const laneX = this.getRandomLane();
            // Spread them out much further than cones
            const trackZ = RoadSystem.START_LINE_Z - 100 - (i * 150);
            
            this.powerUps.push({ mesh, type, isHit: false, laneOffset: laneX, trackZ });
            this.worldGroup.add(mesh);
        }
    }

    private createPowerUpMesh(type: PowerUpType): THREE.Group {
        const group = new THREE.Group();
        
        // Turbo = Blue, Shield = Yellow/Gold
        const color = type === 'turbo' ? 0x00aaff : 0xffcc00;
        const mat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });

        // Use a floating box
        const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
        body.position.y = 1.2; // Float above road
        body.castShadow = true;
        group.add(body);

        return group;
    }

    private getRandomLane(): number {
        const lanes = RoadSystem.getLaneCenters();
        return lanes[Math.floor(Math.random() * lanes.length)] as number; 
    }

   public update(_cameraZ: number, progressZ: number, delta: number) {
        const referenceZ = RoadSystem.START_LINE_Z - progressZ;
        let furthestTrackZ = referenceZ;
        
        if (this.powerUps.length > 0) {
            furthestTrackZ = Math.min(...this.powerUps.map(p => p.trackZ));
        }

        this.powerUps.forEach(pu => {
            const distanceAhead = referenceZ - pu.trackZ;
            
            // Recycle power-ups behind the camera
            if (distanceAhead < -30) {
                pu.trackZ = furthestTrackZ - 150 - (Math.random() * 100); 
                pu.laneOffset = this.getRandomLane(); 
                pu.type = Math.random() > 0.5 ? 'turbo' : 'shield';
                this.resetPowerUp(pu);
                furthestTrackZ = pu.trackZ; 
            } else if (distanceAhead > RoadSystem.LOOP_LENGTH * 2) {
                pu.trackZ -= RoadSystem.LOOP_LENGTH * 2;
                this.resetPowerUp(pu);
            }

            if (!pu.isHit) {
                const local = RoadSystem.trackToLocal(pu.trackZ, pu.laneOffset, referenceZ);
                pu.mesh.position.set(local.x, Math.sin(Date.now() * 0.003) * 0.3, local.z);
                
                // SAFE Spin animation check
                const childMesh = pu.mesh.children[0];
                if (childMesh) {
                    childMesh.rotation.y += 2 * delta;
                    childMesh.rotation.x += 1 * delta;
                }
            }
        });
    }

    private resetPowerUp(pu: PowerUp) {
        pu.isHit = false;
        pu.mesh.visible = true;
        const color = pu.type === 'turbo' ? 0x00aaff : 0xffcc00;
        
        // SAFE Material update check
        const childMesh = pu.mesh.children[0] as THREE.Mesh | undefined;
        if (childMesh && childMesh.material) {
            const mat = childMesh.material as THREE.MeshStandardMaterial;
            mat.color.setHex(color);
            mat.emissive.setHex(color);
        }
    }
}