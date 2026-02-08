import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Chunk } from './Chunk';
import { CHUNK_SIZE } from '../utils/terrain';

export const ChunkManager = () => {
    const [activeChunks, setActiveChunks] = useState<string[]>([]);
    const { camera } = useThree();

    // Config
    const RENDER_DISTANCE = 2; // How many chunks radius to render (2 means 5x5 grid)



    // Better optimization:
    const lastChunkRef = useRef<{ x: number, z: number } | null>(null);

    useFrame((state) => {
        const camX = state.camera.position.x;
        const camZ = state.camera.position.z;

        const cx = Math.round(camX / CHUNK_SIZE); // Round vs Floor depends on if 0 is center of chunk 0 or corner
        // My Logic: worldX = index * SIZE. Plane is centered.
        // So index 0 is at 0,0. Range -25 to 25.
        // So Round() is correct for determining closest chunk center.
        const cz = Math.round(camZ / CHUNK_SIZE);

        if (!lastChunkRef.current || lastChunkRef.current.x !== cx || lastChunkRef.current.z !== cz) {
            lastChunkRef.current = { x: cx, z: cz };

            const newChunks = [];
            for (let x = cx - RENDER_DISTANCE; x <= cx + RENDER_DISTANCE; x++) {
                for (let z = cz - RENDER_DISTANCE; z <= cz + RENDER_DISTANCE; z++) {
                    newChunks.push(`${x},${z}`);
                }
            }
            setActiveChunks(newChunks);
        }
    });

    return (
        <group>
            {activeChunks.map(key => {
                const [x, z] = key.split(',').map(Number);
                return <Chunk key={key} xIndex={x} zIndex={z} />;
            })}
        </group>
    );
};
