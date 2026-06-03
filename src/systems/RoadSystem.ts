import * as THREE from 'three';

export class RoadSystem {
    private roadSections: THREE.Group[] = [];
    private laneMarkings: THREE.Mesh[] = [];
    
    private roadLength = 28;
    private sectionCount = 6;
    private totalRoadLength = 168; 

    private markingSpacing = 6;
    private markingCount = 35; 
    private totalMarkingLength = 210;

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

            const leftEdge = new THREE.Mesh(new THREE.PlaneGeometry(0.1, this.roadLength), edgeMat);
            leftEdge.rotation.x = -Math.PI / 2;
            leftEdge.position.set(-3.8, 0.01, 0);
            sectionGroup.add(leftEdge);

            const rightEdge = new THREE.Mesh(new THREE.PlaneGeometry(0.1, this.roadLength), edgeMat);
            rightEdge.rotation.x = -Math.PI / 2;
            rightEdge.position.set(3.8, 0.01, 0);
            sectionGroup.add(rightEdge);

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
            mark.position.set(0, 0.02, -(i - 5) * this.markingSpacing);
            this.laneMarkings.push(mark);
            this.worldGroup.add(mark);
        }
    }

    public update(cameraZ: number, worldZ: number) {
        this.roadSections.forEach(section => {
            const absoluteZ = worldZ + section.position.z;
            
            if (absoluteZ > cameraZ + 28) {
                section.position.z -= this.totalRoadLength; 
            } else if (absoluteZ < cameraZ - this.totalRoadLength + 28) {
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