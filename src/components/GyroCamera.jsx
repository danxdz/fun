import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GyroCamera = ({ onGyroUpdate, gyroPermission, setGyroPermission }) => {
  const { camera } = useThree();
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const currentRotation = useRef({ x: 0, y: 0, z: 0 });
  const initialOrientation = useRef(null);
  
  useEffect(() => {
    // Check if gyroscope is available
    if (window.DeviceOrientationEvent) {
      // Check if permission is needed (iOS 13+)
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              setGyroPermission(true);
              setupGyroscope();
            }
          })
          .catch(console.error);
      } else {
        // Android and older iOS
        setGyroPermission(true);
        setupGyroscope();
      }
    }
    
    function setupGyroscope() {
      const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event;
        
        // Store initial orientation
        if (!initialOrientation.current) {
          initialOrientation.current = { alpha, beta, gamma };
        }
        
        // Calculate relative rotation from initial position
        const relativeAlpha = alpha - initialOrientation.current.alpha;
        const relativeBeta = beta - initialOrientation.current.beta;
        const relativeGamma = gamma - initialOrientation.current.gamma;
        
        // Convert to camera rotation
        // Beta: pitch (x-axis) - phone tilt forward/backward
        // Gamma: roll (z-axis) - phone tilt left/right
        // Alpha: yaw (y-axis) - phone rotation
        targetRotation.current = {
          x: THREE.MathUtils.clamp((relativeBeta - 45) * 0.5, -45, 45),
          y: THREE.MathUtils.clamp(relativeGamma * 0.8, -60, 60),
          z: 0
        };
        
        onGyroUpdate(targetRotation.current);
      };
      
      // Also handle device motion for smoother experience
      const handleMotion = (event) => {
        if (event.rotationRate) {
          const { alpha, beta, gamma } = event.rotationRate;
          // Use rotation rate for smoother updates
          targetRotation.current.x += beta * 0.01;
          targetRotation.current.y += gamma * 0.01;
          
          // Clamp values
          targetRotation.current.x = THREE.MathUtils.clamp(targetRotation.current.x, -45, 45);
          targetRotation.current.y = THREE.MathUtils.clamp(targetRotation.current.y, -60, 60);
        }
      };
      
      window.addEventListener('deviceorientation', handleOrientation);
      window.addEventListener('devicemotion', handleMotion);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        window.removeEventListener('devicemotion', handleMotion);
      };
    }
    
    // Fallback to mouse/touch controls if gyro not available
    if (!window.DeviceOrientationEvent) {
      let mouseX = 0;
      let mouseY = 0;
      
      const handleMouseMove = (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        targetRotation.current = {
          x: mouseY * 45,
          y: mouseX * 60,
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
            x: mouseY * 45,
            y: mouseX * 60,
            z: 0
          };
          
          onGyroUpdate(targetRotation.current);
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [onGyroUpdate, setGyroPermission]);
  
  useFrame(() => {
    // Smooth camera rotation
    currentRotation.current.x = THREE.MathUtils.lerp(
      currentRotation.current.x,
      targetRotation.current.x,
      0.1
    );
    currentRotation.current.y = THREE.MathUtils.lerp(
      currentRotation.current.y,
      targetRotation.current.y,
      0.1
    );
    
    // Apply rotation to camera
    camera.rotation.x = (currentRotation.current.x * Math.PI) / 180;
    camera.rotation.y = (currentRotation.current.y * Math.PI) / 180;
    camera.rotation.z = 0;
  });
  
  return null;
};

export default GyroCamera;