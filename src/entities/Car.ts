import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InputSystem } from '../systems/InputSystem';
import { RoadSystem } from '../systems/RoadSystem';

export class Car {
    public mesh: THREE.Group | null = null;
    
    public speed: number = 0;
    public baseMaxSpeed: number = 40; 
    public maxSpeed: number = 40; 
    public maxReverseSpeed: number = 15;
    public acceleration: number = 10; 
    public positionX: number = 0;
    public forwardSpeed: number = 0;

    public turboTimer: number = 0;
    public shieldTimer: number = 0;
    public get isShieldActive() { return this.shieldTimer > 0; }
    public get isTurboActive() { return this.turboTimer > 0; }

    private engineAudio: HTMLAudioElement | null = null;
    private reverseAudio: HTMLAudioElement | null = null;
    private turboAudio: HTMLAudioElement | null = null;
    private shieldAudio: HTMLAudioElement | null = null;
    private brakeAudio: HTMLAudioElement | null = null;

    private sfxVolume: number = 1.0; 
    private baseRotationOffset: number = Math.PI; // Helps fix backwards cars

    private steeringAngle: number = 0;
    private headingAngle: number = 0;
    private yawVelocity: number = 0;
    private wheelSpin: number = 0;
    private frontWheelPivots: THREE.Object3D[] = [];
    private rollingWheels: THREE.Object3D[] = [];
    private throttleAmount: number = 0;
    private steeringInput: number = 0;
    private bodyColor = new THREE.Color(0xffffff);
    private readonly wheelBase = 28;

    constructor(private scene: THREE.Scene, private inputSystem: InputSystem) {
        // Model loading is triggered by initCar() from Game.ts
    }

    public setSfxVolume(vol: number) {
        this.sfxVolume = vol;
    }

    public initSounds() {
        try {
            this.engineAudio = new Audio('/sounds/engine.mp3');
            this.engineAudio.loop = true;
            this.engineAudio.volume = 0;
            this.engineAudio.play().catch(()=>{});

            this.reverseAudio = new Audio('/sounds/reverse.mp3');
            this.reverseAudio.loop = true;
            this.reverseAudio.volume = 0;
            this.reverseAudio.play().catch(()=>{});

            this.brakeAudio = new Audio('/sounds/brake.mp3');
            this.brakeAudio.loop = true;
            this.brakeAudio.volume = 0;
            this.brakeAudio.play().catch(()=>{});

            this.turboAudio = new Audio('/sounds/turbo.mp3');
            this.turboAudio.loop = true; 

            this.shieldAudio = new Audio('/sounds/shield.mp3');
            this.shieldAudio.loop = true; 
        } catch (e) {
            console.warn("Could not load audio files.");
        }
    }

