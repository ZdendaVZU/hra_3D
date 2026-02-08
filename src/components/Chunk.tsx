import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, getPathX, CHUNK_SIZE } from '../utils/terrain';

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
        const numTrees = 20; // Trees per chunk

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
                        {(type === 0 || type === 1) && ( // Trunk
                            <mesh position={[0, 1, 0]}>
                                <cylinderGeometry args={[0.2, 0.4, 2, 5]} />
                                <meshStandardMaterial color="#3E2723" />
                            </mesh>
                        )}
                        {type === 0 && ( /* Pine */
                            <mesh position={[0, 2.5, 0]}>
                                <coneGeometry args={[1.5, 3, 5]} />
                                <meshStandardMaterial color="#1B5E20" />
                            </mesh>
                        )}
                        {type === 1 && ( /* Round */
                            <mesh position={[0, 2.5, 0]}>
                                <dodecahedronGeometry args={[1.2]} />
                                <meshStandardMaterial color="#4CAF50" />
                            </mesh>
                        )}
                        {type === 2 && ( /* Rock */
                            <mesh position={[0, 0.5, 0]} scale={[1.5, 0.8, 1.5]}>
                                <dodecahedronGeometry args={[0.5]} />
                                <meshStandardMaterial color="#757575" />
                            </mesh>
                        )}
                        {type === 3 && ( /* Bush */
                            <mesh position={[0, 0.5, 0]}>
                                <icosahedronGeometry args={[0.6, 0]} />
                                <meshStandardMaterial color="#66BB6A" />
                            </mesh>
                        )}
                    </group>
                )
            })}
        </group>
    );
};
