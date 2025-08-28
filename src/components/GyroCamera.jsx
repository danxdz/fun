import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GyroCamera = ({ onGyroUpdate, gyroPermission, setGyroPermission, sensitivity = 1.5, calibrationOffset = { x: 0, y: 0, z: 0 } }) => {
  const { camera } = useThree();
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const currentRotation = useRef({ x: 0, y: 0, z: 0 });
  const smoothedRotation = useRef({ x: 0, y: 0, z: 0 });
  const initialOrientation = useRef(null);
  const orientationBuffer = useRef({ alpha: [], beta: [], gamma: [] });
  const lastValidOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });
  
  // Low-pass filter settings
  const FILTER_STRENGTH = 0.8; // Higher = more smoothing (0-1)
  const BUFFER_SIZE = 5; // Number of samples to average
  const DEAD_ZONE = 0.5; // Ignore small movements
  const MAX_DELTA = 10; // Maximum change per frame to prevent jumps
  
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
        let { alpha, beta, gamma } = event;
        
        // Skip if no real data
        if (alpha === null && beta === null && gamma === null) return;
        
        // Use last valid values if current ones are null
        alpha = alpha !== null ? alpha : lastValidOrientation.current.alpha;
        beta = beta !== null ? beta : lastValidOrientation.current.beta;
        gamma = gamma !== null ? gamma : lastValidOrientation.current.gamma;
        
        // Store initial orientation
        if (!initialOrientation.current) {
          initialOrientation.current = { alpha, beta, gamma };
          orientationBuffer.current = {
            alpha: [alpha],
            beta: [beta],
            gamma: [gamma]
          };
        }
        
        // Add to buffer for averaging
        orientationBuffer.current.alpha.push(alpha);
        orientationBuffer.current.beta.push(beta);
        orientationBuffer.current.gamma.push(gamma);
        
        // Keep buffer size limited
        if (orientationBuffer.current.alpha.length > BUFFER_SIZE) {
          orientationBuffer.current.alpha.shift();
          orientationBuffer.current.beta.shift();
          orientationBuffer.current.gamma.shift();
        }
        
        // Calculate averaged values (moving average filter)
        const avgAlpha = orientationBuffer.current.alpha.reduce((a, b) => a + b, 0) / orientationBuffer.current.alpha.length;
        const avgBeta = orientationBuffer.current.beta.reduce((a, b) => a + b, 0) / orientationBuffer.current.beta.length;
        const avgGamma = orientationBuffer.current.gamma.reduce((a, b) => a + b, 0) / orientationBuffer.current.gamma.length;
        
        // Calculate relative rotation from initial position with calibration offset
        let relativeAlpha = avgAlpha - initialOrientation.current.alpha;
        let relativeBeta = avgBeta - initialOrientation.current.beta - calibrationOffset.x;
        let relativeGamma = avgGamma - initialOrientation.current.gamma - calibrationOffset.y;
        
        // Normalize angles to -180 to 180 range
        relativeAlpha = ((relativeAlpha + 180) % 360) - 180;
        relativeBeta = ((relativeBeta + 180) % 360) - 180;
        relativeGamma = ((relativeGamma + 180) % 360) - 180;
        
        // Apply dead zone to reduce jitter
        if (Math.abs(relativeBeta - smoothedRotation.current.x / sensitivity) < DEAD_ZONE) {
          relativeBeta = smoothedRotation.current.x / sensitivity;
        }
        if (Math.abs(relativeGamma - smoothedRotation.current.y / (sensitivity * 1.5)) < DEAD_ZONE) {
          relativeGamma = smoothedRotation.current.y / (sensitivity * 1.5);
        }
        
        // Calculate new rotation with sensitivity
        const newX = relativeBeta * sensitivity;
        const newY = relativeGamma * sensitivity * 1.5;
        
        // Limit maximum change per update to prevent jumps
        const deltaX = THREE.MathUtils.clamp(newX - smoothedRotation.current.x, -MAX_DELTA, MAX_DELTA);
        const deltaY = THREE.MathUtils.clamp(newY - smoothedRotation.current.y, -MAX_DELTA, MAX_DELTA);
        
        // Apply low-pass filter for extra smoothing
        smoothedRotation.current.x = smoothedRotation.current.x * FILTER_STRENGTH + (smoothedRotation.current.x + deltaX) * (1 - FILTER_STRENGTH);
        smoothedRotation.current.y = smoothedRotation.current.y * FILTER_STRENGTH + (smoothedRotation.current.y + deltaY) * (1 - FILTER_STRENGTH);
        
        // Final clamping
        targetRotation.current = {
          x: THREE.MathUtils.clamp(smoothedRotation.current.x, -90, 90),
          y: THREE.MathUtils.clamp(smoothedRotation.current.y, -120, 120),
          z: 0
        };
        
        lastValidOrientation.current = { alpha, beta, gamma };
        onGyroUpdate(targetRotation.current);
      };
      
      // Device motion for additional smoothing
      const handleMotion = (event) => {
        if (event.rotationRate && event.rotationRate.beta !== null) {
          const { beta, gamma } = event.rotationRate;
          
          // Only apply significant rotation rates (filtered)
          if (Math.abs(beta) > 1 || Math.abs(gamma) > 1) {
            const filteredBeta = beta * sensitivity * 0.3;
            const filteredGamma = gamma * sensitivity * 0.3;
            
            // Blend with current rotation
            targetRotation.current.x += filteredBeta * 0.1;
            targetRotation.current.y += filteredGamma * 0.1;
            
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
      let lastMouseX = 0;
      let lastMouseY = 0;
      
      const handleMouseMove = (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Apply smoothing to mouse movement too
        const smoothedMouseX = lastMouseX * 0.7 + mouseX * 0.3;
        const smoothedMouseY = lastMouseY * 0.7 + mouseY * 0.3;
        
        targetRotation.current = {
          x: smoothedMouseY * 60 * sensitivity,
          y: smoothedMouseX * 90 * sensitivity,
          z: 0
        };
        
        lastMouseX = smoothedMouseX;
        lastMouseY = smoothedMouseY;
        
        onGyroUpdate(targetRotation.current);
      };
      
      const handleTouchMove = (event) => {
        if (event.touches.length > 0) {
          const touch = event.touches[0];
          mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
          mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
          
          // Apply smoothing to touch movement
          const smoothedMouseX = lastMouseX * 0.7 + mouseX * 0.3;
          const smoothedMouseY = lastMouseY * 0.7 + mouseY * 0.3;
          
          targetRotation.current = {
            x: smoothedMouseY * 60 * sensitivity,
            y: smoothedMouseX * 90 * sensitivity,
            z: 0
          };
          
          lastMouseX = smoothedMouseX;
          lastMouseY = smoothedMouseY;
          
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
    // Extra smooth camera rotation with variable lerp based on movement speed
    const deltaX = Math.abs(targetRotation.current.x - currentRotation.current.x);
    const deltaY = Math.abs(targetRotation.current.y - currentRotation.current.y);
    
    // Use faster lerp for larger movements, slower for small movements
    const lerpFactorX = deltaX > 5 ? 0.12 : 0.08;
    const lerpFactorY = deltaY > 5 ? 0.12 : 0.08;
    
    currentRotation.current.x = THREE.MathUtils.lerp(
      currentRotation.current.x,
      targetRotation.current.x,
      lerpFactorX
    );
    currentRotation.current.y = THREE.MathUtils.lerp(
      currentRotation.current.y,
      targetRotation.current.y,
      lerpFactorY
    );
    
    // Apply rotation to camera with easing
    camera.rotation.x = (currentRotation.current.x * Math.PI) / 180;
    camera.rotation.y = (currentRotation.current.y * Math.PI) / 180;
    camera.rotation.z = 0;
  });
  
  return null;
};

export default GyroCamera;