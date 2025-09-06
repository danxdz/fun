import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ targetPosition, clawOpen, hasBlock }, ref) => {
  const baseRef = useRef();
  const segment1Ref = useRef();
  const segment2Ref = useRef();
  const segment3Ref = useRef();
  const gripperGroupRef = useRef();
  const gripperLeftRef = useRef();
  const gripperRightRef = useRef();
  const endEffectorRef = useRef();
  
  // Arm segment lengths
  const L1 = 3; // First segment
  const L2 = 2.5; // Second segment  
  const L3 = 2; // Third segment
  const BASE_HEIGHT = 1.5;
  
  // Current angles (smoothed)
  const currentAngles = useRef({
    baseRotation: 0,      // Base rotation (around Y axis)
    segment1Angle: 0,     // First segment angle
    segment2Angle: 0,     // Second segment angle
    segment3Angle: 0      // Third segment angle
  });
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getEndEffectorPosition: () => {
      if (endEffectorRef.current) {
        const worldPos = new THREE.Vector3();
        endEffectorRef.current.getWorldPosition(worldPos);
        return [worldPos.x, worldPos.y, worldPos.z];
      }
      return [0, BASE_HEIGHT + L1 + L2 + L3, 0];
    }
  }));
  
  useFrame(() => {
    if (!targetPosition) return;
    
    // Calculate inverse kinematics for 3-segment arm
    // Base rotation to face target
    const targetBaseAngle = targetPosition.baseRotation || Math.atan2(targetPosition.x, targetPosition.z);
    
    // Distance in horizontal plane
    const horizontalDist = Math.sqrt(
      targetPosition.x * targetPosition.x + 
      targetPosition.z * targetPosition.z
    );
    
    // Height to reach
    const targetHeight = targetPosition.y - BASE_HEIGHT;
    
    // Total distance to reach
    const totalReach = Math.sqrt(horizontalDist * horizontalDist + targetHeight * targetHeight);
    
    // Clamp reach to possible range
    const maxReach = L1 + L2 + L3;
    const clampedReach = Math.min(totalReach, maxReach * 0.95);
    
    // Simple IK solution for 3 segments
    let angle1, angle2, angle3;
    
    if (clampedReach < maxReach * 0.9) {
      // Calculate angles for reaching the target
      const alpha = Math.atan2(targetHeight, horizontalDist);
      
      // Distribute the reach across three segments
      const reachRatio = clampedReach / maxReach;
      
      // First segment - main lifting
      angle1 = alpha + (Math.PI / 4) * (1 - reachRatio);
      
      // Second segment - mid adjustment
      angle2 = -Math.PI / 3 * reachRatio;
      
      // Third segment - fine positioning
      angle3 = -Math.PI / 4 * reachRatio;
      
      // Adjust for height
      if (targetHeight > 0) {
        angle1 += Math.PI / 6 * (targetHeight / (L1 + L2 + L3));
      }
    } else {
      // Full extension
      angle1 = Math.atan2(targetHeight, horizontalDist);
      angle2 = 0;
      angle3 = 0;
    }
    
    // Smooth interpolation
    const lerpSpeed = 0.1;
    currentAngles.current.baseRotation = THREE.MathUtils.lerp(
      currentAngles.current.baseRotation,
      targetBaseAngle,
      lerpSpeed
    );
    currentAngles.current.segment1Angle = THREE.MathUtils.lerp(
      currentAngles.current.segment1Angle,
      angle1,
      lerpSpeed
    );
    currentAngles.current.segment2Angle = THREE.MathUtils.lerp(
      currentAngles.current.segment2Angle,
      angle2,
      lerpSpeed
    );
    currentAngles.current.segment3Angle = THREE.MathUtils.lerp(
      currentAngles.current.segment3Angle,
      angle3,
      lerpSpeed
    );
    
    // Apply rotations
    if (baseRef.current) {
      baseRef.current.rotation.y = currentAngles.current.baseRotation;
    }
    
    if (segment1Ref.current) {
      segment1Ref.current.rotation.z = currentAngles.current.segment1Angle;
    }
    
    if (segment2Ref.current) {
      segment2Ref.current.rotation.z = currentAngles.current.segment2Angle;
    }
    
    if (segment3Ref.current) {
      segment3Ref.current.rotation.z = currentAngles.current.segment3Angle;
    }
    
    // Animate gripper
    if (gripperLeftRef.current && gripperRightRef.current) {
      const gripAngle = clawOpen ? 0.3 : -0.05;
      
      gripperLeftRef.current.rotation.y = THREE.MathUtils.lerp(
        gripperLeftRef.current.rotation.y,
        gripAngle,
        0.2
      );
      gripperRightRef.current.rotation.y = THREE.MathUtils.lerp(
        gripperRightRef.current.rotation.y,
        -gripAngle,
        0.2
      );
    }
  });
  
  return (
    <group position={[0, 0, 0]}>
      {/* Fixed base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2, 1, 32]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Rotating base */}
      <group ref={baseRef}>
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.8, 1, 0.5, 32]} />
          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Base joint */}
        <mesh position={[0, BASE_HEIGHT, 0]} castShadow>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
        </mesh>
        
        {/* First segment */}
        <group position={[0, BASE_HEIGHT, 0]} ref={segment1Ref}>
          <mesh position={[L1/2, 0, 0]} castShadow>
            <boxGeometry args={[L1, 0.4, 0.4]} />
            <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
          </mesh>
          
          {/* Joint 1 */}
          <mesh position={[L1, 0, 0]} castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* Second segment */}
          <group position={[L1, 0, 0]} ref={segment2Ref}>
            <mesh position={[L2/2, 0, 0]} castShadow>
              <boxGeometry args={[L2, 0.35, 0.35]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
            </mesh>
            
            {/* Joint 2 */}
            <mesh position={[L2, 0, 0]} castShadow>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
            </mesh>
            
            {/* Third segment */}
            <group position={[L2, 0, 0]} ref={segment3Ref}>
              <mesh position={[L3/2, 0, 0]} castShadow>
                <boxGeometry args={[L3, 0.3, 0.3]} />
                <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
              </mesh>
              
              {/* End effector */}
              <group position={[L3, 0, 0]} ref={endEffectorRef}>
                {/* Gripper base */}
                <mesh position={[0.2, 0, 0]} castShadow>
                  <boxGeometry args={[0.4, 0.35, 0.35]} />
                  <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
                </mesh>
                
                {/* Left gripper */}
                <group ref={gripperLeftRef} position={[0.4, 0, 0]}>
                  <mesh position={[0.15, 0, 0.12]} castShadow>
                    <boxGeometry args={[0.3, 0.05, 0.15]} />
                    <meshStandardMaterial 
                      color={hasBlock ? "#f39c12" : "#e74c3c"}
                      metalness={0.7}
                      roughness={0.3}
                      emissive={hasBlock ? "#f39c12" : "#000000"}
                      emissiveIntensity={hasBlock ? 0.2 : 0}
                    />
                  </mesh>
                </group>
                
                {/* Right gripper */}
                <group ref={gripperRightRef} position={[0.4, 0, 0]}>
                  <mesh position={[0.15, 0, -0.12]} castShadow>
                    <boxGeometry args={[0.3, 0.05, 0.15]} />
                    <meshStandardMaterial 
                      color={hasBlock ? "#f39c12" : "#e74c3c"}
                      metalness={0.7}
                      roughness={0.3}
                      emissive={hasBlock ? "#f39c12" : "#000000"}
                      emissiveIntensity={hasBlock ? 0.2 : 0}
                    />
                  </mesh>
                </group>
                
                {/* Status LED */}
                <mesh position={[0.2, 0.2, 0]}>
                  <sphereGeometry args={[0.06, 8, 8]} />
                  <meshBasicMaterial 
                    color={hasBlock ? "#00ff00" : clawOpen ? "#ffff00" : "#ff0000"}
                  />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
      
      {/* Base decoration */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.6, 2, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;