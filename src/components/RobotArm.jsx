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
  
  // Arm segment lengths
  const L1 = 4; // First segment length (shoulder to elbow)
  const L2 = 3.5; // Second segment length (elbow to wrist)
  const L3 = 2; // Third segment length (wrist to gripper)
  const BASE_HEIGHT = 2; // Base height from ground
  
  // Current joint angles (smoothed) - Better starting position
  const currentAngles = useRef({
    base: 0,              // Facing forward
    shoulder: 0,          // 90° up (vertical) - Note: 0 because we rotate from vertical
    elbow: Math.PI / 4,   // 45° bend
    wrist: -Math.PI / 4,  // Compensate to keep gripper horizontal
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
    
    // Height difference from shoulder joint to target
    const targetHeight = targetPosition.y - BASE_HEIGHT;
    
    // Total reach needed
    const totalReach = Math.sqrt(distanceXZ * distanceXZ + targetHeight * targetHeight);
    
    // Maximum possible reach
    const maxReach = L1 + L2 + L3;
    
    // Clamp the reach to possible range
    const clampedReach = Math.min(totalReach, maxReach * 0.95);
    
    // Calculate IK for 2-DOF arm (treating L3 as fixed extension)
    let shoulderAngle, elbowAngle, wristAngle;
    
    // Effective reach for 2-DOF calculation (excluding wrist segment)
    const effectiveReach = Math.sqrt(
      Math.max(0, distanceXZ * distanceXZ + targetHeight * targetHeight - L3 * L3)
    );
    
    if (effectiveReach < (L1 + L2) && effectiveReach > Math.abs(L1 - L2)) {
      // Normal IK solution - arm can reach the target
      
      // Calculate elbow angle using law of cosines
      const cosElbow = (L1 * L1 + L2 * L2 - effectiveReach * effectiveReach) / (2 * L1 * L2);
      elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
      
      // Calculate shoulder angle
      const targetAngle = Math.atan2(targetHeight, distanceXZ);
      const cosAlpha = (effectiveReach * effectiveReach + L1 * L1 - L2 * L2) / (2 * effectiveReach * L1);
      const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
      
      // Shoulder angle from vertical (0 = straight up, PI/2 = horizontal forward)
      shoulderAngle = Math.PI/2 - (targetAngle + alpha);
      
      // Wrist angle to keep gripper roughly horizontal
      wristAngle = -(shoulderAngle + elbowAngle - Math.PI/2);
      
      // Adjust wrist for very high or low positions
      if (targetPosition.y > BASE_HEIGHT + 6) {
        wristAngle += Math.PI / 6; // Tilt up slightly
      } else if (targetPosition.y < BASE_HEIGHT - 1) {
        wristAngle -= Math.PI / 6; // Tilt down slightly
      }
      
    } else if (effectiveReach <= Math.abs(L1 - L2)) {
      // Target is very close - fold the arm
      shoulderAngle = Math.PI/2 - Math.atan2(targetHeight, distanceXZ);
      elbowAngle = Math.PI * 0.8; // Almost fully bent
      wristAngle = 0;
    } else {
      // Target is at maximum reach - extend the arm
      shoulderAngle = Math.PI/2 - Math.atan2(targetHeight, distanceXZ);
      elbowAngle = 0; // Fully extended
      wristAngle = -shoulderAngle;
    }
    
    // Smooth interpolation
    const lerpSpeed = 0.12;
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
      elbowAngle,
      lerpSpeed
    );
    currentAngles.current.wrist = THREE.MathUtils.lerp(
      currentAngles.current.wrist,
      wristAngle,
      lerpSpeed
    );
    
    // Apply rotations to joints
    if (baseRef.current) {
      baseRef.current.rotation.y = currentAngles.current.base;
    }
    
    if (shoulder.current) {
      // Rotate from vertical position
      shoulder.current.rotation.z = currentAngles.current.shoulder;
    }
    
    if (elbow.current) {
      elbow.current.rotation.z = currentAngles.current.elbow;
    }
    
    if (wrist.current) {
      wrist.current.rotation.z = currentAngles.current.wrist;
    }
    
    // Animate gripper
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
    <group position={[0, 0, 0]}>
      {/* Fixed base platform */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2, 1, 32]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Support column */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.5, 16]} />
        <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Rotating base */}
      <group ref={baseRef}>
        <mesh position={[0, 1.75, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
          <meshStandardMaterial color="#e67e22" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Shoulder joint at base height */}
        <group position={[0, BASE_HEIGHT, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* First arm segment - starts vertical, rotates around Z */}
          <group ref={shoulder}>
            {/* Segment 1: Vertical by default (along Y axis) */}
            <mesh position={[0, L1/2, 0]} castShadow>
              <boxGeometry args={[0.5, L1, 0.5]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
            </mesh>
            
            {/* Decorative stripes */}
            <mesh position={[0, L1*0.3, 0.26]} castShadow>
              <boxGeometry args={[0.4, L1*0.4, 0.02]} />
              <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.3} />
            </mesh>
            
            {/* Elbow joint at end of first segment */}
            <group position={[0, L1, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
              </mesh>
              
              {/* Second arm segment */}
              <group ref={elbow}>
                {/* Segment 2: Extends from elbow */}
                <mesh position={[0, L2/2, 0]} castShadow>
                  <boxGeometry args={[0.45, L2, 0.45]} />
                  <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                </mesh>
                
                {/* Decorative stripes */}
                <mesh position={[0, L2*0.3, 0.23]} castShadow>
                  <boxGeometry args={[0.35, L2*0.4, 0.02]} />
                  <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.3} />
                </mesh>
                
                {/* Wrist joint */}
                <group position={[0, L2, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
                  </mesh>
                  
                  {/* Third segment with wrist rotation */}
                  <group ref={wrist}>
                    {/* Segment 3: Wrist to gripper */}
                    <mesh position={[0, L3/2, 0]} castShadow>
                      <boxGeometry args={[0.35, L3, 0.35]} />
                      <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                    </mesh>
                    
                    {/* End effector / Gripper assembly */}
                    <group position={[0, L3, 0]} ref={endEffectorRef}>
                      {/* Gripper base */}
                      <mesh position={[0, 0.2, 0]} castShadow>
                        <boxGeometry args={[0.4, 0.4, 0.4]} />
                        <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
                      </mesh>
                      
                      {/* Left gripper finger */}
                      <group ref={gripperLeftRef} position={[0, 0.4, 0]}>
                        <mesh position={[0.15, 0.2, 0]} castShadow>
                          <boxGeometry args={[0.2, 0.4, 0.06]} />
                          <meshStandardMaterial 
                            color={hasBlock ? "#f39c12" : "#e74c3c"}
                            metalness={0.7}
                            roughness={0.3}
                            emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                            emissiveIntensity={hasBlock ? 0.3 : 0.1}
                          />
                        </mesh>
                        <mesh position={[0.15, 0.4, 0]} castShadow>
                          <boxGeometry args={[0.15, 0.06, 0.06]} />
                          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                        </mesh>
                      </group>
                      
                      {/* Right gripper finger */}
                      <group ref={gripperRightRef} position={[0, 0.4, 0]}>
                        <mesh position={[-0.15, 0.2, 0]} castShadow>
                          <boxGeometry args={[0.2, 0.4, 0.06]} />
                          <meshStandardMaterial 
                            color={hasBlock ? "#f39c12" : "#e74c3c"}
                            metalness={0.7}
                            roughness={0.3}
                            emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                            emissiveIntensity={hasBlock ? 0.3 : 0.1}
                          />
                        </mesh>
                        <mesh position={[-0.15, 0.4, 0]} castShadow>
                          <boxGeometry args={[0.15, 0.06, 0.06]} />
                          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                        </mesh>
                      </group>
                      
                      {/* Status LED */}
                      <mesh position={[0, 0, 0.25]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
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
        <ringGeometry args={[1.6, 2, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;