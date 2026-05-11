// src/environment.ts
import * as THREE from 'three';

export function createEnvironment(scene: THREE.Scene) {
    // ==========================================
    // 1. IMPROVED TERRAIN (Bumpy Grass)
    // ==========================================
    // We add more segments (100, 100) so we have more vertices to create hills
    const grassGeometry = new THREE.PlaneGeometry(200, 200, 100, 100);
    
    // Manipulate vertices to create hills
        const positionAttribute = grassGeometry.attributes.position as THREE.BufferAttribute;    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        // Keep a flat "valley" in the middle for the road (x between -6 and 6)
        if (Math.abs(x) > 6) {
            // Create random height bumps. The further from the road, the higher they can get.
            const height = Math.random() * 1.5; 
            positionAttribute.setZ(i, height); // Z is "up" before we rotate the plane
        }
    }
    // Very important: Recompute normals so shadows and lighting curve around our new hills!
    grassGeometry.computeVertexNormals(); 

    const grassMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d5a27, 
        roughness: 0.9, 
        metalness: 0.0,
        flatShading: true // Gives it a cool low-poly look
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.1, -20);
    grass.receiveShadow = true;
    scene.add(grass);

    // ==========================================
    // 2. TWEAKED ROAD
    // ==========================================
    const roadGeometry = new THREE.PlaneGeometry(8, 120);
    // Made roughness slightly lower and metalness slightly higher for a "wet asphalt" look
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.2 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, -30);
    road.receiveShadow = true;
    scene.add(road);

    // Road Markings (Dashed Line)
    const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5, emissive: 0x333300 });
    for (let i = 0; i < 20; i++) {
        const markingGeometry = new THREE.PlaneGeometry(0.15, 2);
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(0, 0.02, -5 - i * 5);
        scene.add(marking);
    }

    // Road Edges (White Lines)
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });[-3.8, 3.8].forEach((x) => {
        const edgeGeometry = new THREE.PlaneGeometry(0.1, 120);
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.rotation.x = -Math.PI / 2;
        edge.position.set(x, 0.02, -30);
        scene.add(edge);
    });

    // ==========================================
    // 3. IMPROVED STYLIZED TREES
    // ==========================================
    const treePositions =[
        new THREE.Vector3(-6, 0, -10), new THREE.Vector3(6, 0, -20),
        new THREE.Vector3(-8, 0, -30), new THREE.Vector3(7, 0, -40),
        new THREE.Vector3(-5, 0, -50), new THREE.Vector3(8, 0, -60),
        // Added a few more trees further back
        new THREE.Vector3(-12, 0, -25), new THREE.Vector3(15, 0, -35),
    ];

    treePositions.forEach((pos, index) => {
        const scale = 0.8 + Math.random() * 0.4;
        
        // 5 sides = low poly trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.3 * scale, 2 * scale, 5); 
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9, flatShading: true });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(pos.x, scale, pos.z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        scene.add(trunk);

        const foliageColors =[0x228b22, 0x2e8b2e, 0x3cb371];
        // The `as number` fixes the strict TypeScript error
        const foliageColor = foliageColors[index % 3] as number; 

        // Replaced SphereGeometry with DodecahedronGeometry for stylized leaves
        const foliageGeo = new THREE.DodecahedronGeometry(1.2 * scale, 0);
        const foliageMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8, flatShading: true });
        
        const foliage1 = new THREE.Mesh(foliageGeo, foliageMat);
        foliage1.position.set(pos.x, 2.5 * scale, pos.z);
        // Randomly rotate the leaves so no two trees look exactly identical
        foliage1.rotation.set(Math.random(), Math.random(), Math.random());
        foliage1.castShadow = true;
        foliage1.receiveShadow = true;
        scene.add(foliage1);

        const foliage2 = new THREE.Mesh(foliageGeo, foliageMat);
        foliage2.scale.set(0.8, 0.8, 0.8);
        foliage2.position.set(pos.x, 3.5 * scale, pos.z);
        foliage2.rotation.set(Math.random(), Math.random(), Math.random());
        foliage2.castShadow = true;
        scene.add(foliage2);
    });

    // ==========================================
    // 4. NEW: SCATTERED ROCKS
    // ==========================================
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9, flatShading: true });
    
    for(let i = 0; i < 30; i++) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        
        // Random position between -40 and +40
        const x = (Math.random() - 0.5) * 80; 
        
        // Don't place rocks on the road!
        if(Math.abs(x) < 5.5) continue; 
        
        const z = (Math.random() - 0.5) * 100 - 20;
        
        // Randomize size heavily
        const scale = Math.random() * 0.4 + 0.1;
        rock.scale.set(scale, scale * 0.8, scale); // Squish them slightly
        
        // Place them on the ground
        rock.position.set(x, scale/2, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }
}