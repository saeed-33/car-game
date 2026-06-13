import * as THREE from 'three';
import { GameScene } from './GameScene';
import { InputSystem } from '../systems/InputSystem';
import { LightingSystem } from '../systems/LightingSystem';
import { TreeSystem } from '../systems/TreeSystem';
import { RoadSystem } from '../systems/RoadSystem';
import { ObstacleSystem } from '../systems/ObstacleSystem';
import { UI } from '../systems/UI';
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

    // ==========================================
    // GAME STATE VARIABLES
    // ==========================================
    private readonly GAME_DURATION = 120; // 2 Minutes
    private timeLeft: number = this.GAME_DURATION;
    private distanceScore: number = 0;
    private conesHit: number = 0;
    private isGameOver: boolean = false;

    constructor() {
        this.gameScene = new GameScene();
        this.clock = new THREE.Clock();

        this.inputSystem = new InputSystem();
        new LightingSystem(this.gameScene.scene); // Stays unused by properties
        
        this.roadSystem = new RoadSystem(this.gameScene.worldGroup);
        this.treeSystem = new TreeSystem(this.gameScene.worldGroup);
        this.obstacleSystem = new ObstacleSystem(this.gameScene.worldGroup);

        this.car = new Car(this.gameScene.scene, this.inputSystem);

        this.ui = new UI(() => {
            this.gameScene.toggleCamera();
        });
    }

    public start() {
        this.gameLoop();
    }

    private gameLoop = () => {
        requestAnimationFrame(this.gameLoop);

        // If game is over, stop updating physics, just render the frozen screen
        if (this.isGameOver) {
            this.gameScene.render();
            return;
        }

        const delta = this.clock.getDelta();

        // 1. UPDATE TIMERS & SCORE
        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.triggerGameOver();
        }

        if (this.car.speed > 0) {
            // Distance increases based on forward speed
            this.distanceScore += this.car.speed * delta;
        }

        // Calculate progress ratio (0.0 at start, 1.0 at 2 minutes)
        const progress = 1 - (this.timeLeft / this.GAME_DURATION);

        // 2. UPDATE ENTITIES
        this.car.update(delta);

        if (Math.abs(this.car.speed) > 0) {
            this.gameScene.worldGroup.position.z += this.car.speed * delta;
        }

        const camZ = this.gameScene.camera.position.z;
        const worldZ = this.gameScene.worldGroup.position.z;
        
        this.roadSystem.update(camZ, worldZ);
        this.treeSystem.update(camZ, worldZ);
        // Pass progress to obstacle system for dynamic difficulty!
        this.obstacleSystem.update(camZ, worldZ, progress); 

        // 3. COLLISION DETECTION
       // 3. COLLISION DETECTION
        const carHitbox = this.car.getHitbox();
        if (carHitbox) {
            this.obstacleSystem.obstacles.forEach(obs => {
                if (!obs.isHit) {
                    // 1. Get the raw mathematical box of the cone model (which might be too big)
                    const coneHitbox = new THREE.Box3().setFromObject(obs.mesh);
                    
                    // 2. Mathematically shrink the cone's hitbox by 35% on the sides!
                    // This removes the invisible artist geometry and makes near-misses feel fair.
                    const coneSize = new THREE.Vector3();
                    coneHitbox.getSize(coneSize);
                    coneHitbox.expandByVector(new THREE.Vector3(-coneSize.x * 0.35, 0, -coneSize.z * 0.35));

                    // 3. Check for the crash using our new tightened hitboxes
                    if (carHitbox.intersectsBox(coneHitbox)) {
                        obs.isHit = true; 
                        this.car.speed *= 0.3; // Speed penalty
                        this.conesHit++;       // Increase hit counter
                    }
                }
            });
        }

        // 4. UPDATE HUD
        this.ui.updateStats(this.timeLeft, this.distanceScore, this.conesHit);

        this.gameScene.render();
    }

    private triggerGameOver() {
        this.isGameOver = true;
        this.car.speed = 0; // Stop car instantly
        this.ui.showGameOver(this.distanceScore, this.conesHit);
    }
}