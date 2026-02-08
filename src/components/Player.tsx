import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../utils/terrain';
import { CharacterModel } from './CharacterModel';

export const Player = () => {
    const playerRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    // Movement state
    const [keys, setKeys] = useState<{ [key: string]: boolean }>({
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        w: false,
        s: false,
        a: false,
        d: false
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setKeys((keys) => ({ ...keys, [e.key]: true }));
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            setKeys((keys) => ({ ...keys, [e.key]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);



    useFrame((state, delta) => {
        if (!playerRef.current) return;

        const speed = 5 * delta;
        const rotationSpeed = 2 * delta;

        // Rotation
        if (keys['ArrowLeft'] || keys['a']) {
            playerRef.current.rotation.y += rotationSpeed;
        }
        if (keys['ArrowRight'] || keys['d']) {
            playerRef.current.rotation.y -= rotationSpeed;
        }

        // Forward/Backward
        const direction = new THREE.Vector3();
        playerRef.current.getWorldDirection(direction);

        // Calculate potential new position
        const moveVec = new THREE.Vector3();
        if (keys['ArrowUp'] || keys['w']) {
            moveVec.add(direction.multiplyScalar(-speed));
        }
        if (keys['ArrowDown'] || keys['s']) {
            moveVec.add(direction.multiplyScalar(speed));
        }

        playerRef.current.position.add(moveVec);

        // Snap to Terrain
        const terrainHeight = getTerrainHeight(playerRef.current.position.x, playerRef.current.position.z);
        playerRef.current.position.y = terrainHeight;

        // Camera Follow (Closer)
        const cameraOffset = new THREE.Vector3(0, 3, 5);
        cameraOffset.applyQuaternion(playerRef.current.quaternion);
        const targetPosition = playerRef.current.position.clone().add(cameraOffset);

        // Smooth camera movement
        camera.position.lerp(targetPosition, 0.1);

        // Look at player (Adjusted for character height)
        const lookAtTarget = playerRef.current.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        camera.lookAt(lookAtTarget);
    });

    return (
        <group ref={playerRef} position={[0, 0, 0]}>
            <CharacterModel scale={[0.3, 0.3, 0.3]} />
            {/* Debug Box to find player if model is invisible */}
            <mesh visible={false}>
                <boxGeometry args={[1, 2, 1]} />
                <meshBasicMaterial wireframe color="blue" />
            </mesh>
        </group>
    );
};
