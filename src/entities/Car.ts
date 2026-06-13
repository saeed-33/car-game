import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InputSystem } from '../systems/InputSystem';
import { RoadSystem } from '../systems/RoadSystem';

export class Car {
    public mesh: THREE.Group | null = null;
    
    public speed: number = 0;
    public maxSpeed: number = 40; 
    public maxReverseSpeed: number = 15;
    public acceleration: number = 10; 
    public positionX: number = 0;
    public forwardSpeed: number = 0;
    public steeringSpeed: number = 4.2;

    private steeringAngle: number = 0;
    private headingAngle: number = 0;
    private yawVelocity: number = 0;
    private wheelSpin: number = 0;
    private frontWheelPivots: THREE.Object3D[] = [];
    private rollingWheels: THREE.Object3D[] = [];
    private throttleAmount: number = 0;
    private steeringInput: number = 0;
    private bodyColor = new THREE.Color(0xffffff);
    private readonly edgePadding = 0.75;
    private readonly maxSteeringAngle = 0.56;
    private readonly wheelBase = 28;

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
            const frontWheels: THREE.Object3D[] = [];
            const rearWheels: THREE.Object3D[] = [];

            this.mesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }

                if (child.name === 'FL' || child.name === 'FR') {
                    frontWheels.push(child);
                } else if (child.name === 'RL' || child.name === 'RR') {
                    rearWheels.push(child);
                }
            });

            this.frontWheelPivots = frontWheels.map(wheel => this.createSteeringPivot(wheel));
            this.rollingWheels = [...frontWheels, ...rearWheels];
            this.applyBodyColor();
            this.scene.add(this.mesh);
        });
    }

    private createSteeringPivot(wheel: THREE.Object3D): THREE.Object3D {
        const parent = wheel.parent;
        if (!parent) return wheel;

        const pivot = new THREE.Object3D();
        pivot.name = `${wheel.name}_SteeringPivot`;
        pivot.position.copy(wheel.position);
        parent.add(pivot);
        pivot.add(wheel);
        wheel.position.set(0, 0, 0);

        return pivot;
    }

    public getHitbox(): THREE.Box3 | null {
        if (!this.mesh) return null;

        const center = this.mesh.position;
        const halfWidth = 0.68;
        const halfHeight = 0.42;
        const halfLength = 1.05;

        return new THREE.Box3(
            new THREE.Vector3(center.x - halfWidth, center.y + 0.03, center.z - halfLength),
            new THREE.Vector3(center.x + halfWidth, center.y + halfHeight * 2, center.z + halfLength)
        );
    }

    public setColor(hexColor: string) {
        this.bodyColor.set(hexColor);
        this.applyBodyColor();
    }

    private applyBodyColor() {
        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((material) => {
                const standardMaterial = material as THREE.MeshStandardMaterial;
                if (!standardMaterial.color) return;

                const isWheel = child.name === 'FL' || child.name === 'FR' || child.name === 'RL' || child.name === 'RR';
                const brightness = standardMaterial.color.r + standardMaterial.color.g + standardMaterial.color.b;
                if (isWheel || brightness < 0.18) return;

                if (!standardMaterial.userData.carColorClone) {
                    const clonedMaterial = standardMaterial.clone();
                    clonedMaterial.userData.carColorClone = true;
                    if (Array.isArray(mesh.material)) {
                        mesh.material = mesh.material.map((entry) => entry === material ? clonedMaterial : entry);
                    } else {
                        mesh.material = clonedMaterial;
                    }
                    clonedMaterial.color.copy(this.bodyColor);
                } else {
                    standardMaterial.color.copy(this.bodyColor);
                }
            });
        });
    }

    public update(delta: number, _progressZ: number) {
        if (!this.mesh) return; 

        const throttle = this.inputSystem.isActionPressed('throttle');
        const brake = this.inputSystem.isActionPressed('brake');
        const left = this.inputSystem.isActionPressed('left');
        const right = this.inputSystem.isActionPressed('right');

        const speedRatio = THREE.MathUtils.clamp(Math.abs(this.speed) / this.maxSpeed, 0, 1);
        this.throttleAmount = THREE.MathUtils.damp(this.throttleAmount, throttle ? 1 : 0, throttle ? 3.2 : 8.5, delta);

        if (this.throttleAmount > 0.01) {
            const launchTorque = THREE.MathUtils.lerp(0.95, 0.25, speedRatio);
            const aeroResistance = speedRatio * speedRatio * 0.35;
            this.speed += this.acceleration * this.throttleAmount * Math.max(0.08, launchTorque - aeroResistance) * delta;
        } else if (brake) {
            if (this.speed > 0) {
                this.speed -= this.acceleration * 1.35 * delta;
            } else {
                this.speed -= this.acceleration * 0.45 * delta;
            }
        } else {
            const drag = 1.8 + Math.abs(this.speed) * 0.035;
            this.speed = THREE.MathUtils.damp(this.speed, 0, drag, delta);
        }
        
        this.speed = Math.max(-this.maxReverseSpeed, Math.min(this.speed, this.maxSpeed));

        const targetSteer = (right ? 1 : 0) - (left ? 1 : 0);
        const reversingSteer = targetSteer !== 0 && this.steeringInput !== 0 && Math.sign(targetSteer) !== Math.sign(this.steeringInput);
        const steerResponse = reversingSteer ? 24 : 10.5;

        this.steeringInput = THREE.MathUtils.damp(this.steeringInput, targetSteer, steerResponse, delta);
        this.steeringAngle = THREE.MathUtils.damp(this.steeringAngle, this.steeringInput * this.maxSteeringAngle, reversingSteer ? 22 : 12, delta);

        const signedMovingSpeed = Math.abs(this.speed) < 0.05 ? 0 : this.speed;
        const steeringYawRate = Math.tan(this.steeringAngle) * signedMovingSpeed / this.wheelBase;

        const counterSteering = steeringYawRate !== 0 && this.yawVelocity !== 0 && Math.sign(steeringYawRate) !== Math.sign(this.yawVelocity);
        this.yawVelocity = THREE.MathUtils.damp(this.yawVelocity, steeringYawRate, counterSteering ? 13 : 6.8, delta);
        this.headingAngle += this.yawVelocity * delta;

        const lateralVelocity = Math.sin(this.headingAngle) * this.speed;
        this.positionX += lateralVelocity * delta;

        const roadLimit = RoadSystem.ROAD_WIDTH / 2 - this.edgePadding;
        const minX = -roadLimit;
        const maxX = roadLimit;

        if (this.positionX < minX || this.positionX > maxX) {
            const edgeSide = this.positionX < minX ? -1 : 1;
            const movingIntoEdge = lateralVelocity * edgeSide > 0;
            this.positionX = THREE.MathUtils.clamp(this.positionX, minX, maxX);

            if (movingIntoEdge) {
                const sideSlip = THREE.MathUtils.clamp(Math.abs(lateralVelocity) / 18, 0, 1);
                const speedLoss = 1 - sideSlip * 0.55 * delta;
                this.speed *= speedLoss;
            }
        }

        this.forwardSpeed = Math.cos(this.headingAngle) * this.speed;

        this.wheelSpin -= this.speed * delta * 1.4;
        this.frontWheelPivots.forEach(pivot => {
            pivot.rotation.z = this.steeringAngle;
        });
        this.rollingWheels.forEach(wheel => {
            wheel.rotation.x = this.wheelSpin;
        });

        this.mesh.position.x = this.positionX;
        this.mesh.rotation.y = Math.PI - this.headingAngle;
        this.mesh.rotation.z = 0;
        this.mesh.rotation.x = 0;
    }
}
