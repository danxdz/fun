import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ targetPosition, clawOpen, hasBlock }, ref) => {
  const baseRef = useRef();
  const shoulder = useRef();
  const elbow = useRef();
  const wrist = useRef();
  const gripperLeftRef = useRef();
  const gripperRightRef = useRef();
  const endEffectorRef = useRef();
  
  // Arm segment lengths (matching your original code style)
  const L1 = 3; // First segment length
  const L2 = 2.5; // Second segment length
  const BASE_HEIGHT = 1; // Height of base
  
  // Current joint angles (smoothed)
  const currentAngles = useRef({
    base: 0,
    shoulder: Math.PI / 4,
    elbow: -Math.PI / 4,
    gripperRotation: 0
  });
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getEndEffectorPosition: () => {
      if (endEffectorRef.current) {
        const worldPos = new THREE.Vector3();
        endEffectorRef.current.getWorldPosition(worldPos);
        return [worldPos.x, worldPos.y, worldPos.z];
      }
      return [0, 0, 0];
    }
  }));
  
  useFrame((state) => {
    if (!targetPosition) return;
    
    // Calculate base rotation (around Y axis to face target)
    const targetBaseAngle = Math.atan2(targetPosition.x, targetPosition.z);
    
    // Calculate distance in XZ plane
    const distanceXZ = Math.sqrt(
      targetPosition.x * targetPosition.x + 
      targetPosition.z * targetPosition.z
    );
    
    // Height from base to target
    const heightDiff = targetPosition.y - BASE_HEIGHT;
    
    // Calculate required reach
    const reach = Math.sqrt(distanceXZ * distanceXZ + heightDiff * heightDiff);
    
    // Clamp reach to arm's maximum
    const maxReach = L1 + L2;
    const clampedReach = Math.min(reach, maxReach * 0.95); // Leave some margin
    
    // Calculate joint angles using 2-DOF IK
    let shoulderAngle, elbowAngle;
    
    if (clampedReach < maxReach && clampedReach > Math.abs(L1 - L2)) {
      // Use law of cosines for elbow angle
      const cosElbow = (L1 * L1 + L2 * L2 - clampedReach * clampedReach) / (2 * L1 * L2);
      elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
      
      // Calculate shoulder angle
      const alpha = Math.atan2(heightDiff, distanceXZ);
      const cosBeta = (clampedReach * clampedReach + L1 * L1 - L2 * L2) / (2 * clampedReach * L1);
      const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
      shoulderAngle = alpha + beta;
    } else {
      // Extend arm fully toward target
      shoulderAngle = Math.atan2(heightDiff, distanceXZ);
      elbowAngle = 0;
    }
    
    // Smooth interpolation
    const lerpSpeed = 0.1;
    currentAngles.current.base = THREE.MathUtils.lerp(
      currentAngles.current.base,
      targetBaseAngle,
      lerpSpeed
    );
    currentAngles.current.shoulder = THREE.MathUtils.lerp(
      currentAngles.current.shoulder,
      shoulderAngle,
      lerpSpeed
    );
    currentAngles.current.elbow = THREE.MathUtils.lerp(
      currentAngles.current.elbow,
      -elbowAngle, // Negative for proper bending
      lerpSpeed
    );
    
    // Apply rotations to joints
    if (baseRef.current) {
      baseRef.current.rotation.y = currentAngles.current.base;
    }
    
    if (shoulder.current) {
      shoulder.current.rotation.z = currentAngles.current.shoulder - Math.PI / 2;
    }
    
    if (elbow.current) {
      elbow.current.rotation.z = currentAngles.current.elbow;
    }
    
    if (wrist.current) {
      // Keep wrist level
      wrist.current.rotation.z = -(currentAngles.current.shoulder - Math.PI / 2 + currentAngles.current.elbow);
    }
    
    // Animate gripper
    if (gripperLeftRef.current && gripperRightRef.current) {
      const gripAngle = clawOpen ? 0.4 : -0.05;
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
    
    // Rotate gripper continuously for visual effect
    currentAngles.current.gripperRotation += 0.01;
    if (endEffectorRef.current) {
      endEffectorRef.current.rotation.x = currentAngles.current.gripperRotation;
    }
  });
  
  return (
    <group position={[0, 0, 0]}>
      {/* Fixed Base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 0.5, 32]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Rotating base */}
      <group ref={baseRef}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.4, 32]} />
          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Shoulder joint */}
        <group position={[0, BASE_HEIGHT, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* First arm segment */}
          <group ref={shoulder}>
            <mesh position={[L1/2, 0, 0]} castShadow>
              <boxGeometry args={[L1, 0.4, 0.4]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
            </mesh>
            
            {/* Decorative details on arm */}
            <mesh position={[L1/2, 0, 0.25]} castShadow>
              <boxGeometry args={[L1 * 0.8, 0.3, 0.05]} />
              <meshStandardMaterial color="#7f8c8d" metalness={0.5} roughness={0.4} />
            </mesh>
            
            {/* Elbow joint */}
            <group position={[L1, 0, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
              </mesh>
              
              {/* Second arm segment */}
              <group ref={elbow}>
                <mesh position={[L2/2, 0, 0]} castShadow>
                  <boxGeometry args={[L2, 0.35, 0.35]} />
                  <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                </mesh>
                
                {/* Decorative details */}
                <mesh position={[L2/2, 0, 0.2]} castShadow>
                  <boxGeometry args={[L2 * 0.8, 0.25, 0.05]} />
                  <meshStandardMaterial color="#7f8c8d" metalness={0.5} roughness={0.4} />
                </mesh>
                
                {/* Wrist joint */}
                <group position={[L2, 0, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
                  </mesh>
                  
                  {/* End effector / Gripper assembly */}
                  <group ref={wrist}>
                    <group ref={endEffectorRef}>
                      {/* Gripper base */}
                      <mesh position={[0.3, 0, 0]} castShadow>
                        <boxGeometry args={[0.4, 0.3, 0.3]} />
                        <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
                      </mesh>
                      
                      {/* Left gripper finger */}
                      <group ref={gripperLeftRef} position={[0.5, 0, 0]}>
                        <mesh position={[0.15, 0, 0.1]} castShadow>
                          <boxGeometry args={[0.3, 0.05, 0.15]} />
                          <meshStandardMaterial 
                            color={hasBlock ? "#f39c12" : "#e74c3c"}
                            metalness={0.7}
                            roughness={0.3}
                            emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                            emissiveIntensity={hasBlock ? 0.3 : 0.1}
                          />
                        </mesh>
                        {/* Gripper tip */}
                        <mesh position={[0.3, 0, 0.1]} castShadow>
                          <boxGeometry args={[0.05, 0.05, 0.1]} />
                          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                        </mesh>
                      </group>
                      
                      {/* Right gripper finger */}
                      <group ref={gripperRightRef} position={[0.5, 0, 0]}>
                        <mesh position={[0.15, 0, -0.1]} castShadow>
                          <boxGeometry args={[0.3, 0.05, 0.15]} />
                          <meshStandardMaterial 
                            color={hasBlock ? "#f39c12" : "#e74c3c"}
                            metalness={0.7}
                            roughness={0.3}
                            emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                            emissiveIntensity={hasBlock ? 0.3 : 0.1}
                          />
                        </mesh>
                        {/* Gripper tip */}
                        <mesh position={[0.3, 0, -0.1]} castShadow>
                          <boxGeometry args={[0.05, 0.05, 0.1]} />
                          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                        </mesh>
                      </group>
                      
                      {/* Status LED */}
                      <mesh position={[0.3, 0.2, 0]}>
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
          </group>
        </group>
      </group>
      
      {/* Base ring decoration */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Visual guides for debugging */}
      {/* <axesHelper args={[5]} /> */}
    </group>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;