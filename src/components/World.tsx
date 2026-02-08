import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Forest } from './Forest';
import { Player } from './Player';

// Component for the winding path
const Path = () => {
    const curve = useMemo(() => {
        // Determine path points (straight but winding)
        const points = [];
        for (let i = 0; i <= 20; i++) {
            const x = Math.sin(i * 0.5) * 5;
            const z = -i * 5;
            points.push(new THREE.Vector3(x, 0.1, z));
        }
        return new THREE.CatmullRomCurve3(points);
    }, []);

    const linePoints = useMemo(() => curve.getPoints(100), [curve]);

    return (
        <group>
            {/* Visual representation of the path */}
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={linePoints.length}
                        array={new Float32Array(linePoints.flatMap(p => [p.x, p.y, p.z]))}
                        itemSize={3}
                        args={[new Float32Array(linePoints.flatMap(p => [p.x, p.y, p.z])), 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#8B4513" linewidth={3} />
            </line>

            {/* Or better, a tube geometry for a physical path */}
            <mesh>
                <tubeGeometry args={[curve, 64, 2, 8, false]} />
                <meshStandardMaterial color="#5C4033" roughness={0.9} />
            </mesh>
        </group>
    );
};

const Ground = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]}>
            <planeGeometry args={[200, 200, 64, 64]} />
            <meshStandardMaterial color="#2E8B57" roughness={0.8} />
        </mesh>
    );
};

export const World = () => {
    return (
        <>
            <ambientLight intensity={0.3} />
            <directionalLight
                position={[10, 20, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
            <fog attach="fog" args={['#c0d8ff', 5, 60]} />

            <Ground />
            <Path />
            <Forest />
            <Player />
        </>
    );
};
