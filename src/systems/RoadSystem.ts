import * as THREE from 'three';

export interface RoadVariant {
    id: string;
    name: string;
    description: string;
    radiusX: number;
    radiusZ: number;
    phaseOffset: number;
    secondaryScale: number;
    tertiaryScale: number;
    wobbleScale: number;
}

export class RoadSystem {
    public static readonly COURSE_DURATION = 120;
    public static readonly LOOP_LENGTH = 7600;
    public static readonly COURSE_LENGTH = RoadSystem.LOOP_LENGTH;
    public static readonly START_LINE_Z = 3;
    public static readonly FINISH_LINE_Z = RoadSystem.START_LINE_Z - RoadSystem.COURSE_LENGTH;
    public static readonly ROAD_WIDTH = 32;
    public static readonly LANE_COUNT = 5;
    public static readonly ROAD_EDGE_OFFSET = RoadSystem.ROAD_WIDTH / 2 - 0.2;
    public static readonly MAP_EXTENT = 1450;
    public static readonly ROUTE_VARIANTS: RoadVariant[] = [
        {
            id: 'speed-loop',
            name: 'Speed Loop',
            description: 'Wide flowing turns',
            radiusX: 1110,
            radiusZ: 1230,
            phaseOffset: 0,
            secondaryScale: 0.55,
            tertiaryScale: 0.35,
            wobbleScale: 0.4
        },
        {
            id: 'city-bends',
            name: 'City Bends',
            description: 'Medium curves and quick changes',
            radiusX: 980,
            radiusZ: 1120,
            phaseOffset: 0.65,
            secondaryScale: 1,
            tertiaryScale: 0.7,
            wobbleScale: 0.75
        },
        {
            id: 'technical',
            name: 'Technical',
            description: 'Tighter corners',
            radiusX: 880,
            radiusZ: 1030,
            phaseOffset: 1.15,
            secondaryScale: 1.35,
            tertiaryScale: 1.1,
            wobbleScale: 1.1
        }
    ];

    private static currentRoute: RoadVariant = RoadSystem.ROUTE_VARIANTS[0] as RoadVariant;

    private roadSections: THREE.Group[] = [];
    private laneMarkings: THREE.Mesh[] = [];
    private courseLines: THREE.Group[] = [];

    private roadLength = 42;
    private sectionCount = 8;

    private markingSpacing = 6;
    private markingCount = 56;

    public static getCurveOffset(z: number): number {
        return RoadSystem.getLoopMapPoint(z).x;
    }

    public static getCurveTangentAngle(z: number): number {
        const before = RoadSystem.getLoopMapPoint(z + 1);
        const after = RoadSystem.getLoopMapPoint(z - 1);
        return Math.atan2(after.x - before.x, after.y - before.y);
    }

    public static getLoopMapPoint(z: number, sideOffset = 0): THREE.Vector2 {
        const frequency = (Math.PI * 2) / RoadSystem.LOOP_LENGTH;
        const route = RoadSystem.currentRoute;
        const phase = z * frequency + route.phaseOffset;
        const radiusX = route.radiusX + sideOffset;
        const radiusZ = route.radiusZ + sideOffset * 0.9;
        const x = Math.sin(phase) * radiusX
            + Math.sin(phase * 3 + 0.7) * 125 * route.secondaryScale
            + Math.sin(phase * 6 - 1.9) * 55 * route.tertiaryScale
            + Math.sin(phase * 9 + 0.3) * 28 * route.wobbleScale;
        const y = -Math.cos(phase) * radiusZ
            + Math.cos(phase * 2 + 1.4) * 105 * route.secondaryScale
            + Math.sin(phase * 5 - 0.5) * 70 * route.tertiaryScale
            + Math.cos(phase * 8 - 0.8) * 35 * route.wobbleScale;
        return new THREE.Vector2(x, y);
    }

    public static setRouteVariant(routeId: string) {
        RoadSystem.currentRoute = RoadSystem.ROUTE_VARIANTS.find((route) => route.id === routeId) ?? RoadSystem.ROUTE_VARIANTS[0] as RoadVariant;
    }

    public static getLaneWidth(): number {
        return RoadSystem.ROAD_WIDTH / RoadSystem.LANE_COUNT;
    }

