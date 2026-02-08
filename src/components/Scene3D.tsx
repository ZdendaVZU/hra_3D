import { Canvas } from '@react-three/fiber';
import { World } from './World';

export const Scene3D = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        <World />
      </Canvas>
    </div>
  );
};
