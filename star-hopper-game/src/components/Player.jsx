import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Player = ({ position, isJumping, velocity }) => {
  const meshRef = useRef();
  const bodyRef = useRef();
  const earLeftRef = useRef();
  const earRightRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Bobbing animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 10) * 0.02;
      
      // Rotation based on movement
      if (velocity && velocity[0] !== 0) {
        meshRef.current.rotation.z = -velocity[0] * 0.2;
      } else {
        meshRef.current.rotation.z *= 0.9;
      }
      
      // Ear animation
      if (earLeftRef.current && earRightRef.current) {
        earLeftRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 8) * 0.1;
        earRightRef.current.rotation.z = -Math.sin(state.clock.elapsedTime * 8) * 0.1;
      }
      
      // Squash and stretch when jumping
      if (isJumping) {
        meshRef.current.scale.x = 0.9;
        meshRef.current.scale.y = 1.2;
        meshRef.current.scale.z = 0.9;
      } else {
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1);
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, 0.1);
        meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1, 0.1);
      }
    }
  });
  
  return (
    <group ref={meshRef} position={position}>
      {/* Body */}
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.3} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.3} />
      </mesh>
      
      {/* Ears */}
      <mesh ref={earLeftRef} position={[-0.15, 0.7, 0]} castShadow>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.3} />
      </mesh>
      <mesh ref={earRightRef} position={[0.15, 0.7, 0]} castShadow>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.3} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.1, 0.5, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.1, 0.5, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Nose */}
      <mesh position={[0, 0.45, 0.3]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color="#FF69B4" />
      </mesh>
      
      {/* Tail */}
      <mesh position={[0, 0.2, -0.4]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
    </group>
  );
};

export default Player;