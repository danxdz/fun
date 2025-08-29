import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ targetPosition, clawOpen, hasBlock }, ref) => {
  const armGroup = useRef();
  const verticalPoleRef = useRef();
  const horizontalArmRef = useRef();
  const gripperGroupRef = useRef();
  const gripperLeftRef = useRef();
  const gripperRightRef = useRef();
  const endEffectorRef = useRef();
  
  // Current position (smoothed)
  const currentPosition = useRef({ x: 0, y: 6, z: 4 });
  
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
    if (!targetPosition) return;
    
    // Smooth lerp to target position
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
    
    // Update vertical pole height
    if (verticalPoleRef.current) {
      const poleHeight = Math.max(0.5, currentPosition.current.y);
      verticalPoleRef.current.scale.y = poleHeight / 4; // Adjust scale based on original height
      verticalPoleRef.current.position.y = poleHeight / 2;
    }
    
    // Update horizontal arm position and extension
    if (horizontalArmRef.current) {
      horizontalArmRef.current.position.y = currentPosition.current.y;
      
      // Calculate horizontal distance
      const horizontalDist = Math.sqrt(
        currentPosition.current.x * currentPosition.current.x + 
        currentPosition.current.z * currentPosition.current.z
      );
      
      // Scale and position the horizontal arm
      horizontalArmRef.current.scale.x = Math.max(0.5, horizontalDist / 2);
      
      // Rotate to face the target
      const angle = Math.atan2(currentPosition.current.x, currentPosition.current.z);
      horizontalArmRef.current.rotation.y = angle;
    }
    
    // Update gripper position
    if (gripperGroupRef.current) {
      gripperGroupRef.current.position.set(
        currentPosition.current.x,
        currentPosition.current.y,
        currentPosition.current.z
      );
    }
    
    // Animate gripper fingers
    if (gripperLeftRef.current && gripperRightRef.current) {
      const gripAngle = clawOpen ? 0.4 : -0.05;
      
      gripperLeftRef.current.rotation.y = THREE.MathUtils.lerp(
        gripperLeftRef.current.rotation.y,
        gripAngle,
        0.25
      );
      gripperRightRef.current.rotation.y = THREE.MathUtils.lerp(
        gripperRightRef.current.rotation.y,
        -gripAngle,
        0.25
      );
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
        
        {/* Center joint */}
        <mesh position={[0, 1, 0]} castShadow>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
      
      {/* Vertical telescopic pole */}
      <mesh ref={verticalPoleRef} position={[0, 2, 0]} castShadow>
        <boxGeometry args={[0.4, 4, 0.4]} />
        <meshStandardMaterial color="#7f8c8d" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Horizontal extending arm */}
      <group ref={horizontalArmRef} position={[0, 6, 0]}>
        <mesh position={[0, 0, 1]} castShadow>
          <boxGeometry args={[0.3, 0.3, 2]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
        </mesh>
        
        {/* Joint at the end of horizontal arm */}
        <mesh position={[0, 0, 2]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
      
      {/* Gripper assembly - moves to target position */}
      <group ref={gripperGroupRef}>
        <group ref={endEffectorRef}>
          {/* Gripper base */}
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.6, 0.3, 0.6]} />
            <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
          </mesh>
          
          {/* Left gripper finger */}
          <group ref={gripperLeftRef} position={[0, -0.5, 0]}>
            <mesh position={[0.2, -0.15, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.1]} />
              <meshStandardMaterial 
                color={hasBlock ? "#f39c12" : "#e74c3c"}
                metalness={0.7}
                roughness={0.3}
                emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                emissiveIntensity={hasBlock ? 0.3 : 0.1}
              />
            </mesh>
            <mesh position={[0.2, -0.3, 0]} castShadow>
              <boxGeometry args={[0.12, 0.1, 0.1]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
          
          {/* Right gripper finger */}
          <group ref={gripperRightRef} position={[0, -0.5, 0]}>
            <mesh position={[-0.2, -0.15, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.1]} />
              <meshStandardMaterial 
                color={hasBlock ? "#f39c12" : "#e74c3c"}
                metalness={0.7}
                roughness={0.3}
                emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                emissiveIntensity={hasBlock ? 0.3 : 0.1}
              />
            </mesh>
            <mesh position={[-0.2, -0.3, 0]} castShadow>
              <boxGeometry args={[0.12, 0.1, 0.1]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
          
          {/* Status LED */}
          <mesh position={[0, -0.3, 0.35]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial 
              color={hasBlock ? "#00ff00" : clawOpen ? "#ffff00" : "#ff0000"}
            />
          </mesh>
        </group>
      </group>
    </>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;