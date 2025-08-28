import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const FlyingObject = ({ id, position, type, color, points, speed, caught, onCatch, onMiss, cameraRotation }) => {
  const meshRef = useRef();
  const glowRef = useRef();
  const [currentPos, setCurrentPos] = useState(position);
  const [opacity, setOpacity] = useState(1);
  const timeAlive = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    timeAlive.current += delta;
    
    if (caught) {
      // Caught animation - shrink and fade
      meshRef.current.scale.x *= 0.9;
      meshRef.current.scale.y *= 0.9;
      meshRef.current.scale.z *= 0.9;
      setOpacity(prev => prev * 0.9);
      
      if (meshRef.current.scale.x < 0.01) {
        return;
      }
    } else {
      // Move towards the player
      const direction = new THREE.Vector3(
        -currentPos[0],
        -currentPos[1],
        -currentPos[2]
      ).normalize();
      
      const newPos = [
        currentPos[0] + direction.x * speed * delta,
        currentPos[1] + direction.y * speed * delta,
        currentPos[2] + direction.z * speed * delta
      ];
      
      setCurrentPos(newPos);
      meshRef.current.position.set(...newPos);
      
      // Rotation animation
      meshRef.current.rotation.x += delta * 2;
      meshRef.current.rotation.y += delta * 3;
      
      // Pulsing glow
      if (glowRef.current) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
        glowRef.current.scale.set(scale, scale, scale);
      }
      
      // Check if object is in catching zone
      const distance = Math.sqrt(
        newPos[0] ** 2 + 
        newPos[1] ** 2 + 
        newPos[2] ** 2
      );
      
      if (distance < 3) {
        // Check if object is in the center of view
        const objectVector = new THREE.Vector3(...newPos);
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        
        // Apply camera rotation to direction
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(
          (cameraRotation.x * Math.PI) / 180,
          (cameraRotation.y * Math.PI) / 180,
          (cameraRotation.z * Math.PI) / 180
        ));
        cameraDirection.applyQuaternion(quaternion);
        
        // Calculate angle between camera direction and object
        const angle = cameraDirection.angleTo(objectVector.normalize());
        
        // If object is within catching angle (about 20 degrees)
        if (angle < 0.35) {
          onCatch();
        } else if (distance < 1) {
          // Missed - too close
          onMiss();
        }
      }
      
      // Remove if too close or too long alive
      if (distance < 0.5 || timeAlive.current > 10) {
        onMiss();
      }
    }
  });
  
  if (opacity < 0.01) return null;
  
  return (
    <group position={currentPos}>
      {/* Main object */}
      <mesh ref={meshRef} castShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.4}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={opacity}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.3 * opacity}
        />
      </mesh>
      
      {/* Emoji */}
      <Text
        position={[0, 0, 0.6]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {type}
      </Text>
      
      {/* Points */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.2}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
      >
        +{points}
      </Text>
      
      {/* Trail particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={10}
            array={new Float32Array(
              Array.from({ length: 30 }, () => (Math.random() - 0.5) * 1)
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color={color}
          transparent
          opacity={0.6 * opacity}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

export default FlyingObject;