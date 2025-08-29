import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ targetPosition, clawOpen, hasBlock }, ref) => {
  const baseRef = useRef();
  const shoulder = useRef();
  const elbow = useRef();
  const wrist = useRef();
  const wristBend = useRef();
  const gripperLeftRef = useRef();
  const gripperRightRef = useRef();
  const endEffectorRef = useRef();
  
  // Longer arm segments for better reach
  const L1 = 4.5; // First segment length
  const L2 = 4; // Second segment length
  const L3 = 2; // Wrist segment
  const BASE_HEIGHT = 2; // Taller base for height advantage
  
  // Current joint angles (smoothed)
  const currentAngles = useRef({
    base: 0,
    shoulder: Math.PI / 6,
    elbow: -Math.PI / 3,
    wrist: 0,
    wristBend: 0, // New: vertical wrist rotation
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
    
    // Calculate required reach (accounting for wrist that can bend)
    const reach = Math.sqrt(distanceXZ * distanceXZ + heightDiff * heightDiff);
    
    // Maximum reach with bent wrist
    const maxReach = L1 + L2 + L3;
    const clampedReach = Math.min(reach, maxReach * 0.98);
    
    // Calculate joint angles using improved IK
    let shoulderAngle, elbowAngle, wristAngle, wristBendAngle;
    
    // Check if we need to reach high (gripper pointing up)
    const needsHighReach = targetPosition.y > BASE_HEIGHT + 3;
    const needsLowReach = targetPosition.y < BASE_HEIGHT - 1;
    
    if (clampedReach < (L1 + L2) && clampedReach > Math.abs(L1 - L2)) {
      // Calculate elbow angle
      const reachForTwoSegments = Math.min(clampedReach, L1 + L2);
      const cosElbow = (L1 * L1 + L2 * L2 - reachForTwoSegments * reachForTwoSegments) / (2 * L1 * L2);
      elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
      
      // Calculate shoulder angle
      const alpha = Math.atan2(heightDiff, distanceXZ);
      const cosBeta = (reachForTwoSegments * reachForTwoSegments + L1 * L1 - L2 * L2) / (2 * reachForTwoSegments * L1);
      const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
      
      if (needsHighReach) {
        // Reaching high - lift shoulder and bend wrist up
        shoulderAngle = alpha + beta * 0.6;
        wristAngle = -Math.PI / 6; // Keep relatively straight
        wristBendAngle = Math.PI / 3; // Bend wrist up (60 degrees)
      } else if (needsLowReach) {
        // Reaching low - lower shoulder and bend wrist down
        shoulderAngle = alpha + beta * 1.3;
        wristAngle = Math.PI / 6;
        wristBendAngle = -Math.PI / 4; // Bend wrist down
      } else {
        // Normal reach - keep wrist mostly straight
        shoulderAngle = alpha + beta;
        wristAngle = -(shoulderAngle + elbowAngle) * 0.3;
        wristBendAngle = 0;
      }
      
      // Additional wrist bend for extreme heights
      if (targetPosition.y > BASE_HEIGHT + 5) {
        wristBendAngle = Math.PI / 2; // 90 degrees up
      } else if (targetPosition.y < BASE_HEIGHT - 2) {
        wristBendAngle = -Math.PI / 3; // 60 degrees down
      }
      
    } else {
      // Extend arm fully toward target
      shoulderAngle = Math.atan2(heightDiff, distanceXZ);
      elbowAngle = 0;
      wristAngle = -shoulderAngle * 0.5;
      
      // Wrist bend based on target height
      if (needsHighReach) {
        wristBendAngle = Math.PI / 2; // Point straight up
      } else if (needsLowReach) {
        wristBendAngle = -Math.PI / 3; // Point down
      } else {
        wristBendAngle = 0;
      }
    }
    
    // Smooth interpolation with faster response
    const lerpSpeed = 0.15;
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
      -elbowAngle,
      lerpSpeed
    );
    currentAngles.current.wrist = THREE.MathUtils.lerp(
      currentAngles.current.wrist,
      wristAngle,
      lerpSpeed
    );
    currentAngles.current.wristBend = THREE.MathUtils.lerp(
      currentAngles.current.wristBend,
      wristBendAngle,
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
      wrist.current.rotation.z = currentAngles.current.wrist;
    }
    
    if (wristBend.current) {
      // This makes the gripper point up/down
      wristBend.current.rotation.z = currentAngles.current.wristBend;
    }
    
    // Animate gripper
    if (gripperLeftRef.current && gripperRightRef.current) {
      const gripAngle = clawOpen ? 0.5 : -0.05;
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
      {/* Taller fixed base */}
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
          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Shoulder joint - positioned higher */}
        <group position={[0, BASE_HEIGHT, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* First arm segment (shoulder to elbow) */}
          <group ref={shoulder}>
            <mesh position={[L1/2, 0, 0]} castShadow>
              <boxGeometry args={[L1, 0.5, 0.5]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
            </mesh>
            
            {/* Elbow joint */}
            <group position={[L1, 0, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
              </mesh>
              
              {/* Second arm segment (elbow to wrist) */}
              <group ref={elbow}>
                <mesh position={[L2/2, 0, 0]} castShadow>
                  <boxGeometry args={[L2, 0.45, 0.45]} />
                  <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                </mesh>
                
                {/* Wrist joint */}
                <group position={[L2, 0, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
                  </mesh>
                  
                  {/* Wrist rotation (keeps gripper level) */}
                  <group ref={wrist}>
                    {/* Wrist bend joint (NEW - allows gripper to point up/down) */}
                    <group ref={wristBend}>
                      {/* Third segment with gripper */}
                      <mesh position={[L3/2, 0, 0]} castShadow>
                        <boxGeometry args={[L3, 0.35, 0.35]} />
                        <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                      </mesh>
                      
                      {/* Small joint before gripper */}
                      <mesh position={[L3, 0, 0]} castShadow>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
                      </mesh>
                      
                      {/* End effector / Gripper assembly */}
                      <group position={[L3, 0, 0]} ref={endEffectorRef}>
                        {/* Gripper base */}
                        <mesh position={[0.3, 0, 0]} castShadow>
                          <boxGeometry args={[0.5, 0.4, 0.4]} />
                          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
                        </mesh>
                        
                        {/* Left gripper finger */}
                        <group ref={gripperLeftRef} position={[0.5, 0, 0]}>
                          <mesh position={[0.2, 0, 0.15]} castShadow>
                            <boxGeometry args={[0.4, 0.06, 0.2]} />
                            <meshStandardMaterial 
                              color={hasBlock ? "#f39c12" : "#e74c3c"}
                              metalness={0.7}
                              roughness={0.3}
                              emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                              emissiveIntensity={hasBlock ? 0.3 : 0.1}
                            />
                          </mesh>
                          <mesh position={[0.4, 0, 0.15]} castShadow>
                            <boxGeometry args={[0.06, 0.06, 0.15]} />
                            <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                          </mesh>
                        </group>
                        
                        {/* Right gripper finger */}
                        <group ref={gripperRightRef} position={[0.5, 0, 0]}>
                          <mesh position={[0.2, 0, -0.15]} castShadow>
                            <boxGeometry args={[0.4, 0.06, 0.2]} />
                            <meshStandardMaterial 
                              color={hasBlock ? "#f39c12" : "#e74c3c"}
                              metalness={0.7}
                              roughness={0.3}
                              emissive={hasBlock ? "#f39c12" : "#e74c3c"}
                              emissiveIntensity={hasBlock ? 0.3 : 0.1}
                            />
                          </mesh>
                          <mesh position={[0.4, 0, -0.15]} castShadow>
                            <boxGeometry args={[0.06, 0.06, 0.15]} />
                            <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                          </mesh>
                        </group>
                        
                        {/* Status LED */}
                        <mesh position={[0.3, 0.25, 0]}>
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