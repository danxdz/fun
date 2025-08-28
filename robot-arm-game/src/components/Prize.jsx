import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const Prize = ({ position, type, collected, points }) => {
  const meshRef = useRef();
  const glowRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && !collected) {
      // Floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.y += 0.01;
      
      // Pulsing glow
      if (glowRef.current) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        glowRef.current.scale.set(scale, scale, scale);
      }
    }
    
    // Disappear animation when collected
    if (meshRef.current && collected) {
      meshRef.current.scale.x *= 0.95;
      meshRef.current.scale.y *= 0.95;
      meshRef.current.scale.z *= 0.95;
      meshRef.current.position.y += 0.1;
      meshRef.current.rotation.y += 0.2;
    }
  });
  
  if (collected && meshRef.current?.scale.x < 0.01) {
    return null;
  }
  
  const colors = {
    '🎁': '#ff6b6b',
    '🧸': '#8b4513',
    '🎮': '#4169e1',
    '🏀': '#ff8c00',
    '⚽': '#000000',
    '🎨': '#ff1493',
    '🎯': '#ff0000',
    '🎪': '#ffd700',
    '🎭': '#9370db',
    '🎸': '#8b0000'
  };
  
  const color = colors[type] || '#ffffff';
  
  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.3}
          roughness={0.5}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Prize emoji */}
      <Text
        position={[0, 0, 0.5]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {type}
      </Text>
      
      {/* Points indicator */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.3}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
      >
        {points}
      </Text>
      
      {/* Sparkle particles */}
      {!collected && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={20}
              array={new Float32Array(
                Array.from({ length: 60 }, () => (Math.random() - 0.5) * 2)
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color={color}
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
};

export default Prize;