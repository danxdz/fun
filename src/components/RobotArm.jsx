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
  
  // Longer arm segments for better reach
  const L1 = 4.5; // First segment length (increased)
  const L2 = 4; // Second segment length (increased)
  const L3 = 2; // Wrist segment (added for more flexibility)
  const BASE_HEIGHT = 2; // Taller base for height advantage
  
  // Current joint angles (smoothed)
  const currentAngles = useRef({
    base: 0,
    shoulder: Math.PI / 6, // Start more horizontal
    elbow: -Math.PI / 3,
    wrist: 0,
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
    
    // Height from base to target (adjust for taller base)
    const heightDiff = targetPosition.y - BASE_HEIGHT;
    
    // Calculate required reach
    const reach = Math.sqrt(distanceXZ * distanceXZ + heightDiff * heightDiff);
    
    // Clamp reach to arm's maximum (with all segments)
    const maxReach = L1 + L2 + L3;
    const clampedReach = Math.min(reach, maxReach * 0.98);
    
    // Calculate joint angles using improved IK
    let shoulderAngle, elbowAngle, wristAngle;
    
    if (clampedReach < (L1 + L2) && clampedReach > Math.abs(L1 - L2)) {
      // Use law of cosines for elbow angle
      const reachForTwoSegments = Math.min(clampedReach, L1 + L2);
      const cosElbow = (L1 * L1 + L2 * L2 - reachForTwoSegments * reachForTwoSegments) / (2 * L1 * L2);
      elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
      
      // Calculate shoulder angle with better vertical reach
      const alpha = Math.atan2(heightDiff, distanceXZ);
      const cosBeta = (reachForTwoSegments * reachForTwoSegments + L1 * L1 - L2 * L2) / (2 * reachForTwoSegments * L1);
      const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
      
      // Adjust shoulder angle for better overhead reach
      if (heightDiff > 2) {
        // Reaching high - lift shoulder more
        shoulderAngle = alpha + beta * 0.7;
      } else if (heightDiff < -1) {
        // Reaching low - lower shoulder
        shoulderAngle = alpha + beta * 1.2;
      } else {
        // Normal reach
        shoulderAngle = alpha + beta;
      }
      
      // Wrist angle to keep gripper oriented properly
      wristAngle = -(shoulderAngle + elbowAngle) * 0.5;
    } else {
      // Extend arm fully toward target
      shoulderAngle = Math.atan2(heightDiff, distanceXZ);
      elbowAngle = 0;
      wristAngle = -shoulderAngle * 0.5;
    }
    
    // Smooth interpolation with faster response
    const lerpSpeed = 0.15; // Increased for more responsive movement
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
    
    // Apply rotations to joints
    if (baseRef.current) {
      baseRef.current.rotation.y = currentAngles.current.base;
    }
    
    if (shoulder.current) {
      // Adjust shoulder for better range of motion
      shoulder.current.rotation.z = currentAngles.current.shoulder - Math.PI / 2;
    }
    
    if (elbow.current) {
      elbow.current.rotation.z = currentAngles.current.elbow;
    }
    
    if (wrist.current) {
      wrist.current.rotation.z = currentAngles.current.wrist;
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
          
          {/* First arm segment (longer) */}
          <group ref={shoulder}>
            <mesh position={[L1/2, 0, 0]} castShadow>
              <boxGeometry args={[L1, 0.5, 0.5]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
            </mesh>
            
            {/* Support structure */}
            <mesh position={[L1/3, 0, 0.3]} castShadow>
              <boxGeometry args={[L1 * 0.6, 0.3, 0.05]} />
              <meshStandardMaterial color="#7f8c8d" metalness={0.5} roughness={0.4} />
            </mesh>
            
            {/* Elbow joint */}
            <group position={[L1, 0, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
              </mesh>
              
              {/* Second arm segment (longer) */}
              <group ref={elbow}>
                <mesh position={[L2/2, 0, 0]} castShadow>
                  <boxGeometry args={[L2, 0.45, 0.45]} />
                  <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                </mesh>
                
                {/* Support structure */}
                <mesh position={[L2/3, 0, 0.25]} castShadow>
                  <boxGeometry args={[L2 * 0.6, 0.25, 0.05]} />
                  <meshStandardMaterial color="#7f8c8d" metalness={0.5} roughness={0.4} />
                </mesh>
                
                {/* Wrist joint */}
                <group position={[L2, 0, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshStandardMaterial color="#e74c3c" metalness={0.5} roughness={0.5} />
                  </mesh>
                  
                  {/* Third segment with gripper */}
                  <group ref={wrist}>
                    <mesh position={[L3/2, 0, 0]} castShadow>
                      <boxGeometry args={[L3, 0.35, 0.35]} />
                      <meshStandardMaterial color="#95a5a6" metalness={0.4} roughness={0.5} />
                    </mesh>
                    
                    {/* End effector / Gripper assembly */}
                    <group position={[L3, 0, 0]} ref={endEffectorRef}>
                      {/* Gripper base */}
                      <mesh position={[0.2, 0, 0]} castShadow>
                        <boxGeometry args={[0.4, 0.4, 0.4]} />
                        <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.4} />
                      </mesh>
                      
                      {/* Left gripper finger */}
                      <group ref={gripperLeftRef} position={[0.4, 0, 0]}>
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
                        {/* Gripper tip */}
                        <mesh position={[0.4, 0, 0.15]} castShadow>
                          <boxGeometry args={[0.06, 0.06, 0.15]} />
                          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                        </mesh>
                      </group>
                      
                      {/* Right gripper finger */}
                      <group ref={gripperRightRef} position={[0.4, 0, 0]}>
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
                        {/* Gripper tip */}
                        <mesh position={[0.4, 0, -0.15]} castShadow>
                          <boxGeometry args={[0.06, 0.06, 0.15]} />
                          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
                        </mesh>
                      </group>
                      
                      {/* Status LED */}
                      <mesh position={[0.2, 0.25, 0]}>
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