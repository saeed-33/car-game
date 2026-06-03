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

    private readonly GAME_DURATION = 120;
    private timeLeft: number = this.GAME_DURATION;
    private distanceScore: number = 0;
    private conesHit: number = 0;
    private isGameOver: boolean = false;

    constructor() {
        this.gameScene = new GameScene();
        this.clock = new THREE.Clock();

        this.inputSystem = new InputSystem();
        new LightingSystem(this.gameScene.scene); 
        
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

        if (this.isGameOver) {
            this.gameScene.render();
            return;
        }

        const delta = this.clock.getDelta();

        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.triggerGameOver();
        }

        if (this.car.speed > 0) {
            this.distanceScore += this.car.speed * delta;
        }

        const progress = 1 - (this.timeLeft / this.GAME_DURATION);

        this.car.update(delta);

        if (Math.abs(this.car.speed) > 0) {
            this.gameScene.worldGroup.position.z += this.car.speed * delta;
        }

        const camZ = this.gameScene.camera.position.z;
        const currentWorldZ = this.gameScene.worldGroup.position.z;
        
        this.roadSystem.update(camZ, currentWorldZ);
        this.treeSystem.update(camZ, currentWorldZ);
        this.obstacleSystem.update(camZ, currentWorldZ, progress, delta); 

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

        // @ts-ignore
        if (this.gameScene.isTopDownView) {
            this.gameScene.camera.position.x = this.car.mesh ? this.car.mesh.position.x : 0;
            this.gameScene.camera.lookAt(this.car.mesh ? this.car.mesh.position.x : 0, 0, -10);
        } else {
            this.gameScene.camera.position.x = 0;
            this.gameScene.camera.lookAt(0, 1, -15);
        }

        this.ui.updateStats(this.timeLeft, this.distanceScore, this.conesHit);
        this.gameScene.render();
    }

    private triggerGameOver() {
        this.isGameOver = true;
        this.car.speed = 0; 
        this.ui.showGameOver(this.distanceScore, this.conesHit);
    }
}