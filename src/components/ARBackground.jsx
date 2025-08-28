import React from 'react';
import { Stars, Cloud } from '@react-three/drei';

const ARBackground = () => {
  return (
    <>
      {/* Starfield for depth */}
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1}
      />
      
      {/* Floating clouds for atmosphere */}
      <Cloud 
        position={[10, 5, -15]}
        speed={0.2}
        opacity={0.3}
        color="#ffffff"
      />
      <Cloud 
        position={[-10, 8, -20]}
        speed={0.3}
        opacity={0.3}
        color="#ffffff"
      />
      <Cloud 
        position={[0, -5, -25]}
        speed={0.15}
        opacity={0.2}
        color="#ffffff"
      />
      
      {/* Ambient particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={100}
            array={new Float32Array(
              Array.from({ length: 300 }, () => (Math.random() - 0.5) * 50)
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#ffffff"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
      
      {/* Grid floor for reference */}
      <gridHelper 
        args={[50, 50, 0x444444, 0x222222]} 
        position={[0, -10, 0]}
      />
    </>
  );
};

export default ARBackground;