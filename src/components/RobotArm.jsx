import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RobotArm = forwardRef(({ rotation, clawOpen, isGrabbing }, ref) => {
  const baseRef = useRef();
  const link1Ref = useRef();
  const link2Ref = useRef();
  const link3Ref = useRef();
  const clawLeftRef = useRef();
  const clawRightRef = useRef();
  const groupRef = useRef();
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getClawPosition: () => {
      if (groupRef.current) {
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        // Calculate claw position based on arm segments
        const clawOffset = new THREE.Vector3(0, -4, 3);
        clawOffset.applyQuaternion(groupRef.current.quaternion);
        worldPos.add(clawOffset);
        return [worldPos.x, worldPos.y, worldPos.z];
      }
      return [0, 0, 0];
    }
  }));
  
  // Animate the arm based on gyro input
  useFrame((state) => {
    if (groupRef.current) {
      // Smooth rotation transitions
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        (rotation.y * Math.PI) / 180,
        0.1
      );
    }
    
    if (link1Ref.current) {
      // First joint rotation (shoulder)
      const targetX = (rotation.x * Math.PI) / 180;
      link1Ref.current.rotation.z = THREE.MathUtils.lerp(
        link1Ref.current.rotation.z,
        targetX * 0.5,
        0.1
      );
    }
    
    if (link2Ref.current) {
      // Second joint rotation (elbow)
      const targetX = (rotation.x * Math.PI) / 180;
      link2Ref.current.rotation.z = THREE.MathUtils.lerp(
        link2Ref.current.rotation.z,
        targetX * 0.3,
        0.1
      );
    }
    
    if (link3Ref.current) {
      // Wrist rotation
      link3Ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    
    // Claw animation
    if (clawLeftRef.current && clawRightRef.current) {
      const clawAngle = clawOpen ? 0.3 : 0;
      clawLeftRef.current.rotation.z = THREE.MathUtils.lerp(
        clawLeftRef.current.rotation.z,
        clawAngle,
        0.2
      );
      clawRightRef.current.rotation.z = THREE.MathUtils.lerp(
        clawRightRef.current.rotation.z,
        -clawAngle,
        0.2
      );
      
      // Add grabbing animation
      if (isGrabbing) {
        const grabPulse = Math.sin(state.clock.elapsedTime * 10) * 0.05;
        clawLeftRef.current.rotation.z += grabPulse;
        clawRightRef.current.rotation.z -= grabPulse;
      }
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Base */}
      <mesh ref={baseRef} position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2, 1, 32]} />
        <meshStandardMaterial color="#4e676b" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Rotating platform */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 32]} />
        <meshStandardMaterial color="#9eb5b8" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* First arm segment (shoulder) */}
      <group ref={link1Ref} position={[0, 1.5, 0]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.8, 3, 0.8]} />
          <meshStandardMaterial color="#9eb5b8" metalness={0.4} roughness={0.5} />
        </mesh>
        
        {/* Joint */}
        <mesh position={[0, 3, 0]} castShadow>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#4e676b" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Second arm segment (elbow) */}
        <group ref={link2Ref} position={[0, 3, 0]}>
          <mesh position={[0, 1.25, 0]} castShadow>
            <boxGeometry args={[0.6, 2.5, 0.6]} />
            <meshStandardMaterial color="#9eb5b8" metalness={0.4} roughness={0.5} />
          </mesh>
          
          {/* Joint */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#4e676b" metalness={0.6} roughness={0.4} />
          </mesh>
          
          {/* Third arm segment (wrist) */}
          <group ref={link3Ref} position={[0, 2.5, 0]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.4, 1, 0.4]} />
              <meshStandardMaterial color="#9eb5b8" metalness={0.4} roughness={0.5} />
            </mesh>
            
            {/* Claw base */}
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.4, 0.3, 16]} />
              <meshStandardMaterial color="#4e676b" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Left claw */}
            <group ref={clawLeftRef} position={[-0.2, 1.2, 0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.1, 0.6, 0.3]} />
                <meshStandardMaterial 
                  color={isGrabbing ? "#ff6b6b" : "#ffd700"} 
                  metalness={0.7} 
                  roughness={0.3}
                  emissive={isGrabbing ? "#ff0000" : "#000000"}
                  emissiveIntensity={isGrabbing ? 0.2 : 0}
                />
              </mesh>
              <mesh position={[0, 0.6, 0.1]} castShadow>
                <boxGeometry args={[0.08, 0.2, 0.2]} />
                <meshStandardMaterial 
                  color={isGrabbing ? "#ff6b6b" : "#ffd700"}
                  metalness={0.7} 
                  roughness={0.3}
                />
              </mesh>
            </group>
            
            {/* Right claw */}
            <group ref={clawRightRef} position={[0.2, 1.2, 0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.1, 0.6, 0.3]} />
                <meshStandardMaterial 
                  color={isGrabbing ? "#ff6b6b" : "#ffd700"} 
                  metalness={0.7} 
                  roughness={0.3}
                  emissive={isGrabbing ? "#ff0000" : "#000000"}
                  emissiveIntensity={isGrabbing ? 0.2 : 0}
                />
              </mesh>
              <mesh position={[0, 0.6, 0.1]} castShadow>
                <boxGeometry args={[0.08, 0.2, 0.2]} />
                <meshStandardMaterial 
                  color={isGrabbing ? "#ff6b6b" : "#ffd700"}
                  metalness={0.7} 
                  roughness={0.3}
                />
              </mesh>
            </group>
            
            {/* LED indicators */}
            <mesh position={[0, 0.8, 0.3]} >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial 
                color={isGrabbing ? "#00ff00" : "#ff0000"} 
                emissive={isGrabbing ? "#00ff00" : "#ff0000"}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});

RobotArm.displayName = 'RobotArm';

export default RobotArm;