import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// Preload the GLTF
useGLTF.preload('/models/character/character_rigged.gltf');

export function RiggedCharacter(props: JSX.IntrinsicElements['group']) {
    const group = useRef<THREE.Group>(null);
    // Load the GLTF model
    const { scene } = useGLTF('/models/character/character_rigged.gltf');
    // Clone correctly using SkeletonUtils to ensure SkinnedMesh binds to new bones
    const clonedScene = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);

    useEffect(() => {
        if (!clonedScene) return;

        console.log('RiggedCharacter (GLTF): Mounted');

        // Traverse to enable shadows and find bones
        clonedScene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;
            }
        });

        // Log size for verification
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = box.getSize(new THREE.Vector3());
        console.log('Rigged Character (GLTF) Size:', size);

        // Helper
        const helper = new THREE.BoxHelper(clonedScene, 0xffff00);
        clonedScene.add(helper);

        // Check parent after a frame
        setTimeout(() => {
            console.log('RiggedCharacter Parent:', clonedScene.parent ? 'Has Parent' : 'No Parent');
        }, 100);

    }, [clonedScene]);

    return (
        <group ref={group} {...props} dispose={null}>
            {/* 
                Using SkeletonUtils fixed the detachment! 
                Scale 0.01 converts CM (Mixamo standard) to Meters (Three.js).
            */}
            <group scale={0.01} rotation={[0, Math.PI, 0]}>
                <primitive object={clonedScene} />
            </group>
        </group>
    );
}
