import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Star = ({ position, onCollect, collected = false }) => {
  const meshRef = useRef();
  const glowRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Pulsing glow effect
      if (glowRef.current) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
        glowRef.current.scale.set(scale, scale, scale);
      }
    }
  });
  
  if (collected) return null;
  
  return (
    <group position={position}>
      <mesh ref={meshRef} userData={{ type: 'star', onCollect }}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 5, 1]} />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#FFD700"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Star points */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos((angle * Math.PI) / 180) * 0.2,
            0,
            Math.sin((angle * Math.PI) / 180) * 0.2
          ]}
          rotation={[0, 0, Math.PI / 4]}
        >
          <coneGeometry args={[0.05, 0.2, 4]} />
          <meshStandardMaterial 
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Star;