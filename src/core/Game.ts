import * as THREE from 'three';
import { GameScene } from './GameScene';
import { InputSystem } from '../systems/InputSystem';
import { LightingSystem } from '../systems/LightingSystem';
import { TreeSystem } from '../systems/TreeSystem';
import { RoadSystem } from '../systems/RoadSystem'; // IMPORT NEW SYSTEM
import { Car } from '../entities/Car';
import { UI } from '../systems/UI';
export class Game {
    private gameScene: GameScene;
    private clock: THREE.Clock;

    private inputSystem: InputSystem;
    private lightingSystem: LightingSystem;
    private treeSystem: TreeSystem;
    private roadSystem: RoadSystem; // ADD ROAD SYSTEM
    
    private car: Car;
private ui: UI;
    constructor() {
        this.gameScene = new GameScene();
        this.clock = new THREE.Clock();
// Initialize UI and link the button to the camera toggle function
        this.ui = new UI(() => {
            this.gameScene.toggleCamera();
        });
        this.inputSystem = new InputSystem();
        this.lightingSystem = new LightingSystem(this.gameScene.scene);
        
        // Initialize world systems
        this.roadSystem = new RoadSystem(this.gameScene.worldGroup);
        this.treeSystem = new TreeSystem(this.gameScene.worldGroup);

        this.car = new Car(this.gameScene.scene, this.inputSystem);
        
        // Note: I deleted the temporary gray ground we had here!
    }

    public start() {
        this.gameLoop();
    }

    private gameLoop = () => {
        requestAnimationFrame(this.gameLoop);
        const delta = this.clock.getDelta();

        // 1. Update Car Physics
        this.car.update(delta);

        // 2. Move the World (+Z direction)
        if (this.car.speed > 0) {
            this.gameScene.worldGroup.position.z += this.car.speed * delta;
        }
        // 2. Move the World (+Z direction for forward, -Z for reverse)
        // CHANGE THIS LINE to use Math.abs() so the world moves when speed is negative!
        if (Math.abs(this.car.speed) > 0) {
            this.gameScene.worldGroup.position.z += this.car.speed * delta;
        }

        // 3. Recycle World Objects (Infinite Loop Illusion!)
        const camZ = this.gameScene.camera.position.z;
        const worldZ = this.gameScene.worldGroup.position.z;
        
        this.roadSystem.update(camZ, worldZ);
        this.treeSystem.update(camZ, worldZ);

        // 4. Render
        this.gameScene.render();
    }
}