import React, { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Block = ({ id, position, color, size, isGrabbed, armPosition, placed, onFall }) => {
  const [ref, api] = useBox(() => ({
    mass: isGrabbed ? 0 : 1,
    position: isGrabbed ? [armPosition.x, armPosition.y - 1, armPosition.z] : position,
    args: size,
    material: {
      friction: 0.4,
      restitution: 0.1
    }
  }));
  
  const meshRef = useRef();
  
  useFrame(() => {
    if (isGrabbed && api) {
      // Follow the arm when grabbed
      api.position.set(armPosition.x, armPosition.y - 1, armPosition.z);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }
    
    // Check if block has fallen too far
    if (ref.current && ref.current.position.y < -5) {
      onFall && onFall();
      api.position.set(position[0], 0.5, position[2]);
      api.velocity.set(0, 0, 0);
    }
    
    // Glow effect when grabbed
    if (meshRef.current && isGrabbed) {
      meshRef.current.scale.setScalar(1.05);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });
  
  return (
    <mesh 
      ref={(node) => {
        ref.current = node;
        meshRef.current = node;
      }}
      castShadow 
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color={color}
        metalness={0.2}
        roughness={0.6}
        emissive={isGrabbed ? color : "#000000"}
        emissiveIntensity={isGrabbed ? 0.2 : 0}
      />
      {isGrabbed && (
        <mesh>
          <boxGeometry args={[size[0] * 1.1, size[1] * 1.1, size[2] * 1.1]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </mesh>
  );
};

export default Block;