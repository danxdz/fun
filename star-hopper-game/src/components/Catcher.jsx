import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Catcher = ({ glowing, combo }) => {
  const ringRef = useRef();
  const glowRef = useRef();
  
  useFrame((state) => {
    if (ringRef.current) {
      // Subtle rotation
      ringRef.current.rotation.z += 0.005;
      
      // Glow effect when catching
      if (glowing && glowRef.current) {
        glowRef.current.scale.set(1.5, 1.5, 1.5);
        glowRef.current.material.opacity = 0.8;
      } else if (glowRef.current) {
        glowRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        glowRef.current.material.opacity = THREE.MathUtils.lerp(
          glowRef.current.material.opacity,
          0.3,
          0.1
        );
      }
    }
  });
  
  const comboColor = combo > 4 ? '#FFD700' : combo > 2 ? '#FF69B4' : '#00CED1';
  
  return (
    <group position={[0, 0, -3]}>
      {/* Catching ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.5, 0.05, 16, 100]} />
        <meshStandardMaterial 
          color={comboColor}
          emissive={comboColor}
          emissiveIntensity={glowing ? 0.8 : 0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Inner ring */}
      <mesh>
        <torusGeometry args={[0.3, 0.03, 16, 100]} />
        <meshStandardMaterial 
          color={comboColor}
          emissive={comboColor}
          emissiveIntensity={glowing ? 0.6 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <ringGeometry args={[0.2, 0.6, 32]} />
        <meshBasicMaterial 
          color={comboColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Crosshair lines */}
      <group>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
          <meshBasicMaterial color={comboColor} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
          <meshBasicMaterial color={comboColor} />
        </mesh>
        <mesh position={[0.35, 0, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
          <meshBasicMaterial color={comboColor} />
        </mesh>
        <mesh position={[-0.35, 0, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
          <meshBasicMaterial color={comboColor} />
        </mesh>
      </group>
    </group>
  );
};

export default Catcher;