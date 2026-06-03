import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InputSystem } from '../systems/InputSystem';

export class Car {
    public mesh: THREE.Group | null = null;
    
    public speed: number = 0;
    public maxSpeed: number = 60; 
    public maxReverseSpeed: number = 15;
    public acceleration: number = 60; 
    public positionX: number = 0;
    public steeringSpeed: number = 14;

    constructor(private scene: THREE.Scene, private inputSystem: InputSystem) {
        this.loadModel();
    }

    private loadModel() {
        const loader = new GLTFLoader();
        loader.load('/models/car.glb', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.position.set(0, 0.1, 3);
            this.mesh.scale.set(0.12, 0.12, 0.12);
            this.mesh.rotation.y = Math.PI;

            this.mesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene.add(this.mesh);
        });
    }

    public getHitbox(): THREE.Box3 | null {
        if (!this.mesh) return null;
        const box = new THREE.Box3().setFromObject(this.mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        box.expandByVector(new THREE.Vector3(-size.x * 0.2, 0, -size.z * 0.2));
        return box;
    }

    public update(delta: number) {
        if (!this.mesh) return; 

        if (this.inputSystem.isKeyPressed('ArrowUp') || this.inputSystem.isKeyPressed('KeyW')) {
            this.speed += this.acceleration * delta;
        } else if (this.inputSystem.isKeyPressed('ArrowDown') || this.inputSystem.isKeyPressed('KeyS')) {
            this.speed -= this.acceleration * delta; 
        } else {
            if (this.speed > 0) {
                this.speed -= this.acceleration * 0.5 * delta;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += this.acceleration * 0.5 * delta;
                if (this.speed > 0) this.speed = 0;
            }
        }
        
        this.speed = Math.max(-this.maxReverseSpeed, Math.min(this.speed, this.maxSpeed));

        if (Math.abs(this.speed) > 1) {
            const steerDirection = this.speed > 0 ? 1 : -1;

            if (this.inputSystem.isKeyPressed('ArrowLeft') || this.inputSystem.isKeyPressed('KeyA')) {
                this.positionX -= this.steeringSpeed * steerDirection * delta;
                this.mesh.rotation.z = 0.1 * steerDirection;
            } else if (this.inputSystem.isKeyPressed('ArrowRight') || this.inputSystem.isKeyPressed('KeyD')) {
                this.positionX += this.steeringSpeed * steerDirection * delta;
                this.mesh.rotation.z = -0.1 * steerDirection;
            } else {
                this.mesh.rotation.z = 0;
            }
        } else {
            this.mesh.rotation.z = 0; 
        }

        this.positionX = Math.max(-3.5, Math.min(this.positionX, 3.5));
        this.mesh.position.x = this.positionX;
    }
}