import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PuzzleBlock = ({ position, color, puzzleId, requiredOrder, onActivate }) => {
  const meshRef = useRef();
  const [activated, setActivated] = useState(false);
  const [glowing, setGlowing] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (glowing) {
        // Pulsing effect when activated
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
        meshRef.current.scale.set(scale, scale, scale);
        meshRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.3;
      } else if (activated) {
        meshRef.current.material.emissiveIntensity = 0.3;
      } else {
        meshRef.current.material.emissiveIntensity = 0.1;
      }
    }
  });
  
  const handleActivation = () => {
    if (!activated) {
      setActivated(true);
      setGlowing(true);
      setTimeout(() => setGlowing(false), 1000);
      onActivate && onActivate(puzzleId, requiredOrder);
    }
  };
  
  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        userData={{ 
          type: 'puzzleBlock', 
          onContact: handleActivation,
          puzzleId,
          requiredOrder
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 0.5, 1]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      
      {/* Number indicator */}
      {requiredOrder && (
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.2}
          />
        </mesh>
      )}
    </group>
  );
};

export default PuzzleBlock;