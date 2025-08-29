import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ targetPosition, clawOpen, hasBlock }, ref) => {
  const armGroup = useRef();
  const gripperLeftRef = useRef();
  const gripperRightRef = useRef();
  const endEffectorRef = useRef();
  
  // Current position (smoothed)
  const currentPosition = useRef(new THREE.Vector3(0, 6, 4));
  const currentGripperAngle = useRef(0);
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getEndEffectorPosition: () => {
      if (endEffectorRef.current) {
        const worldPos = new THREE.Vector3();
        endEffectorRef.current.getWorldPosition(worldPos);
        return [worldPos.x, worldPos.y, worldPos.z];
      }
      return [currentPosition.current.x, currentPosition.current.y, currentPosition.current.z];
    }
  }));
  
  useFrame(() => {
    if (!targetPosition || !armGroup.current) return;
    
    // Simple lerp to target position - direct X/Y/Z movement
    const lerpSpeed = 0.1;
    currentPosition.current.x = THREE.MathUtils.lerp(
      currentPosition.current.x,
      targetPosition.x,
      lerpSpeed
    );
    currentPosition.current.y = THREE.MathUtils.lerp(
      currentPosition.current.y,
      targetPosition.y,
      lerpSpeed
    );
    currentPosition.current.z = THREE.MathUtils.lerp(
      currentPosition.current.z,
      targetPosition.z,
      lerpSpeed
    );
    
    // Move the entire arm group to the target position
    armGroup.current.position.set(
      currentPosition.current.x,
      currentPosition.current.y,
      currentPosition.current.z
    );
    
    // Animate gripper
    if (gripperLeftRef.current && gripperRightRef.current) {
      const gripAngle = clawOpen ? 0.4 : -0.05;
      currentGripperAngle.current = THREE.MathUtils.lerp(
        currentGripperAngle.current,
        gripAngle,
        0.25
      );
      
      gripperLeftRef.current.rotation.y = currentGripperAngle.current;
      gripperRightRef.current.rotation.y = -currentGripperAngle.current;
    }
  });
  
  return (
    <>
      {/* Fixed base at origin */}
      <group position={[0, 0, 0]}>
        {/* Base platform */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[2, 2.5, 1, 32]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Base ring decoration */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[2.2, 2.6, 32]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Simple telescopic arm that moves in X/Y/Z */}
      <group ref={armGroup}>
        {/* Vertical pole */}
        <mesh position={[0, -currentPosition.current.y/2 + 1, 0]} castShadow>
          <boxGeometry args={[0.3, currentPosition.current.y, 0.3]} />
          <meshStandardMaterial color="#7f8c8d" metalness={0.5} roughness={0.4} />
        </mesh>
        
        {/* Horizontal arm */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.4]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
        </mesh>
        
        {/* Joint decoration */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
        </mesh>
        
        {/* End effector / Gripper assembly */}
        <group ref={endEffectorRef}>
          {/* Gripper base */}
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.5]} />
            <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
          </mesh>
          
          {/* Left gripper finger */}
          <group ref={gripperLeftRef} position={[0, -0.6, 0]}>
            <mesh position={[0.15, -0.15, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.08]} />
              <meshStandardMaterial 
                color={hasBlock ? "#f39c12" : "#e74c3c"}
                metalness={0.7}
                roughness={0.3}
                emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                emissiveIntensity={hasBlock ? 0.3 : 0.1}
              />
            </mesh>
            <mesh position={[0.15, -0.3, 0]} castShadow>
              <boxGeometry args={[0.12, 0.08, 0.08]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
          
          {/* Right gripper finger */}
          <group ref={gripperRightRef} position={[0, -0.6, 0]}>
            <mesh position={[-0.15, -0.15, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.08]} />
              <meshStandardMaterial 
                color={hasBlock ? "#f39c12" : "#e74c3c"}
                metalness={0.7}
                roughness={0.3}
                emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                emissiveIntensity={hasBlock ? 0.3 : 0.1}
              />
            </mesh>
            <mesh position={[-0.15, -0.3, 0]} castShadow>
              <boxGeometry args={[0.12, 0.08, 0.08]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
          
          {/* Status LED */}
          <mesh position={[0, -0.4, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial 
              color={hasBlock ? "#00ff00" : clawOpen ? "#ffff00" : "#ff0000"}
            />
          </mesh>
        </group>
      </group>
      
      {/* Visual connection line from base to arm */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              0, 1, 0,
              currentPosition.current.x, currentPosition.current.y, currentPosition.current.z
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3498db" opacity={0.3} transparent />
      </line>
    </>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;