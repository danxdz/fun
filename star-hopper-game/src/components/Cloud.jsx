import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const Cloud = ({ position }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Main cloud body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent />
      </mesh>
      <mesh position={[0.6, 0, 0]} castShadow>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent />
      </mesh>
      <mesh position={[-0.6, 0, 0]} castShadow>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent />
      </mesh>
      <mesh position={[0.3, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent />
      </mesh>
      <mesh position={[-0.3, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent />
      </mesh>
    </group>
  );
};

export default Cloud;