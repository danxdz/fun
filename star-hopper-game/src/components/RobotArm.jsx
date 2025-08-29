import React, { useRef, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ position, clawOpen, hasBlock }, ref) => {
  const baseRef = useRef();
  const armRef = useRef();
  const clawLeftRef = useRef();
  const clawRightRef = useRef();
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      // Smooth movement to position
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position.x, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position.y, 0.1);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position.z, 0.1);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, position.rotation, 0.1);
    }
    
    // Animate claw
    if (clawLeftRef.current && clawRightRef.current) {
      const targetAngle = clawOpen ? 0.3 : -0.1;
      clawLeftRef.current.rotation.z = THREE.MathUtils.lerp(clawLeftRef.current.rotation.z, targetAngle, 0.2);
      clawRightRef.current.rotation.z = THREE.MathUtils.lerp(clawRightRef.current.rotation.z, -targetAngle, 0.2);
    }
    
    // Subtle idle animation
    if (armRef.current) {
      armRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Base */}
      <mesh ref={baseRef} position={[0, -position.y + 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1, 1, 32]} />
        <meshStandardMaterial color="#4e676b" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Vertical pole */}
      <mesh position={[0, -position.y/2 + 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, position.y, 0.3]} />
        <meshStandardMaterial color="#9eb5b8" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Arm */}
      <group ref={armRef}>
        {/* Horizontal arm */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#9eb5b8" metalness={0.4} roughness={0.5} />
        </mesh>
        
        {/* Claw base */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 0.3, 16]} />
          <meshStandardMaterial color="#4e676b" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Left claw */}
        <group ref={clawLeftRef} position={[-0.15, -0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.4, 0.2]} />
            <meshStandardMaterial 
              color={hasBlock ? "#FFD700" : "#FF6B6B"} 
              metalness={0.7} 
              roughness={0.3}
              emissive={hasBlock ? "#FFD700" : "#FF6B6B"}
              emissiveIntensity={hasBlock ? 0.2 : 0.1}
            />
          </mesh>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.06, 0.1, 0.15]} />
            <meshStandardMaterial color="#4e676b" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
        
        {/* Right claw */}
        <group ref={clawRightRef} position={[0.15, -0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.4, 0.2]} />
            <meshStandardMaterial 
              color={hasBlock ? "#FFD700" : "#FF6B6B"} 
              metalness={0.7} 
              roughness={0.3}
              emissive={hasBlock ? "#FFD700" : "#FF6B6B"}
              emissiveIntensity={hasBlock ? 0.2 : 0.1}
            />
          </mesh>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.06, 0.1, 0.15]} />
            <meshStandardMaterial color="#4e676b" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
        
        {/* Status light */}
        <mesh position={[0, -0.1, 0.2]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial 
            color={hasBlock ? "#00FF00" : clawOpen ? "#FFFF00" : "#FF0000"} 
          />
        </mesh>
      </group>
    </group>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;