  public async initCar(
        modelPath: string, 
        hexColor: string, 
        customScale: number = 0.12, 
        customRotationY: number = Math.PI, 
        offsetY: number = 0.1,
        customFrontWheels?: string[], // NEW
        customRearWheels?: string[]   // NEW
    ) {
        this.bodyColor.set(hexColor);
        this.baseRotationOffset = customRotationY; 

        return new Promise<void>((resolve) => {
            const loader = new GLTFLoader();
            loader.load(modelPath, (gltf) => {
                if (this.mesh) this.scene.remove(this.mesh); 
                
                this.mesh = gltf.scene;
                this.mesh.position.set(0, offsetY, 3);
                this.mesh.scale.set(customScale, customScale, customScale);
                
                const frontWheels: THREE.Object3D[] = [];
                const rearWheels: THREE.Object3D[] = [];

                // Convert custom arrays to uppercase for safe matching
                const customFrontUpper = customFrontWheels?.map(n => n.toUpperCase()) || [];
                const customRearUpper = customRearWheels?.map(n => n.toUpperCase()) || [];

                this.mesh.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        const upperName = child.name.toUpperCase();
                        let isFront = false;
                        let isRear = false;

                        // 1. Check if the mesh matches the names you typed in UI.ts
                        if (customFrontUpper.includes(upperName)) {
                            isFront = true;
                        } else if (customRearUpper.includes(upperName)) {
                            isRear = true;
                        } 
                        // 2. If no custom names provided, fallback to standard auto-detect
                        else {
                            if (upperName === 'FL' || upperName === 'FR' || upperName.includes('FRONT_LEFT') || upperName.includes('FRONT_RIGHT')) isFront = true;
                            if (upperName === 'RL' || upperName === 'RR' || upperName.includes('REAR_LEFT') || upperName.includes('REAR_RIGHT')) isRear = true;
                        }

                        if (isFront) frontWheels.push(child);
                        if (isRear) rearWheels.push(child);
                    }
                });

                // MAGIC PIVOT FIX
                [...frontWheels, ...rearWheels].forEach(wheel => {
                    const mesh = wheel as THREE.Mesh;
                    if (mesh.geometry) {
                        mesh.geometry.computeBoundingBox();
                        const center = new THREE.Vector3();
                        mesh.geometry.boundingBox!.getCenter(center);
                        mesh.geometry.translate(-center.x, -center.y, -center.z);
                        mesh.position.add(center); 
                    }
                });

                this.frontWheelPivots = frontWheels.map(wheel => this.createSteeringPivot(wheel));
                this.rollingWheels = [...frontWheels, ...rearWheels];
                
                this.applyBodyColor();
                this.scene.add(this.mesh);
                resolve();
            });
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
        // Adjusted slightly for a more universal hitbox across different car models
        return new THREE.Box3(
            new THREE.Vector3(center.x - 0.75, center.y + 0.03, center.z - 1.2),
            new THREE.Vector3(center.x + 0.75, center.y + 1.0, center.z + 1.2)
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
                const stdMat = material as THREE.MeshStandardMaterial;
                if (!stdMat.color) return;
                
                const name = child.name.toUpperCase();
                const isWheel = name.includes('FL') || name.includes('FR') || name.includes('RL') || name.includes('RR') || name.includes('WHEEL');
                const brightness = stdMat.color.r + stdMat.color.g + stdMat.color.b;
                
                if (isWheel || brightness < 0.18) return;

                if (!stdMat.userData.carColorClone) {
                    const cloned = stdMat.clone();
                    cloned.userData.carColorClone = true;
                    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(e => e === material ? cloned : e);
                    else mesh.material = cloned;
                    cloned.color.copy(this.bodyColor);
                } else {
                    stdMat.color.copy(this.bodyColor);
                }
            });
        });
    }

    public activateTurbo(duration: number) {
        this.turboTimer = duration;
        this.maxSpeed = this.baseMaxSpeed + 100;
        this.speed = Math.min(this.speed + 100, this.maxSpeed); 
    }

    public activateShield(duration: number) {
        this.shieldTimer = duration;
    }

    public update(delta: number, _progressZ: number) {
        if (!this.mesh) return; 

        // 1. UPDATE BUFF TIMERS
        if (this.turboTimer > 0) {
            this.turboTimer -= delta;
            if (this.turboTimer <= 0) { this.turboTimer = 0; this.maxSpeed = this.baseMaxSpeed; }
        }
        if (this.shieldTimer > 0) {
            this.shieldTimer -= delta;
            if (this.shieldTimer < 0) this.shieldTimer = 0;
        }

        // 2. GET INPUTS
        const throttle = this.inputSystem.isActionPressed('throttle');
        const reverse = this.inputSystem.isActionPressed('reverse'); 
        const brake = this.inputSystem.isActionPressed('brake');
        const left = this.inputSystem.isActionPressed('left');
        const right = this.inputSystem.isActionPressed('right');

        // 3. AUDIO LOGIC
        const playTurboSound = this.turboTimer > 0;
        const playShieldSound = this.shieldTimer > 0 && !playTurboSound; 

        if (this.turboAudio) {
            this.turboAudio.volume = 0.9 * this.sfxVolume;
            if (playTurboSound) { if (this.turboAudio.paused) this.turboAudio.play().catch(()=>{}); } 
            else { this.turboAudio.pause(); this.turboAudio.currentTime = 0; }
        }

        if (this.shieldAudio) {
            this.shieldAudio.volume = 0.9 * this.sfxVolume;
            if (playShieldSound) { if (this.shieldAudio.paused) this.shieldAudio.play().catch(()=>{}); } 
            else { this.shieldAudio.pause(); this.shieldAudio.currentTime = 0; }
        }

        if (this.engineAudio && this.reverseAudio && this.brakeAudio) {
            if (playTurboSound || playShieldSound) {
                // Mute standard sounds if power-up is active
                this.engineAudio.volume = 0; 
                this.reverseAudio.volume = 0; 
                this.brakeAudio.volume = 0;
            } else {
                // BRAKE SOUND
                if (brake && Math.abs(this.speed) > 5) {
                    this.brakeAudio.volume = 1.0 * this.sfxVolume;
                    this.engineAudio.volume = 0.1 * this.sfxVolume;
                    this.reverseAudio.volume = 0;
                } else {
                    this.brakeAudio.volume = 0;
                    if (this.speed > 1) {
                        this.engineAudio.volume = Math.min(0.2 + (this.speed / this.maxSpeed) * 0.8, 1) * this.sfxVolume;
                        this.reverseAudio.volume = 0;
                    } else if (this.speed < -1) {
                        this.engineAudio.volume = 0;
                        this.reverseAudio.volume = Math.min(0.5 + Math.abs(this.speed / this.maxReverseSpeed) * 0.5, 1) * this.sfxVolume;
                    } else {
                        this.engineAudio.volume = 0.1 * this.sfxVolume; 
                        this.reverseAudio.volume = 0;
                    }
                }
            }
        }

        // 4. PHYSICS LOGIC
        const speedRatio = THREE.MathUtils.clamp(Math.abs(this.speed) / this.maxSpeed, 0, 1);
        this.throttleAmount = THREE.MathUtils.damp(this.throttleAmount, throttle ? 1 : 0, throttle ? 3.2 : 8.5, delta);

        if (brake) {
            // BRAKE: Dampen speed rapidly to ZERO. It does not go backwards.
            this.speed = THREE.MathUtils.damp(this.speed, 0, 15, delta);
        } else if (this.throttleAmount > 0.01) {
            // THROTTLE: Go forward
            const launchTorque = THREE.MathUtils.lerp(0.95, 0.25, speedRatio);
            const aeroResistance = speedRatio * speedRatio * 0.35;
            const currentAccel = this.isTurboActive ? this.acceleration * 2 : this.acceleration;
            this.speed += currentAccel * this.throttleAmount * Math.max(0.08, launchTorque - aeroResistance) * delta;
        } else if (reverse) {
            // REVERSE: Go backwards
            this.speed -= this.acceleration * 0.8 * delta;
        } else {
            // COASTING: Slow down naturally
            const drag = 1.8 + Math.abs(this.speed) * 0.035;
            this.speed = THREE.MathUtils.damp(this.speed, 0, drag, delta);
        }
        
        this.speed = Math.max(-this.maxReverseSpeed, Math.min(this.speed, this.maxSpeed));

        // 5. STEERING
        const targetSteer = (right ? 1 : 0) - (left ? 1 : 0);
        this.steeringInput = THREE.MathUtils.damp(this.steeringInput, targetSteer, 10.5, delta);
        this.steeringAngle = THREE.MathUtils.damp(this.steeringAngle, this.steeringInput * 0.56, 12, delta);

        const signedMovingSpeed = Math.abs(this.speed) < 0.05 ? 0 : this.speed;
        const steeringYawRate = Math.tan(this.steeringAngle) * signedMovingSpeed / this.wheelBase;
        this.yawVelocity = THREE.MathUtils.damp(this.yawVelocity, steeringYawRate, 6.8, delta);
        this.headingAngle += this.yawVelocity * delta;

        const lateralVelocity = Math.sin(this.headingAngle) * this.speed;
        this.positionX += lateralVelocity * delta;

        // ROAD BOUNDARY COLLISION
        const roadLimit = RoadSystem.ROAD_WIDTH / 2 - 0.75;
        if (this.positionX < -roadLimit || this.positionX > roadLimit) {
            const edgeSide = this.positionX < -roadLimit ? -1 : 1;
            this.positionX = THREE.MathUtils.clamp(this.positionX, -roadLimit, roadLimit);
            if (lateralVelocity * edgeSide > 0) this.speed *= (1 - THREE.MathUtils.clamp(Math.abs(lateralVelocity) / 18, 0, 1) * 0.55 * delta);
        }

        this.forwardSpeed = Math.cos(this.headingAngle) * this.speed;
        
        // 6. VISUAL MESH UPDATES
        this.wheelSpin -= this.speed * delta * 1.4;
        this.frontWheelPivots.forEach(pivot => { pivot.rotation.z = this.steeringAngle; });
        this.rollingWheels.forEach(wheel => { wheel.rotation.x = this.wheelSpin; });

        this.mesh.position.x = this.positionX;
        
        // Apply custom rotation fix (baseRotationOffset) so it always points forward properly
        this.mesh.rotation.y = this.baseRotationOffset - this.headingAngle;
    }
}