    public static getLaneCenters(): number[] {
        const laneWidth = RoadSystem.getLaneWidth();
        const leftCenter = -RoadSystem.ROAD_WIDTH / 2 + laneWidth / 2;
        return Array.from({ length: RoadSystem.LANE_COUNT }, (_, index) => leftCenter + index * laneWidth);
    }

    public static getLaneLineOffsets(): number[] {
        const laneWidth = RoadSystem.getLaneWidth();
        return Array.from({ length: RoadSystem.LANE_COUNT - 1 }, (_, index) => -RoadSystem.ROAD_WIDTH / 2 + laneWidth * (index + 1));
    }

    public static trackToLocal(trackZ: number, lateralOffset: number, referenceZ: number, carScreenZ = 3): THREE.Vector3 {
        const point = RoadSystem.getLoopMapPoint(trackZ, lateralOffset);
        const reference = RoadSystem.getLoopMapPoint(referenceZ);
        const deltaX = point.x - reference.x;
        const deltaZ = point.y - reference.y;

        const referenceAhead = RoadSystem.getLoopMapPoint(referenceZ - 1);
        const forwardX = referenceAhead.x - reference.x;
        const forwardZ = referenceAhead.y - reference.y;
        const forwardAngle = Math.atan2(forwardZ, forwardX);
        const rotation = -Math.PI / 2 - forwardAngle;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        return new THREE.Vector3(
            deltaX * cos - deltaZ * sin,
            0,
            deltaX * sin + deltaZ * cos + carScreenZ
        );
    }

    constructor(private worldGroup: THREE.Group) {
        this.initRoad();
        this.initMarkings();
        this.initCourseLines();
    }

