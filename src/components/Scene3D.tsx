import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { World } from './World';

import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

interface Scene3DProps {
  poseResult: PoseLandmarkerResult | null;
}

export const Scene3D = ({ poseResult }: Scene3DProps) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        <Stats />
        <World poseResult={poseResult} />
      </Canvas>
    </div>
  );
};
