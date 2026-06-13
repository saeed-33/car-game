import * as THREE from 'three';
import { RoadSystem } from './RoadSystem';

export interface Obstacle {
    mesh: THREE.Group;
    isHit: boolean;
    velocity: THREE.Vector3;
    laneOffset: number;
    trackZ: number;
}

export class ObstacleSystem {
    public obstacles: Obstacle[] = [];
    private readonly obstacleCount = 24;

    constructor(private worldGroup: THREE.Group) {
        for (let i = 0; i < this.obstacleCount; i++) {
            const cone = this.createCone();
            const laneX = this.getRandomLane();
            const trackZ = RoadSystem.START_LINE_Z - 16 - (i * 22);
            const local = RoadSystem.trackToLocal(trackZ, laneX, RoadSystem.START_LINE_Z);
            cone.position.set(local.x, 0, local.z);

            this.obstacles.push({ mesh: cone, isHit: false, velocity: new THREE.Vector3(0, 0, 0), laneOffset: laneX, trackZ });
            this.worldGroup.add(cone);
        }
    }

    private createCone(): THREE.Group {
        const group = new THREE.Group();
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6a00, roughness: 0.55 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.75 });

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.15, 16), coneMat);
        body.position.y = 0.68;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.31, 0.12, 16), stripeMat);
        stripe.position.y = 0.78;
        stripe.castShadow = true;
        group.add(stripe);

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.9), baseMat);
        base.position.y = 0.07;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        return group;
    }

    private getRandomLane(): number {
        const lanes = RoadSystem.getLaneCenters();
        return lanes[Math.floor(Math.random() * lanes.length)] as number; 
    }

    public update(_cameraZ: number, progressZ: number, progress: number, delta: number) {
        const currentSpacing = THREE.MathUtils.lerp(32, 16, progress);
        const referenceZ = RoadSystem.START_LINE_Z - progressZ;

        let furthestTrackZ = referenceZ;
        if (this.obstacles.length > 0) {
            furthestTrackZ = Math.min(...this.obstacles.map(o => o.trackZ));
        }

        this.obstacles.forEach(obs => {
            const distanceAhead = referenceZ - obs.trackZ;
            
            if (distanceAhead < -55) {
                obs.trackZ = furthestTrackZ - currentSpacing; 
                obs.laneOffset = this.getRandomLane(); 
                this.resetCone(obs);
                furthestTrackZ = obs.trackZ; 
            } else if (distanceAhead > RoadSystem.LOOP_LENGTH * 2) {
                obs.trackZ -= RoadSystem.LOOP_LENGTH * 2;
                obs.laneOffset = this.getRandomLane();
                this.resetCone(obs);
            }

            if (!obs.isHit) {
                const local = RoadSystem.trackToLocal(obs.trackZ, obs.laneOffset, referenceZ);
                obs.mesh.position.set(local.x, 0, local.z);
                obs.mesh.rotation.y = this.getTrackAngle(obs.trackZ, referenceZ);
            } else {
                obs.velocity.y -= 40 * delta; 
                obs.mesh.position.addScaledVector(obs.velocity, delta);
                obs.mesh.rotation.x += 10 * delta;
                obs.mesh.rotation.y += 15 * delta;
                obs.mesh.rotation.z += 5 * delta;
            }
        });
    }

    private getTrackAngle(trackZ: number, referenceZ: number): number {
        const current = RoadSystem.trackToLocal(trackZ, 0, referenceZ);
        const ahead = RoadSystem.trackToLocal(trackZ - 1, 0, referenceZ);
        return Math.atan2(ahead.x - current.x, ahead.z - current.z);
    }

    private resetCone(obs: Obstacle) {
        obs.isHit = false;
        obs.mesh.rotation.set(0, 0, 0); 
        obs.mesh.position.y = 0; 
        obs.velocity.set(0, 0, 0); 
    }
}
