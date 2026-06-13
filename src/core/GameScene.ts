import * as THREE from 'three';

export class GameScene {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public worldGroup: THREE.Group;
private isTopDownView: boolean = false;
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87ceeb, 30, 100);
        this.scene.background = new THREE.Color(0x87ceeb); // Default blue sky
this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // NEW: Action Chase Cam (Lower and closer)
        this.camera.position.set(0, 2.5, 6); 
        this.camera.lookAt(0, 1, -15); // Look slightly above the horizon
       

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.body.appendChild(this.renderer.domElement);

        this.worldGroup = new THREE.Group();
        this.scene.add(this.worldGroup);

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    // THIS is the missing function!
    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
public toggleCamera() {
        this.isTopDownView = !this.isTopDownView;
        
        if (this.isTopDownView) {
            // NEW: Drone View (High up, looking down at the car)
            this.camera.position.set(0, 25, 8);
            this.camera.lookAt(0, 0, -10);
        } else {
            // NEW: Action Chase Cam
            this.camera.position.set(0, 2.5, 6); 
            this.camera.lookAt(0, 1, -15);
        }
    }
    public render() {
        this.renderer.render(this.scene, this.camera);
    }
}