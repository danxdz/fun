import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ targetPosition, clawOpen, hasBlock }, ref) => {
  const baseRef = useRef();
  const link1Ref = useRef();
  const link2Ref = useRef();
  const link3Ref = useRef();
  const gripperLeftRef = useRef();
  const gripperRightRef = useRef();
  const groupRef = useRef();
  
  // Arm segment lengths
  const L1 = 3; // First segment length
  const L2 = 2.5; // Second segment length
  const L3 = 1.5; // Third segment length
  
  // Current joint angles
  const currentAngles = useRef({
    base: 0,
    shoulder: 0,
    elbow: 0,
    wrist: 0
  });
  
  // Target joint angles
  const targetAngles = useRef({
    base: 0,
    shoulder: 0,
    elbow: 0,
    wrist: 0
  });
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getEndEffectorPosition: () => {
      if (link3Ref.current) {
        const worldPos = new THREE.Vector3();
        link3Ref.current.getWorldPosition(worldPos);
        return [worldPos.x, worldPos.y, worldPos.z];
      }
      return [0, 0, 0];
    }
  }));
  
  // Calculate inverse kinematics
  const calculateIK = (targetX, targetY, targetZ) => {
    // Base rotation (around Y axis)
    const baseAngle = Math.atan2(targetX, targetZ);
    
    // Distance in XZ plane
    const distXZ = Math.sqrt(targetX * targetX + targetZ * targetZ);
    
    // Adjust target height for base height
    const adjustedY = targetY - 0.5;
    
    // Total reach needed
    const reach = Math.sqrt(distXZ * distXZ + adjustedY * adjustedY);
    
    // Check if target is reachable
    const maxReach = L1 + L2 + L3;
    if (reach > maxReach) {
      // Target too far, extend fully towards it
      const shoulderAngle = Math.atan2(adjustedY, distXZ);
      return {
        base: baseAngle,
        shoulder: shoulderAngle,
        elbow: 0,
        wrist: 0
      };
    }
    
    // Use law of cosines for 2-link IK (simplified)
    const D = Math.min(reach, L1 + L2);
    
    // Shoulder angle
    const shoulderAngle = Math.atan2(adjustedY, distXZ) + 
      Math.acos((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D));
    
    // Elbow angle
    const elbowAngle = Math.PI - 
      Math.acos((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2));
    
    // Wrist angle to keep gripper level
    const wristAngle = -(shoulderAngle + elbowAngle) + Math.PI/2;
    
    return {
      base: baseAngle,
      shoulder: shoulderAngle,
      elbow: elbowAngle,
      wrist: wristAngle
    };
  };
  
  useFrame((state) => {
    // Calculate IK for target position
    if (targetPosition) {
      targetAngles.current = calculateIK(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z
      );
    }
    
    // Smooth interpolation of joint angles
    const lerpSpeed = 0.1;
    currentAngles.current.base = THREE.MathUtils.lerp(
      currentAngles.current.base,
      targetAngles.current.base,
      lerpSpeed
    );
    currentAngles.current.shoulder = THREE.MathUtils.lerp(
      currentAngles.current.shoulder,
      targetAngles.current.shoulder,
      lerpSpeed
    );
    currentAngles.current.elbow = THREE.MathUtils.lerp(
      currentAngles.current.elbow,
      targetAngles.current.elbow,
      lerpSpeed
    );
    currentAngles.current.wrist = THREE.MathUtils.lerp(
      currentAngles.current.wrist,
      targetAngles.current.wrist,
      lerpSpeed
    );
    
    // Apply rotations
    if (baseRef.current) {
      baseRef.current.rotation.y = currentAngles.current.base;
    }
    
    if (link1Ref.current) {
      link1Ref.current.rotation.z = currentAngles.current.shoulder - Math.PI/2;
    }
    
    if (link2Ref.current) {
      link2Ref.current.rotation.z = currentAngles.current.elbow;
    }
    
    if (link3Ref.current) {
      link3Ref.current.rotation.z = currentAngles.current.wrist;
    }
    
    // Animate gripper
    if (gripperLeftRef.current && gripperRightRef.current) {
      const gripAngle = clawOpen ? 0.3 : 0;
      gripperLeftRef.current.rotation.z = THREE.MathUtils.lerp(
        gripperLeftRef.current.rotation.z,
        gripAngle,
        0.2
      );
      gripperRightRef.current.rotation.z = THREE.MathUtils.lerp(
        gripperRightRef.current.rotation.z,
        -gripAngle,
        0.2
      );
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Fixed Base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 0.5, 32]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Rotating base platform */}
      <group ref={baseRef}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 32]} />
          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* First segment (shoulder) */}
        <group position={[0, 0.7, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
          </mesh>
          
          <group ref={link1Ref}>
            <mesh position={[L1/2, 0, 0]} castShadow>
              <boxGeometry args={[L1, 0.4, 0.4]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
            </mesh>
            
            {/* Second joint (elbow) */}
            <group position={[L1, 0, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
              </mesh>
              
              <group ref={link2Ref}>
                <mesh position={[L2/2, 0, 0]} castShadow>
                  <boxGeometry args={[L2, 0.35, 0.35]} />
                  <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                </mesh>
                
                {/* Third joint (wrist) */}
                <group position={[L2, 0, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
                  </mesh>
                  
                  <group ref={link3Ref}>
                    <mesh position={[L3/2, 0, 0]} castShadow>
                      <boxGeometry args={[L3, 0.3, 0.3]} />
                      <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                    </mesh>
                    
                    {/* End effector / Gripper */}
                    <group position={[L3, 0, 0]}>
                      {/* Gripper base */}
                      <mesh castShadow>
                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                        <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
                      </mesh>
                      
                      {/* Left gripper finger */}
                      <group ref={gripperLeftRef} position={[0.2, 0, 0.1]}>
                        <mesh castShadow>
                          <boxGeometry args={[0.4, 0.05, 0.15]} />
                          <meshStandardMaterial 
                            color={hasBlock ? "#f39c12" : "#e74c3c"}
                            metalness={0.7}
                            roughness={0.3}
                            emissive={hasBlock ? "#f39c12" : "#000000"}
                            emissiveIntensity={hasBlock ? 0.2 : 0}
                          />
                        </mesh>
                        <mesh position={[0.2, 0, 0]} castShadow>
                          <boxGeometry args={[0.05, 0.05, 0.1]} />
                          <meshStandardMaterial color="#2c3e50" />
                        </mesh>
                      </group>
                      
                      {/* Right gripper finger */}
                      <group ref={gripperRightRef} position={[0.2, 0, -0.1]}>
                        <mesh castShadow>
                          <boxGeometry args={[0.4, 0.05, 0.15]} />
                          <meshStandardMaterial 
                            color={hasBlock ? "#f39c12" : "#e74c3c"}
                            metalness={0.7}
                            roughness={0.3}
                            emissive={hasBlock ? "#f39c12" : "#000000"}
                            emissiveIntensity={hasBlock ? 0.2 : 0}
                          />
                        </mesh>
                        <mesh position={[0.2, 0, 0]} castShadow>
                          <boxGeometry args={[0.05, 0.05, 0.1]} />
                          <meshStandardMaterial color="#2c3e50" />
                        </mesh>
                      </group>
                      
                      {/* Status LED */}
                      <mesh position={[0, 0.2, 0]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshBasicMaterial 
                          color={hasBlock ? "#00ff00" : clawOpen ? "#ffff00" : "#ff0000"}
                        />
                      </mesh>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
      
      {/* Base decorations */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;