import * as THREE from 'three';
import { GameScene } from './GameScene';
import { InputSystem } from '../systems/InputSystem';
import { LightingSystem } from '../systems/LightingSystem';
import { TreeSystem } from '../systems/TreeSystem';
import { RoadSystem } from '../systems/RoadSystem';
import { ObstacleSystem } from '../systems/ObstacleSystem';
import { UI } from '../systems/UI';
import type { GameSettings } from '../systems/UI';
import { Car } from '../entities/Car';

export class Game {
    private gameScene: GameScene;
    private clock: THREE.Clock;

    private inputSystem: InputSystem;
    private treeSystem: TreeSystem;
    private roadSystem: RoadSystem;
    private obstacleSystem: ObstacleSystem;
    private ui: UI;
    private car: Car;

    private readonly GAME_DURATION = RoadSystem.COURSE_DURATION; // 2 Minutes
    private timeLeft: number = this.GAME_DURATION;
    private distanceScore: number = 0;
    private conesHit: number = 0;
    private isGameOver: boolean = false;
    private isRaceStarted: boolean = false;
    private trackProgress: number = 0;

    constructor() {
        this.gameScene = new GameScene();
        this.clock = new THREE.Clock();

        this.inputSystem = new InputSystem();
        new LightingSystem(this.gameScene.scene); 
        
        this.roadSystem = new RoadSystem(this.gameScene.worldGroup);
        this.treeSystem = new TreeSystem(this.gameScene.worldGroup);
        this.obstacleSystem = new ObstacleSystem(this.gameScene.worldGroup);

        this.car = new Car(this.gameScene.scene, this.inputSystem);

        this.ui = new UI(
            () => this.gameScene.toggleCamera(),
            (pressed) => this.inputSystem.setVirtualAction('throttle', pressed),
            (settings) => this.startRace(settings)
        );
    }

    public start() {
        this.gameLoop();
    }

    private gameLoop = () => {
        requestAnimationFrame(this.gameLoop);

        if (this.isGameOver) {
            this.gameScene.render();
            return;
        }

        const delta = Math.min(this.clock.getDelta(), 1 / 30);

        if (!this.isRaceStarted) {
            this.gameScene.render();
            return;
        }

        if (this.inputSystem.wasActionPressed('camera')) {
            this.gameScene.toggleCamera();
        }

        // 1. UPDATE TIMERS & SCORE
        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.triggerGameOver();
            return;
        }

        if (this.car.forwardSpeed > 0) {
            this.distanceScore += this.car.forwardSpeed * delta;
        }

        const progress = 1 - (this.timeLeft / this.GAME_DURATION);

        // 2. WORLD UPDATE & MOVEMENT
        this.car.update(delta, this.trackProgress);

        if (Math.abs(this.car.forwardSpeed) > 0) {
            this.trackProgress += this.car.forwardSpeed * delta;
        }

        const camZ = this.gameScene.camera.position.z;
        
        this.roadSystem.update(camZ, this.trackProgress);
        this.treeSystem.update(camZ, this.trackProgress);
        this.obstacleSystem.update(camZ, this.trackProgress, progress, delta); 

        if (this.trackProgress >= RoadSystem.COURSE_LENGTH) {
            this.triggerGameOver('FINISH!');
            return;
        }

        // 3. COLLISION DETECTION
        const carHitbox = this.car.getHitbox();
        if (carHitbox) {
            this.obstacleSystem.obstacles.forEach(obs => {
                if (!obs.isHit) {
                    const coneHitbox = new THREE.Box3().setFromObject(obs.mesh);
                    const coneSize = new THREE.Vector3();
                    coneHitbox.getSize(coneSize);
                    coneHitbox.expandByVector(new THREE.Vector3(-coneSize.x * 0.35, 0, -coneSize.z * 0.35));

                    if (carHitbox.intersectsBox(coneHitbox)) {
                        obs.isHit = true; 
                        
                        obs.velocity.set(
                            (Math.random() - 0.5) * 30, 
                            15,                         
                            -this.car.speed * 0.5       
                        );

                        this.car.speed *= 0.2; 
                        this.conesHit++;
                        this.distanceScore -= 500; 
                        
                        if (this.distanceScore < 0) this.distanceScore = 0; 
                    }
                }
            });
        }

        // 4. DYNAMIC SWAYING CAMERA
        const carX = this.car.mesh?.position.x ?? 0;
        
        if (this.gameScene.cameraMode === 'topDown') {
            if (this.gameScene.camera.fov !== 75) {
                this.gameScene.camera.fov = 75;
                this.gameScene.camera.updateProjectionMatrix();
            }
            this.gameScene.camera.position.x = carX;
            this.gameScene.camera.position.y = 25;
            this.gameScene.camera.position.z = 8;
            this.gameScene.camera.lookAt(carX, 0, -10);
        } else if (this.gameScene.cameraMode === 'driver' && this.car.mesh) {
            if (this.gameScene.camera.fov !== 68) {
                this.gameScene.camera.fov = 68;
                this.gameScene.camera.updateProjectionMatrix();
            }
            const driverPosition = this.car.mesh.localToWorld(new THREE.Vector3(0, 10, 34));
            const driverLookTarget = this.car.mesh.localToWorld(new THREE.Vector3(0, 7, 120));
            this.gameScene.camera.position.copy(driverPosition);
            this.gameScene.camera.lookAt(driverLookTarget);
        } else {
            if (this.gameScene.camera.fov !== 75) {
                this.gameScene.camera.fov = 75;
                this.gameScene.camera.updateProjectionMatrix();
            }
            this.gameScene.camera.position.x = THREE.MathUtils.lerp(this.gameScene.camera.position.x, carX, 0.35);
            this.gameScene.camera.position.y = THREE.MathUtils.lerp(this.gameScene.camera.position.y, 2.5, 0.25);
            this.gameScene.camera.position.z = THREE.MathUtils.lerp(this.gameScene.camera.position.z, 6, 0.25);
            this.gameScene.camera.lookAt(carX, 1, -15);
        }

        // 5. RENDER
        this.ui.updateStats(this.timeLeft, this.distanceScore, this.conesHit, this.car.forwardSpeed);
        this.ui.updateMap(this.trackProgress, carX, this.car.mesh?.position.z ?? 3);
        this.gameScene.render();
    }

    private startRace(settings: GameSettings) {
        this.inputSystem.setBindings(settings.bindings);
        this.car.setColor(settings.carColor);
        RoadSystem.setRouteVariant(settings.routeId);
        this.clock.getDelta();
        this.isRaceStarted = true;
    }

    private triggerGameOver(title = 'TIME IS UP!') {
        this.isGameOver = true;
        this.car.speed = 0; 
        this.ui.showGameOver(this.distanceScore, this.conesHit, title);
    }
}
