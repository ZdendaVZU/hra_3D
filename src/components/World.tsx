import { Sky } from '@react-three/drei';
import { ChunkManager } from './ChunkManager';
import { Player } from './Player';

import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

interface WorldProps {
    poseResult: PoseLandmarkerResult | null;
}

export const World = ({ poseResult }: WorldProps) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 20, 5]}
                intensity={1.0}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
            <fog attach="fog" args={['#c0d8ff', 10, 90]} />

            <ChunkManager />
            <Player poseResult={poseResult} />
        </>
    );
};
