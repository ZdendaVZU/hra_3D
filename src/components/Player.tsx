import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

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
        // direction is z-forward for default objects usually, but need to check model orientation
        // In Three.js default lookAt is -Z? 
        // Let's assume standard forward is +Z or -Z.getWorldDirection gives vector. 
        // Usually objects face +Z or -Z. Let's try.

        // Actually getWorldDirection returns a normalized vector pointing in the direction the object's positive Z axis is facing.
        // Wait, default camera looks down -Z. 

        if (keys['ArrowUp'] || keys['w']) {
            playerRef.current.position.add(direction.multiplyScalar(-speed));
        }
        if (keys['ArrowDown'] || keys['s']) {
            playerRef.current.position.add(direction.multiplyScalar(speed));
        }

        // Camera Follow
        // Third person view: camera behind and slightly above
        const cameraOffset = new THREE.Vector3(0, 3, 6);
        cameraOffset.applyQuaternion(playerRef.current.quaternion); // Rotate offset with player
        const targetPosition = playerRef.current.position.clone().add(cameraOffset);

        // Smooth camera movement using lerp
        camera.position.lerp(targetPosition, 0.1);

        // Look at player + slightly ahead/up
        const lookAtTarget = playerRef.current.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        camera.lookAt(lookAtTarget);
    });

    return (
        <group ref={playerRef} position={[0, 0, 0]}>
            {/* Visual representation of player (capsule/cylinder) */}
            <mesh position={[0, 1, 0]}>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color="hotpink" />
            </mesh>
            {/* Simple face/direction indicator */}
            <mesh position={[0, 1.5, -0.3]} scale={[0.5, 0.2, 0.2]}>
                <boxGeometry />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    );
};
