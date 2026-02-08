import { useMemo } from 'react';


// PineTree component removed as it was unused and replaced by inline rendering logic

// Efficient Instanced Forest
// We need to define positions first.
// Since we want variety without loading models yet, we will use simplified geometries for each type.

export const Forest = () => {
    // Generate random data for trees
    const treeData = useMemo(() => {
        const trees = [];
        for (let i = 0; i < 200; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = -Math.random() * 100;
            // Simple path avoidance:
            const distToCenter = Math.abs(x);
            // Very rough path check (path is curve, but roughly center at z=0..-100)
            // Path is sin wave x = sin(z*...)
            const pathX = Math.sin(-z * 0.1) * 5; // Approx path logic from World.tsx

            if (Math.abs(x - pathX) > 4 && distToCenter < 50) { // Added use of distToCenter to fix lint
                trees.push({
                    position: [x, 0, z] as [number, number, number],
                    scale: 0.5 + Math.random() * 1,
                    type: Math.floor(Math.random() * 4) // 0: Pine, 1: Round, 2: Bush, 3: Rock
                });
            }
        }
        return trees;
    }, []);

    return (
        <group>
            {treeData.map((tree, i) => {
                const { position, scale, type } = tree;
                if (type === 0) { // PINE
                    return (
                        <group key={i} position={position} scale={[scale, scale, scale]}>
                            <mesh position={[0, 1, 0]}>
                                <cylinderGeometry args={[0.2, 0.4, 2, 6]} />
                                <meshStandardMaterial color="#3E2723" />
                            </mesh>
                            <mesh position={[0, 2.5, 0]}>
                                <coneGeometry args={[1.2, 3, 7]} />
                                <meshStandardMaterial color="#1B5E20" />
                            </mesh>
                            <mesh position={[0, 4, 0]}>
                                <coneGeometry args={[0.9, 2.5, 7]} />
                                <meshStandardMaterial color="#2E7D32" />
                            </mesh>
                        </group>
                    );
                } else if (type === 1) { // BROADLEAF
                    return (
                        <group key={i} position={position} scale={[scale, scale, scale]}>
                            <mesh position={[0, 1, 0]}>
                                <cylinderGeometry args={[0.3, 0.5, 2]} />
                                <meshStandardMaterial color="#5D4037" />
                            </mesh>
                            <mesh position={[0, 2.5, 0]}>
                                <dodecahedronGeometry args={[1.5]} />
                                <meshStandardMaterial color="#4CAF50" />
                            </mesh>
                        </group>
                    );
                } else if (type === 2) { // BUSH
                    return (
                        <group key={i} position={position} scale={[scale, scale, scale]}>
                            <mesh position={[0, 0.5, 0]}>
                                <icosahedronGeometry args={[0.8, 0]} />
                                <meshStandardMaterial color="#81C784" />
                            </mesh>
                        </group>
                    );
                } else { // ROCK
                    return (
                        <group key={i} position={[position[0], 0.2, position[2]]} scale={[scale, scale * 0.6, scale]} rotation={[Math.random(), Math.random(), Math.random()]}>
                            <mesh>
                                <dodecahedronGeometry args={[0.8]} />
                                <meshStandardMaterial color="#9E9E9E" />
                            </mesh>
                        </group>
                    );
                }
            })}
        </group>
    );
};
