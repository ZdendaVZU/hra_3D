import * as THREE from 'three';

// Generate a random path using CatmullRomCurve3
export const generatePath = (): THREE.CatmullRomCurve3 => {
    const points: THREE.Vector3[] = [];
    const numPoints = 10;
    const spread = 20; // Width of the path variation
    const length = 100; // Total length of the path segment

    for (let i = 0; i < numPoints; i++) {
        const x = (Math.random() - 0.5) * spread;
        const z = - (i / (numPoints - 1)) * length; // Move forward along -Z
        // const y = 0; // Flat for now
        points.push(new THREE.Vector3(x, 0, z));
    }

    return new THREE.CatmullRomCurve3(points);
};

// Check if a point is too close to the path
export const isTooCloseToPath = (point: THREE.Vector3, path: THREE.CatmullRomCurve3, minDistance: number = 3): boolean => {
    const closestPoint = path.getPointAt(0); // Simplified for now since accurate distance check is complex without sampling

    // Simplified: Sample the path at multiple points and check distance
    // Better: Helper function

    // Efficient approximated check:
    const divisions = 50;
    for (let i = 0; i <= divisions; i++) {
        const pathPoint = path.getPoint(i / divisions);
        if (point.distanceTo(pathPoint) < minDistance) {
            return true;
        }
    }
    return false;
};

// Generate random position within bounds, avoiding path
export const generatePosition = (
    boundsConfig: { width: number, depth: number },
    path: THREE.CatmullRomCurve3,
    minPathDist: number = 3
): THREE.Vector3 | null => {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
        const x = (Math.random() - 0.5) * boundsConfig.width;
        const z = -Math.random() * boundsConfig.depth; // Forward is -Z for camera logic usually

        const pos = new THREE.Vector3(x, 0, z);
        if (!isTooCloseToPath(pos, path, minPathDist)) {
            return pos;
        }
    }
    return null;
};
