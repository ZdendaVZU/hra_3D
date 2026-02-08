import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, getPathX, CHUNK_SIZE } from '../utils/terrain';
import { TreeModel } from './TreeModel';
import { RockModel } from './RockModel';

interface ChunkProps {
    xIndex: number; // Chunk Grid X
    zIndex: number; // Chunk Grid Z
}

export const Chunk = ({ xIndex, zIndex }: ChunkProps) => {
    const worldX = xIndex * CHUNK_SIZE;
    const worldZ = zIndex * CHUNK_SIZE;
    const resolution = 32; // Vertices per chunk edge

    // 1. Generate Terrain Geometry
    const terrainGeometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, resolution, resolution);
        geo.rotateX(-Math.PI / 2); // Lay flat

        const posAttribute = geo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            // Get local coordinates (PlaneGeometry centers at 0,0)
            const lx = posAttribute.getX(i);
            const lz = posAttribute.getZ(i); // Originally Y, but we rotated X -90

            // Convert to World for noise
            const wx = lx + worldX;
            const wz = lz + worldZ;

            // Apply height
            const height = getTerrainHeight(wx, wz);
            posAttribute.setY(i, height);
        }

        geo.computeVertexNormals();
        return geo;
    }, [xIndex, zIndex, worldX, worldZ]);

    // 2. Generate Trees for this Chunk
    const treeData = useMemo(() => {
        const trees = [];
        const numTrees = 5; // Trees per chunk

        for (let i = 0; i < numTrees; i++) {
            const lx = (Math.random() - 0.5) * CHUNK_SIZE; // Local X
            const lz = (Math.random() - 0.5) * CHUNK_SIZE; // Local Z

            const wx = worldX + lx;
            const wz = worldZ + lz;

            const pathX = getPathX(wz);
            // Check Path collision
            if (Math.abs(wx - pathX) > 4) {
                const y = getTerrainHeight(wx, wz);
                trees.push({
                    position: [lx, y, lz] as [number, number, number], // Position relative to chunk center [0,0,0] if mesh is at [worldX, 0, worldZ]??
                    // Wait, if mesh is at [worldX, 0, worldZ], then children should be local.
                    // BUT terrain vertices I calculated based on WorldX but kept them local?
                    // "lx = posAttribute.getX(i)" -> this is local.
                    // I did NOT modify X/Z of vertices, only Y.
                    // So geometry is still centered at 0,0 local.
                    // So Mesh MUST be at [worldX, 0, worldZ].
                    // And Trees must be local relative to mesh center.
                    scale: 0.5 + Math.random() * 1,
                    type: Math.floor(Math.random() * 4)
                });
            }
        }
        return trees;
    }, [xIndex, zIndex, worldX, worldZ]);

    return (
        <group position={[worldX, 0, worldZ]}>
            {/* Terrain Mesh */}
            <mesh geometry={terrainGeometry}>
                <meshStandardMaterial color="#2E8B57" wireframe={false} flatShading />
            </mesh>

            {/* Trees */}
            {treeData.map((tree, i) => {
                const { position, scale, type } = tree;
                return (
                    <group key={i} position={position} scale={[scale, scale, scale]}>
                        {(type === 0) && (
                            <TreeModel variant="large" />
                        )}
                        {(type === 1) && (
                            <TreeModel variant="medium" />
                        )}
                        {type === 2 && Math.random() < 0.3 && ( /* Rock */
                            <RockModel scale={[0.1, 0.1, 0.1]} rotation={[0, Math.random() * Math.PI, 0]} />
                        )}
                        {type === 3 && ( /* Bush */
                            <TreeModel variant="bush" />
                        )}
                    </group>
                )
            })}
        </group>
    );
};