    private initRoad() {
        const roadGeoBase = new THREE.PlaneGeometry(RoadSystem.ROAD_WIDTH, this.roadLength, 1, 16);
        roadGeoBase.rotateX(-Math.PI / 2);

        const grassGeoBase = new THREE.PlaneGeometry(220, this.roadLength, 1, 16);
        grassGeoBase.rotateX(-Math.PI / 2);

        const edgeGeoBase = new THREE.PlaneGeometry(0.1, this.roadLength, 1, 16);
        edgeGeoBase.rotateX(-Math.PI / 2);

        const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9, flatShading: true });

        for (let i = 0; i < this.sectionCount; i++) {
            const sectionGroup = new THREE.Group();
            sectionGroup.userData.trackStart = RoadSystem.START_LINE_Z + this.roadLength - i * this.roadLength;

            const grass = new THREE.Mesh(this.createDynamicGeometry(grassGeoBase), grassMat);
            grass.position.y = -0.05;
            grass.receiveShadow = true;
            sectionGroup.add(grass);

            const road = new THREE.Mesh(this.createDynamicGeometry(roadGeoBase), roadMat);
            road.receiveShadow = true;
            sectionGroup.add(road);

            const leftEdge = new THREE.Mesh(this.createDynamicGeometry(edgeGeoBase), edgeMat);
            leftEdge.userData.lateralOffset = -RoadSystem.ROAD_EDGE_OFFSET;
            leftEdge.position.y = 0.01;
            sectionGroup.add(leftEdge);

            const rightEdge = new THREE.Mesh(this.createDynamicGeometry(edgeGeoBase), edgeMat);
            rightEdge.userData.lateralOffset = RoadSystem.ROAD_EDGE_OFFSET;
            rightEdge.position.y = 0.01;
            sectionGroup.add(rightEdge);

            this.roadSections.push(sectionGroup);
            this.worldGroup.add(sectionGroup);
        }
    }

    private initMarkings() {
        const markGeoBase = new THREE.PlaneGeometry(0.15, 2, 1, 4);
        markGeoBase.rotateX(-Math.PI / 2);
        const markMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2 });
        const lineOffsets = RoadSystem.getLaneLineOffsets();

        for (let i = 0; i < this.markingCount; i++) {
            lineOffsets.forEach((lateralOffset) => {
                const mark = new THREE.Mesh(markGeoBase.clone(), markMat);
                mark.userData.trackZ = RoadSystem.START_LINE_Z - i * this.markingSpacing;
                mark.userData.lateralOffset = lateralOffset;
                this.laneMarkings.push(mark);
                this.worldGroup.add(mark);
            });
        }
    }

    private initCourseLines() {
        const startLine = this.createCourseLine(0x22cc55, 0xffffff);
        startLine.userData.trackZ = RoadSystem.START_LINE_Z;
        this.courseLines.push(startLine);
        this.worldGroup.add(startLine);

        const endLine = this.createCourseLine(0xffffff, 0x111111);
        endLine.userData.trackZ = RoadSystem.FINISH_LINE_Z;
        this.courseLines.push(endLine);
        this.worldGroup.add(endLine);
    }

    private createDynamicGeometry(base: THREE.BufferGeometry): THREE.BufferGeometry {
        const geometry = base.clone();
        const pos = geometry.attributes.position as THREE.BufferAttribute;
        geometry.userData.basePositions = new Float32Array(pos.array as ArrayLike<number>);
        geometry.computeVertexNormals();
        return geometry;
    }

    private createCourseLine(colorA: number, colorB: number): THREE.Group {
        const group = new THREE.Group();
        const tileCount = 32;
        const tileWidth = RoadSystem.ROAD_WIDTH / tileCount;
        const lineDepth = 0.8;

        for (let i = 0; i < tileCount; i++) {
            const mat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? colorA : colorB });
            const tile = new THREE.Mesh(new THREE.PlaneGeometry(tileWidth, lineDepth), mat);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(-(RoadSystem.ROAD_WIDTH / 2) + tileWidth / 2 + i * tileWidth, 0.035, 0);
            group.add(tile);
        }

        return group;
    }

    private updateGeometry(geometry: THREE.BufferGeometry, trackStart: number, referenceZ: number, extraLateralOffset: number) {
        const pos = geometry.attributes.position as THREE.BufferAttribute;
        const base = geometry.userData.basePositions as Float32Array;

        for (let i = 0; i < pos.count; i++) {
            const baseX = (base[i * 3] ?? 0) + extraLateralOffset;
            const baseY = base[i * 3 + 1] ?? 0;
            const baseZ = base[i * 3 + 2] ?? 0;
            const local = RoadSystem.trackToLocal(trackStart + baseZ, baseX, referenceZ);
            pos.setXYZ(i, local.x, baseY, local.z);
        }

        pos.needsUpdate = true;
    }

    private placeAlongTrack(object: THREE.Object3D, trackZ: number, referenceZ: number, lateralOffset = 0) {
        const local = RoadSystem.trackToLocal(trackZ, lateralOffset, referenceZ);
        object.position.set(local.x, object.position.y, local.z);
        object.rotation.y = this.getLocalRoadAngle(trackZ, referenceZ);
    }

    private getLocalRoadAngle(trackZ: number, referenceZ: number): number {
        const current = RoadSystem.trackToLocal(trackZ, 0, referenceZ);
        const ahead = RoadSystem.trackToLocal(trackZ - 1, 0, referenceZ);
        return Math.atan2(ahead.x - current.x, ahead.z - current.z);
    }

    public update(_cameraZ: number, progressZ: number) {
        const referenceZ = RoadSystem.START_LINE_Z - progressZ;

        this.roadSections.forEach((section, index) => {
            const trackStart = referenceZ + this.roadLength - index * this.roadLength;
            section.userData.trackStart = trackStart;

            section.children.forEach(child => {
                const mesh = child as THREE.Mesh;
                if (!mesh.geometry) return;
                this.updateGeometry(mesh.geometry, trackStart, referenceZ, mesh.userData.lateralOffset ?? 0);
            });
        });

        this.laneMarkings.forEach((mark, index) => {
            const lineCount = RoadSystem.LANE_COUNT - 1;
            mark.userData.trackZ = referenceZ - Math.floor(index / lineCount) * this.markingSpacing;
            this.placeAlongTrack(mark, mark.userData.trackZ, referenceZ, mark.userData.lateralOffset ?? 0);
        });

        this.courseLines.forEach(line => {
            this.placeAlongTrack(line, line.userData.trackZ, referenceZ);
        });
    }
}
