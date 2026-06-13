import * as THREE from 'three';

export class RoadSystem {
    private roadSections: THREE.Group[] = [];
    private laneMarkings: THREE.Mesh[] = [];
    
    private roadLength = 28;
    private sectionCount = 6; // Increased to 6 for a longer runway
    private totalRoadLength = 168; // 6 * 28

    private markingSpacing = 6;
    private markingCount = 35; 
    private totalMarkingLength = 210; // 35 * 6

    constructor(private worldGroup: THREE.Group) {
        this.initRoad();
        this.initMarkings();
    }

    private initRoad() {
        const roadGeo = new THREE.PlaneGeometry(8, this.roadLength);
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const grassGeo = new THREE.PlaneGeometry(200, this.roadLength);
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9, flatShading: true });

        for (let i = 0; i < this.sectionCount; i++) {
            const sectionGroup = new THREE.Group();

            const grass = new THREE.Mesh(grassGeo, grassMat);
            grass.rotation.x = -Math.PI / 2;
            grass.position.set(0, -0.05, 0);
            grass.receiveShadow = true;
            sectionGroup.add(grass);

            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.receiveShadow = true;
            sectionGroup.add(road);

            const leftEdgeGeo = new THREE.PlaneGeometry(0.1, this.roadLength);
            const leftEdge = new THREE.Mesh(leftEdgeGeo, edgeMat);
            leftEdge.rotation.x = -Math.PI / 2;
            leftEdge.position.set(-3.8, 0.01, 0);
            sectionGroup.add(leftEdge);

            const rightEdgeGeo = new THREE.PlaneGeometry(0.1, this.roadLength);
            const rightEdge = new THREE.Mesh(rightEdgeGeo, edgeMat);
            rightEdge.rotation.x = -Math.PI / 2;
            rightEdge.position.set(3.8, 0.01, 0);
            sectionGroup.add(rightEdge);

            // FIX 1: Offset the calculation so the road starts 1 full section behind the car!
            sectionGroup.position.z = -(i - 1) * this.roadLength;
            
            this.roadSections.push(sectionGroup);
            this.worldGroup.add(sectionGroup);
        }
    }

    private initMarkings() {
        const markGeo = new THREE.PlaneGeometry(0.15, 2);
        const markMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });

        for (let i = 0; i < this.markingCount; i++) {
            const mark = new THREE.Mesh(markGeo, markMat);
            mark.rotation.x = -Math.PI / 2;
            // FIX 1: Offset markings so they also spawn behind the car
            mark.position.set(0, 0.02, -(i - 5) * this.markingSpacing);
            
            this.laneMarkings.push(mark);
            this.worldGroup.add(mark);
        }
    }

    public update(cameraZ: number, worldZ: number) {
        // FIX 2: Bidirectional Recycling!
        this.roadSections.forEach(section => {
            const absoluteZ = worldZ + section.position.z;
            
            if (absoluteZ > cameraZ + 28) {
                // Passed behind the camera (Driving Forward) -> Teleport Ahead
                section.position.z -= this.totalRoadLength; 
            } else if (absoluteZ < cameraZ - this.totalRoadLength + 28) {
                // Passed too far ahead (Driving Backward) -> Teleport Behind
                section.position.z += this.totalRoadLength; 
            }
        });

        this.laneMarkings.forEach(mark => {
            const absoluteZ = worldZ + mark.position.z;
            
            if (absoluteZ > cameraZ + 28) {
                mark.position.z -= this.totalMarkingLength;
            } else if (absoluteZ < cameraZ - this.totalMarkingLength + 28) {
                mark.position.z += this.totalMarkingLength;
            }
        });
    }
}