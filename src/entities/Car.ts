import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InputSystem } from '../systems/InputSystem';

export class Car {
    public mesh: THREE.Group | null = null;
    
    // Physics State
    public speed: number = 0;
    public maxSpeed: number = 30; // Max forward speed
    public acceleration: number = 15;
    public positionX: number = 0;
    public steeringSpeed: number = 8;
public maxReverseSpeed: number = 10; // NEW: Reverse speed limit

    constructor(private scene: THREE.Scene, private inputSystem: InputSystem) {
        this.loadModel();
    }

    private loadModel() {
        const loader = new GLTFLoader();
        loader.load('/models/car.glb', (gltf) => {
            this.mesh = gltf.scene;
            // Car starts near the camera
            this.mesh.position.set(0, 0.1, 3);
            this.mesh.scale.set(0.12, 0.12, 0.12);
            // Face the car forward (away from camera)
            this.mesh.rotation.y = Math.PI;

            this.mesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Note: We add the car directly to the main scene, NOT the worldGroup!
            // This keeps the car glued to the camera while the world moves around it.
            this.scene.add(this.mesh);
        });
    }

    public update(delta: number) {
        if (!this.mesh) return; 

        // 1. Acceleration & Reversing
        if (this.inputSystem.isKeyPressed('ArrowUp') || this.inputSystem.isKeyPressed('KeyW')) {
            this.speed += this.acceleration * delta;
        } else if (this.inputSystem.isKeyPressed('ArrowDown') || this.inputSystem.isKeyPressed('KeyS')) {
            this.speed -= this.acceleration * delta; // Acts as brake AND reverse
        } else {
            // Apply friction to slowly stop the car when no keys are pressed
            if (this.speed > 0) {
                this.speed -= this.acceleration * 0.5 * delta;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += this.acceleration * 0.5 * delta;
                if (this.speed > 0) this.speed = 0;
            }
        }
        
        // Clamp speed between max reverse and max forward
        this.speed = Math.max(-this.maxReverseSpeed, Math.min(this.speed, this.maxSpeed));

        // 2. Steering (Only steer if moving!)
        if (Math.abs(this.speed) > 1) {
            // Reverse the steering wheel direction if driving backwards (like a real car!)
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