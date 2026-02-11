import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, getPathX } from '../utils/terrain';
import { RiggedCharacter } from './RiggedCharacter';

import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

interface PlayerProps {
    poseResult: PoseLandmarkerResult | null;
}

export const Player = ({ poseResult }: PlayerProps) => {
    const playerRef = useRef<THREE.Group>(null);
    const { camera } = useThree();
    const zoom = useRef(2.0); // Initial camera distance (closer)

    // Movement state
    const [isAutoRun, setIsAutoRun] = useState(false);
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
            if (e.key === 'm') {
                setIsAutoRun(prev => !prev);
            }
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



    useFrame((_, delta) => {
        if (!playerRef.current) return;

        const speed = 5 * delta;
        const rotationSpeed = 2 * delta;

        if (isAutoRun) {
            // --- Auto Run Logic ---
            // 1. Move forward (INTO the screen / Away from camera = Negative Z)
            const currentZ = playerRef.current.position.z;
            const nextZ = currentZ - speed; // Move towards negative Z

            // 2. Calculate X position on the path
            const nextX = getPathX(nextZ);

            // 3. Update Position
            playerRef.current.position.x = nextX;
            playerRef.current.position.z = nextZ;

            // 4. Update Rotation to face path direction
            // Look ahead slightly to determine direction
            const lookAheadZ = nextZ - 0.5; // Look further into negative Z
            const lookAheadX = getPathX(lookAheadZ);

            const targetAngle = Math.atan2(lookAheadX - nextX, lookAheadZ - nextZ);
            // Smooth rotation towards target angle
            // simple approach for now: set directly or lerp quaternion
            const targetQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            playerRef.current.quaternion.slerp(targetQuaternion, 0.1);


        } else {
            // --- Manual Control Logic ---
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
                moveVec.add(direction.multiplyScalar(-speed)); // Note: Model might be facing -Z effectively? Wait.
                // Original logic: "direction.multiplyScalar(-speed)" for UP.
                // Usually Forward is -Z in Three.js.
                // So -speed moves "forward" in local space relative to model forward.
            }
            if (keys['ArrowDown'] || keys['s']) {
                moveVec.add(direction.multiplyScalar(speed));
            }

            playerRef.current.position.add(moveVec);
        }

        // Snap to Terrain
        const terrainHeight = getTerrainHeight(playerRef.current.position.x, playerRef.current.position.z);
        playerRef.current.position.y = terrainHeight;

        // Zoom Controls (+ / -)
        if (keys['='] || keys['+'] || keys['Add']) zoom.current = Math.max(1.0, zoom.current - delta * 5); // Allow closer zoom (1.0)
        if (keys['-'] || keys['_'] || keys['Subtract']) zoom.current = Math.min(10, zoom.current + delta * 5);

        // Camera Follow (Dynamic Zoom)
        const cameraY = Math.max(1.2, zoom.current * 0.4 + 1.0); // Lower minimum height
        const cameraOffset = new THREE.Vector3(0, cameraY, zoom.current);
        cameraOffset.applyQuaternion(playerRef.current.quaternion);
        const targetPosition = playerRef.current.position.clone().add(cameraOffset);

        // Smooth camera movement
        // Increased lerp factor from 0.1 to 0.2 to reduce lag when running
        camera.position.lerp(targetPosition, 0.2);

        // Look at player (Adjusted for character height)
        const lookAtTarget = playerRef.current.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        camera.lookAt(lookAtTarget);
    });

    // Determine Animation
    const isMoving = isAutoRun || keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'];
    const animation = isMoving ? "Run" : "Idle";

    return (
        <group ref={playerRef} position={[0, 0, 0]}>
            <RiggedCharacter scale={[1, 1, 1]} animation={animation} poseResult={poseResult} />
            {/* Debug Box to find player if model is invisible */}
            <mesh visible={false}>
                <boxGeometry args={[1, 2, 1]} />
                <meshBasicMaterial wireframe color="blue" />
            </mesh>
        </group>
    );
};
