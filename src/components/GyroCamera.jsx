import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GyroCamera = ({ onGyroUpdate, gyroPermission, setGyroPermission, sensitivity = 1.5, calibrationOffset = { x: 0, y: 0, z: 0 } }) => {
  const { camera } = useThree();
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const currentRotation = useRef({ x: 0, y: 0, z: 0 });
  const initialOrientation = useRef(null);
  const lastOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });
  
  useEffect(() => {
    // Check if gyroscope is available
    if (window.DeviceOrientationEvent) {
      setupGyroscope();
    } else {
      // Fallback to mouse/touch controls
      setupMouseControls();
    }
    
    function setupGyroscope() {
      const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event;
        
        // Skip if no real data
        if (alpha === null && beta === null && gamma === null) return;
        
        // Store initial orientation
        if (!initialOrientation.current) {
          initialOrientation.current = { 
            alpha: alpha || 0, 
            beta: beta || 0, 
            gamma: gamma || 0 
          };
        }
        
        // Calculate relative rotation from initial position with calibration offset
        const relativeAlpha = (alpha || 0) - initialOrientation.current.alpha;
        const relativeBeta = (beta || 0) - initialOrientation.current.beta - calibrationOffset.x;
        const relativeGamma = (gamma || 0) - initialOrientation.current.gamma - calibrationOffset.y;
        
        // Apply sensitivity and convert to camera rotation
        // Increased base multipliers for more responsive movement
        targetRotation.current = {
          x: THREE.MathUtils.clamp(relativeBeta * sensitivity, -90, 90),
          y: THREE.MathUtils.clamp(relativeGamma * sensitivity * 1.5, -120, 120), // More horizontal range
          z: 0
        };
        
        lastOrientation.current = { alpha, beta, gamma };
        onGyroUpdate(targetRotation.current);
      };
      
      // Also handle device motion for additional responsiveness
      const handleMotion = (event) => {
        if (event.rotationRate && event.rotationRate.beta !== null) {
          const { alpha, beta, gamma } = event.rotationRate;
          
          // Add rotation rate to current rotation for more responsive feel
          if (Math.abs(beta) > 0.5 || Math.abs(gamma) > 0.5) {
            targetRotation.current.x += beta * sensitivity * 0.5;
            targetRotation.current.y += gamma * sensitivity * 0.5;
            
            // Clamp values
            targetRotation.current.x = THREE.MathUtils.clamp(targetRotation.current.x, -90, 90);
            targetRotation.current.y = THREE.MathUtils.clamp(targetRotation.current.y, -120, 120);
          }
        }
      };
      
      window.addEventListener('deviceorientation', handleOrientation);
      window.addEventListener('devicemotion', handleMotion);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        window.removeEventListener('devicemotion', handleMotion);
      };
    }
    
    function setupMouseControls() {
      let mouseX = 0;
      let mouseY = 0;
      
      const handleMouseMove = (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        targetRotation.current = {
          x: mouseY * 60 * sensitivity,
          y: mouseX * 90 * sensitivity,
          z: 0
        };
        
        onGyroUpdate(targetRotation.current);
      };
      
      const handleTouchMove = (event) => {
        if (event.touches.length > 0) {
          const touch = event.touches[0];
          mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
          mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
          
          targetRotation.current = {
            x: mouseY * 60 * sensitivity,
            y: mouseX * 90 * sensitivity,
            z: 0
          };
          
          onGyroUpdate(targetRotation.current);
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [onGyroUpdate, setGyroPermission, sensitivity, calibrationOffset]);
  
  useFrame(() => {
    // Smooth camera rotation with faster lerp for more responsiveness
    currentRotation.current.x = THREE.MathUtils.lerp(
      currentRotation.current.x,
      targetRotation.current.x,
      0.15 // Increased from 0.1 for faster response
    );
    currentRotation.current.y = THREE.MathUtils.lerp(
      currentRotation.current.y,
      targetRotation.current.y,
      0.15
    );
    
    // Apply rotation to camera
    camera.rotation.x = (currentRotation.current.x * Math.PI) / 180;
    camera.rotation.y = (currentRotation.current.y * Math.PI) / 180;
    camera.rotation.z = 0;
  });
  
  return null;
};

export default GyroCamera;