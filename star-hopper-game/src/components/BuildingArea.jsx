import React from 'react';
import { useBox } from '@react-three/cannon';
import { Text } from '@react-three/drei';

const BuildingArea = ({ level, placedBlocks }) => {
  // Ground
  const [groundRef] = useBox(() => ({
    type: 'Static',
    position: [0, -0.5, 0],
    args: [30, 1, 20]
  }));
  
  // Side walls for containment
  const [leftWallRef] = useBox(() => ({
    type: 'Static',
    position: [-15, 2, 0],
    args: [0.5, 5, 20]
  }));
  
  const [rightWallRef] = useBox(() => ({
    type: 'Static',
    position: [15, 2, 0],
    args: [0.5, 5, 20]
  }));
  
  const [backWallRef] = useBox(() => ({
    type: 'Static',
    position: [0, 2, -10],
    args: [30, 5, 0.5]
  }));
  
  // Blueprint guide based on level
  const renderBlueprint = () => {
    switch(level.blueprint) {
      case 'tower':
        return (
          <group>
            {[...Array(5)].map((_, i) => (
              <mesh key={i} position={[0, i + 0.5, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial 
                  color="#00FF00" 
                  wireframe 
                  transparent 
                  opacity={0.2} 
                />
              </mesh>
            ))}
          </group>
        );
      case 'bridge':
        return (
          <group>
            <mesh position={[-3, 0.5, 0]}>
              <boxGeometry args={[2, 1, 2]} />
              <meshBasicMaterial color="#00FF00" wireframe transparent opacity={0.2} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[4, 1, 2]} />
              <meshBasicMaterial color="#00FF00" wireframe transparent opacity={0.2} />
            </mesh>
            <mesh position={[3, 0.5, 0]}>
              <boxGeometry args={[2, 1, 2]} />
              <meshBasicMaterial color="#00FF00" wireframe transparent opacity={0.2} />
            </mesh>
          </group>
        );
      case 'pyramid':
        return (
          <group>
            {/* Base layer */}
            {[-1, 0, 1].map(x => 
              [-1, 0, 1].map(z => (
                <mesh key={`${x}-${z}`} position={[x, 0.5, z]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="#00FF00" wireframe transparent opacity={0.2} />
                </mesh>
              ))
            )}
            {/* Middle layer */}
            {[-0.5, 0.5].map(x => 
              [-0.5, 0.5].map(z => (
                <mesh key={`m-${x}-${z}`} position={[x, 1.5, z]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="#00FF00" wireframe transparent opacity={0.2} />
                </mesh>
              ))
            )}
            {/* Top */}
            <mesh position={[0, 2.5, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#00FF00" wireframe transparent opacity={0.2} />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Ground */}
      <mesh ref={groundRef} receiveShadow>
        <boxGeometry args={[30, 1, 20]} />
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </mesh>
      
      {/* Grid lines on ground */}
      <gridHelper args={[20, 20, '#666666', '#444444']} rotation={[0, 0, 0]} />
      
      {/* Walls (invisible but physical) */}
      <mesh ref={leftWallRef}>
        <boxGeometry args={[0.5, 5, 20]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={rightWallRef}>
        <boxGeometry args={[0.5, 5, 20]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={backWallRef}>
        <boxGeometry args={[30, 5, 0.5]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      
      {/* Blueprint guide */}
      {level.blueprint !== 'free' && renderBlueprint()}
      
      {/* Target zone indicator */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
      </mesh>
      
      {/* Level name display */}
      <Text
        position={[0, 0.1, -8]}
        fontSize={1}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {level.name}
      </Text>
    </>
  );
};

export default BuildingArea;