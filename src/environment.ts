import * as THREE from 'three';

export function createEnvironment(scene: THREE.Scene) {
    // Grass
    const grassGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9, metalness: 0.0 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.1, -20);
    grass.receiveShadow = true;
    scene.add(grass);

    // Road
    const roadGeometry = new THREE.PlaneGeometry(8, 120);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.1 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, -30);
    road.receiveShadow = true;
    scene.add(road);

    // Road Markings
    const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5, emissive: 0x333300 });
    for (let i = 0; i < 20; i++) {
        const markingGeometry = new THREE.PlaneGeometry(0.15, 2);
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(0, 0.02, -5 - i * 5);
        scene.add(marking);
    }

    // Road Edges
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });[-3.8, 3.8].forEach((x) => {
        const edgeGeometry = new THREE.PlaneGeometry(0.1, 120);
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.rotation.x = -Math.PI / 2;
        edge.position.set(x, 0.02, -30);
        scene.add(edge);
    });

    // Trees
    const treePositions =[
        new THREE.Vector3(-6, 0, -10), new THREE.Vector3(6, 0, -20),
        new THREE.Vector3(-8, 0, -30), new THREE.Vector3(7, 0, -40),
        new THREE.Vector3(-5, 0, -50), new THREE.Vector3(8, 0, -60)
    ];

    treePositions.forEach((pos, index) => {
        const scale = 0.8 + Math.random() * 0.4;
        
        const trunkGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 2 * scale, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(pos.x, scale, pos.z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        scene.add(trunk);

        const foliageColors =[0x228b22, 0x2e8b2e, 0x3cb371];
        const foliageColor = foliageColors[index % 3] as number;

        const foliage1Geometry = new THREE.SphereGeometry(1.2 * scale, 8, 8);
        const foliage1Material = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8 });
        const foliage1 = new THREE.Mesh(foliage1Geometry, foliage1Material);
        foliage1.position.set(pos.x, 2.5 * scale, pos.z);
        foliage1.scale.y = 0.8;
        foliage1.castShadow = true;
        foliage1.receiveShadow = true;
        scene.add(foliage1);

        const foliage2Geometry = new THREE.SphereGeometry(1 * scale, 8, 8);
        const foliage2Material = new THREE.MeshStandardMaterial({ color: 0x3cb371, roughness: 0.8 });
        const foliage2 = new THREE.Mesh(foliage2Geometry, foliage2Material);
        foliage2.position.set(pos.x, 3.5 * scale, pos.z);
        foliage2.castShadow = true;
        foliage2.receiveShadow = true;
        scene.add(foliage2);

        const foliage3Geometry = new THREE.SphereGeometry(0.7 * scale, 8, 8);
        const foliage3Material = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
        const foliage3 = new THREE.Mesh(foliage3Geometry, foliage3Material);
        foliage3.position.set(pos.x, 4.3 * scale, pos.z);
        foliage3.castShadow = true;
        foliage3.receiveShadow = true;
        scene.add(foliage3);
    });
}