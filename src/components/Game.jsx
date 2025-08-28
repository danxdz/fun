import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Player from './Player';
import Platform from './Platform';
import Star from './Star';
import PuzzleBlock from './PuzzleBlock';
import Cloud from './Cloud';

const Game = forwardRef(({ level, onCollectStar, onSolvePuzzle, isMovingLeft, isMovingRight, playerPosition, setPlayerPosition }, ref) => {
  const [velocity, setVelocity] = useState([0, 0, 0]);
  const [isJumping, setIsJumping] = useState(false);
  const [collectedStars, setCollectedStars] = useState([]);
  const [puzzleSequence, setPuzzleSequence] = useState([]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  
  const playerRef = useRef();
  const worldRef = useRef();
  
  // Expose jump method to parent
  useImperativeHandle(ref, () => ({
    jump: () => {
      if (!isJumping) {
        setVelocity(prev => [prev[0], 8, prev[2]]);
        setIsJumping(true);
      }
    }
  }));
  
  // Generate level layout
  const generateLevel = () => {
    const platforms = [];
    const stars = [];
    const puzzleBlocks = [];
    
    // Base platform
    platforms.push(
      <Platform key="base" position={[0, -1, 0]} size={[20, 1, 10]} color="#8B4513" />
    );
    
    // Level-specific content
    switch(level) {
      case 1:
        // Simple platforms and stars
        platforms.push(
          <Platform key="p1" position={[3, 0, 0]} size={[2, 0.5, 2]} color="#4CAF50" />,
          <Platform key="p2" position={[-3, 1, 0]} size={[2, 0.5, 2]} color="#2196F3" />,
          <Platform key="p3" position={[0, 2, -3]} size={[2, 0.5, 2]} color="#FF9800" />
        );
        stars.push(
          <Star key="s1" position={[3, 1, 0]} onCollect={() => handleStarCollect(0)} collected={collectedStars.includes(0)} />,
          <Star key="s2" position={[-3, 2, 0]} onCollect={() => handleStarCollect(1)} collected={collectedStars.includes(1)} />,
          <Star key="s3" position={[0, 3, -3]} onCollect={() => handleStarCollect(2)} collected={collectedStars.includes(2)} />,
          <Star key="s4" position={[5, 0.5, 2]} onCollect={() => handleStarCollect(3)} collected={collectedStars.includes(3)} />,
          <Star key="s5" position={[-5, 0.5, -2]} onCollect={() => handleStarCollect(4)} collected={collectedStars.includes(4)} />
        );
        break;
        
      case 2:
        // Moving platforms and puzzle blocks
        platforms.push(
          <Platform key="p1" position={[3, 0, 0]} type="moving" size={[2, 0.5, 2]} color="#9C27B0" />,
          <Platform key="p2" position={[-3, 1, 0]} type="bouncy" size={[2, 0.5, 2]} color="#4CAF50" />,
          <Platform key="p3" position={[0, 2, -3]} size={[2, 0.5, 2]} color="#FF9800" />
        );
        puzzleBlocks.push(
          <PuzzleBlock key="pb1" position={[2, 0, 3]} color="#FF0000" puzzleId="red" requiredOrder={1} onActivate={handlePuzzleActivation} />,
          <PuzzleBlock key="pb2" position={[0, 0, 3]} color="#00FF00" puzzleId="green" requiredOrder={2} onActivate={handlePuzzleActivation} />,
          <PuzzleBlock key="pb3" position={[-2, 0, 3]} color="#0000FF" puzzleId="blue" requiredOrder={3} onActivate={handlePuzzleActivation} />
        );
        stars.push(
          <Star key="s1" position={[4, 1, 0]} onCollect={() => handleStarCollect(0)} collected={collectedStars.includes(0)} />,
          <Star key="s2" position={[-3, 3, 0]} onCollect={() => handleStarCollect(1)} collected={collectedStars.includes(1)} />,
          <Star key="s3" position={[0, 3, -3]} onCollect={() => handleStarCollect(2)} collected={collectedStars.includes(2)} />,
          <Star key="s4" position={[0, 1, 3]} onCollect={() => handleStarCollect(3)} collected={collectedStars.includes(3)} />,
          <Star key="s5" position={[-6, 0.5, 0]} onCollect={() => handleStarCollect(4)} collected={collectedStars.includes(4)} />
        );
        break;
        
      case 3:
        // Disappearing platforms and more complex puzzles
        platforms.push(
          <Platform key="p1" position={[3, 0, 0]} type="disappearing" size={[2, 0.5, 2]} color="#F44336" />,
          <Platform key="p2" position={[-3, 1, 0]} type="bouncy" size={[2, 0.5, 2]} color="#4CAF50" />,
          <Platform key="p3" position={[0, 2, -3]} type="rotating" size={[2, 0.5, 2]} color="#3F51B5" />,
          <Platform key="p4" position={[5, 1.5, 0]} type="moving" size={[2, 0.5, 2]} color="#9C27B0" />
        );
        stars.push(
          <Star key="s1" position={[3, 1, 0]} onCollect={() => handleStarCollect(0)} collected={collectedStars.includes(0)} />,
          <Star key="s2" position={[-3, 3, 0]} onCollect={() => handleStarCollect(1)} collected={collectedStars.includes(1)} />,
          <Star key="s3" position={[0, 3.5, -3]} onCollect={() => handleStarCollect(2)} collected={collectedStars.includes(2)} />,
          <Star key="s4" position={[6, 2.5, 0]} onCollect={() => handleStarCollect(3)} collected={collectedStars.includes(3)} />,
          <Star key="s5" position={[-6, 0.5, 2]} onCollect={() => handleStarCollect(4)} collected={collectedStars.includes(4)} />
        );
        break;
        
      default:
        // Procedural generation for higher levels
        const platformCount = 5 + level;
        for (let i = 0; i < platformCount; i++) {
          const types = ['static', 'moving', 'bouncy', 'disappearing', 'rotating'];
          const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
          platforms.push(
            <Platform 
              key={`p${i}`}
              position={[
                (Math.random() - 0.5) * 10,
                Math.random() * 3,
                (Math.random() - 0.5) * 8
              ]}
              type={types[Math.floor(Math.random() * types.length)]}
              size={[2, 0.5, 2]}
              color={colors[Math.floor(Math.random() * colors.length)]}
            />
          );
        }
        
        for (let i = 0; i < 5; i++) {
          stars.push(
            <Star 
              key={`s${i}`}
              position={[
                (Math.random() - 0.5) * 10,
                Math.random() * 4 + 0.5,
                (Math.random() - 0.5) * 8
              ]}
              onCollect={() => handleStarCollect(i)}
              collected={collectedStars.includes(i)}
            />
          );
        }
    }
    
    return { platforms, stars, puzzleBlocks };
  };
  
  const { platforms, stars, puzzleBlocks } = generateLevel();
  
  const handleStarCollect = (starId) => {
    if (!collectedStars.includes(starId)) {
      setCollectedStars(prev => [...prev, starId]);
      onCollectStar();
    }
  };
  
  const handlePuzzleActivation = (puzzleId, requiredOrder) => {
    setPuzzleSequence(prev => [...prev, puzzleId]);
    
    // Check if puzzle is solved
    if (requiredOrder) {
      const expectedSequence = ['red', 'green', 'blue'];
      if (puzzleSequence.length === 2) {
        const currentSequence = [...puzzleSequence, puzzleId];
        if (JSON.stringify(currentSequence) === JSON.stringify(expectedSequence)) {
          setPuzzleSolved(true);
          onSolvePuzzle('sequence');
        }
      }
    }
  };
  
  const handlePlatformBounce = (type) => {
    if (type === 'bouncy') {
      setVelocity(prev => [prev[0], 12, prev[2]]);
      setIsJumping(true);
    }
  };
  
  // Physics and collision detection
  useFrame((state, delta) => {
    if (!playerRef.current) return;
    
    const speed = 5;
    const gravity = -20;
    const maxVelocity = 10;
    
    // Update horizontal velocity
    let newVelX = velocity[0];
    if (isMovingLeft) {
      newVelX = -speed;
    } else if (isMovingRight) {
      newVelX = speed;
    } else {
      newVelX *= 0.85; // Friction
    }
    
    // Update vertical velocity (gravity)
    let newVelY = velocity[1] + gravity * delta;
    newVelY = Math.max(-maxVelocity, Math.min(maxVelocity, newVelY));
    
    // Update position
    const newPos = [
      playerPosition[0] + newVelX * delta,
      Math.max(0.5, playerPosition[1] + newVelY * delta),
      playerPosition[2] + velocity[2] * delta
    ];
    
    // Ground collision
    if (newPos[1] <= 0.5) {
      newPos[1] = 0.5;
      newVelY = 0;
      setIsJumping(false);
    }
    
    // Boundary limits
    newPos[0] = Math.max(-10, Math.min(10, newPos[0]));
    newPos[2] = Math.max(-5, Math.min(5, newPos[2]));
    
    // Platform collision detection
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(...newPos),
      new THREE.Vector3(0.8, 0.8, 0.8)
    );
    
    worldRef.current?.traverse((child) => {
      if (child.isMesh && child.userData.type === 'platform') {
        const platformBox = new THREE.Box3().setFromObject(child);
        
        if (playerBox.intersectsBox(platformBox)) {
          // Landing on top of platform
          if (velocity[1] < 0 && playerPosition[1] > child.position.y) {
            newPos[1] = child.position.y + 0.75;
            newVelY = 0;
            setIsJumping(false);
            
            if (child.userData.onContact) {
              child.userData.onContact();
            }
            
            if (child.userData.platformType === 'bouncy') {
              handlePlatformBounce('bouncy');
            }
          }
        }
      }
      
      // Star collection
      if (child.isMesh && child.userData.type === 'star') {
        const starBox = new THREE.Box3().setFromObject(child);
        if (playerBox.intersectsBox(starBox) && child.userData.onCollect) {
          child.userData.onCollect();
        }
      }
      
      // Puzzle block activation
      if (child.isMesh && child.userData.type === 'puzzleBlock') {
        const blockBox = new THREE.Box3().setFromObject(child);
        if (playerBox.intersectsBox(blockBox) && child.userData.onContact) {
          child.userData.onContact();
        }
      }
    });
    
    setVelocity([newVelX, newVelY, velocity[2]]);
    setPlayerPosition(newPos);
  });
  
  // Reset on level change
  useEffect(() => {
    setCollectedStars([]);
    setPuzzleSequence([]);
    setPuzzleSolved(false);
    setPlayerPosition([0, 0.5, 0]);
    setVelocity([0, 0, 0]);
  }, [level]);
  
  return (
    <group ref={worldRef}>
      <Player 
        ref={playerRef}
        position={playerPosition}
        isJumping={isJumping}
        velocity={velocity}
      />
      
      {platforms}
      {stars}
      {puzzleBlocks}
      
      {/* Decorative clouds */}
      <Cloud position={[5, 6, -3]} />
      <Cloud position={[-6, 7, -2]} />
      <Cloud position={[0, 8, -4]} />
      <Cloud position={[8, 5, 2]} />
      <Cloud position={[-8, 6, 1]} />
    </group>
  );
});

Game.displayName = 'Game';

export default Game;