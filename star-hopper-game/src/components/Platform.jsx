import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Platform = ({ position, size = [2, 0.5, 2], color = '#4CAF50', type = 'static', onPlayerLand }) => {
  const meshRef = useRef();
  const [touched, setTouched] = useState(false);
  const [disappearing, setDisappearing] = useState(false);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Platform behaviors based on type
    switch(type) {
      case 'moving':
        meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime) * 2;
        break;
      case 'bouncy':
        if (touched) {
          meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0.7, 0.2);
          setTimeout(() => setTouched(false), 100);
        } else {
          meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, 0.1);
        }
        break;
      case 'disappearing':
        if (disappearing) {
          meshRef.current.scale.x *= 0.95;
          meshRef.current.scale.z *= 0.95;
          meshRef.current.material.opacity *= 0.95;
          if (meshRef.current.material.opacity < 0.01) {
            meshRef.current.visible = false;
            setTimeout(() => {
              if (meshRef.current) {
                meshRef.current.visible = true;
                meshRef.current.scale.set(1, 1, 1);
                meshRef.current.material.opacity = 1;
                setDisappearing(false);
              }
            }, 3000);
          }
        }
        break;
      case 'rotating':
        meshRef.current.rotation.y += 0.01;
        break;
      default:
        break;
    }
  });
  
  const handlePlayerContact = () => {
    if (type === 'bouncy') {
      setTouched(true);
      onPlayerLand && onPlayerLand('bouncy');
    } else if (type === 'disappearing') {
      setDisappearing(true);
    }
  };
  
  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      receiveShadow 
      castShadow
      userData={{ type: 'platform', platformType: type, onContact: handlePlayerContact }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.4}
        metalness={0.1}
        transparent={type === 'disappearing'}
      />
    </mesh>
  );
};

export default Platform;