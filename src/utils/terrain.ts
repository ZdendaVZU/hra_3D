import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

// Configuration for terrain generation
export const SCALE = 0.02; // How "zoomed in" the noise is (smaller = smoother hills)
export const HEIGHT_SCALE = 5; // Maximum height of hills
const OCTAVES = 3; // Detail level
const PERSISTENCE = 0.5; // How much each octave contributes

// Infinite Path Logic
export const getPathX = (z: number): number => {
    return Math.sin(z * 0.05) * 10 + Math.cos(z * 0.02) * 5;
};

export const getTerrainHeight = (x: number, z: number): number => {
    let amplitude = HEIGHT_SCALE;
    let frequency = SCALE;
    let height = 0;

    for (let i = 0; i < OCTAVES; i++) {
        height += noise2D(x * frequency, z * frequency) * amplitude;
        amplitude *= PERSISTENCE;
        frequency *= 2;
    }

    // Flatten the path area
    const pathX = getPathX(z);
    const distToPath = Math.abs(x - pathX);

    const pathWidth = 4;
    const blendDistance = 3;

    if (distToPath < pathWidth) {
        return 0; // Flat path
    } else if (distToPath < pathWidth + blendDistance) {
        // Blend from 0 to 'height'
        const t = (distToPath - pathWidth) / blendDistance;
        return height * t;
    }

    return height;
};

// Chunk configuration
export const CHUNK_SIZE = 50; // Size of one chunk in world units
