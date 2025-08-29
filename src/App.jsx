import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import { Howl } from 'howler';
import './App.css';
import RobotArm from './components/RobotArm';
import Block from './components/Block';
import BuildingArea from './components/BuildingArea';
import GameUI from './components/GameUI';
import StartScreen from './components/StartScreen';
import LevelComplete from './components/LevelComplete';
import TouchControls from './components/TouchControls';

// Initialize sounds
const sounds = {
  grab: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.4 
  }),
  place: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.5,
    rate: 1.5
  }),
  success: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.6,
    rate: 2
  }),
  crash: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.4,
    rate: 0.5
  })
};

// Level configurations
const LEVELS = [
  {
    id: 1,
    name: "Stack Tower",
    description: "Stack 5 blocks as high as you can!",
    targetHeight: 5,
    blockCount: 8,
    timeLimit: 60,
    blueprint: "tower",
    difficulty: "easy"
  },
  {
    id: 2,
    name: "Build a Bridge",
    description: "Connect the two platforms",
    targetHeight: 3,
    blockCount: 10,
    timeLimit: 90,
    blueprint: "bridge",
    difficulty: "medium"
  },
  {
    id: 3,
    name: "Pyramid Challenge",
    description: "Build a pyramid with 3 levels",
    targetHeight: 3,
    blockCount: 12,
    timeLimit: 120,
    blueprint: "pyramid",
    difficulty: "hard"
  },
  {
    id: 4,
    name: "Castle Wall",
    description: "Build a defensive wall",
    targetHeight: 4,
    blockCount: 15,
    timeLimit: 150,
    blueprint: "wall",
    difficulty: "hard"
  },
  {
    id: 5,
    name: "Free Build",
    description: "Build anything you want!",
    targetHeight: 0,
    blockCount: 20,
    timeLimit: 180,
    blueprint: "free",
    difficulty: "creative"
  }
];

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [blocks, setBlocks] = useState([]);
  const [grabbedBlock, setGrabbedBlock] = useState(null);
  const [armTargetPosition, setArmTargetPosition] = useState({ x: 0, y: 5, z: 5 });
  const [clawOpen, setClawOpen] = useState(true);
  const [placedBlocks, setPlacedBlocks] = useState([]);
  const [levelComplete, setLevelComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [structureHeight, setStructureHeight] = useState(0);
  const [stabilityBonus, setStabilityBonus] = useState(0);
  
  const armRef = useRef();
  const physicsRef = useRef();

  // Initialize level
  useEffect(() => {
    if (gameStarted && !levelComplete) {
      const level = LEVELS[currentLevel];
      setTimeLeft(level.timeLimit);
      
      // Generate blocks for the level
      const newBlocks = [];
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
      
      for (let i = 0; i < level.blockCount; i++) {
        newBlocks.push({
          id: `block-${i}`,
          position: [
            -8 + (i % 4) * 2,
            0.5,
            -4 + Math.floor(i / 4) * 2
          ],
          color: colors[i % colors.length],
          size: [1, 1, 1],
          grabbed: false,
          placed: false
        });
      }
      setBlocks(newBlocks);
      setPlacedBlocks([]);
      setShowInstructions(true);
      setTimeout(() => setShowInstructions(false), 5000);
    }
  }, [gameStarted, currentLevel, levelComplete]);

  // Game timer
  useEffect(() => {
    if (gameStarted && !levelComplete && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !levelComplete) {
      handleLevelEnd();
    }
  }, [timeLeft, gameStarted, levelComplete]);

  // Check structure height
  useEffect(() => {
    if (placedBlocks.length > 0) {
      const maxHeight = Math.max(...placedBlocks.map(b => b.position[1]));
      setStructureHeight(Math.ceil(maxHeight));
      
      // Check if level complete
      const level = LEVELS[currentLevel];
      if (level.targetHeight > 0 && structureHeight >= level.targetHeight) {
        handleLevelComplete();
      }
    }
  }, [placedBlocks, structureHeight, currentLevel]);

  const handleStartGame = () => {
    setGameStarted(true);
    setCurrentLevel(0);
    setScore(0);
    setTotalScore(0);
  };

  const handleArmMove = (direction, value) => {
    setArmTargetPosition(prev => {
      const newPos = { ...prev };
      switch(direction) {
        case 'x':
          newPos.x = Math.max(-10, Math.min(10, prev.x + value));
          break;
        case 'y':
          newPos.y = Math.max(0.5, Math.min(12, prev.y + value));
          break;
        case 'z':
          newPos.z = Math.max(0.5, Math.min(10, prev.z + value));
          break;
      }
      return newPos;
    });
  };

  const handleGrab = () => {
    if (clawOpen) {
      // Try to grab a block
      const nearbyBlock = blocks.find(block => {
        if (block.grabbed || block.placed) return false;
        const distance = Math.sqrt(
          Math.pow(block.position[0] - armTargetPosition.x, 2) +
          Math.pow(block.position[1] - armTargetPosition.y, 2) +
          Math.pow(block.position[2] - armTargetPosition.z, 2)
        );
        return distance < 2;
      });
      
      if (nearbyBlock) {
        setGrabbedBlock(nearbyBlock.id);
        setBlocks(prev => prev.map(b => 
          b.id === nearbyBlock.id ? { ...b, grabbed: true } : b
        ));
        setClawOpen(false);
        sounds.grab.play();
      }
    } else {
      // Release the block
      if (grabbedBlock) {
        const block = blocks.find(b => b.id === grabbedBlock);
        if (block) {
          // Place the block at current arm position
          const placedBlock = {
            ...block,
            position: [armTargetPosition.x, armTargetPosition.y - 1, armTargetPosition.z],
            placed: true,
            grabbed: false
          };
          
          setPlacedBlocks(prev => [...prev, placedBlock]);
          setBlocks(prev => prev.map(b => 
            b.id === grabbedBlock ? placedBlock : b
          ));
          
          // Calculate score based on placement precision
          const placementScore = calculatePlacementScore(placedBlock);
          setScore(prev => prev + placementScore);
          
          sounds.place.play();
        }
        setGrabbedBlock(null);
        setClawOpen(true);
      }
    }
  };

  const calculatePlacementScore = (block) => {
    let score = 10; // Base score for placing a block
    
    // Bonus for height
    score += Math.floor(block.position[1]) * 5;
    
    // Bonus for stability (blocks placed near other blocks)
    const nearbyBlocks = placedBlocks.filter(b => {
      const distance = Math.sqrt(
        Math.pow(b.position[0] - block.position[0], 2) +
        Math.pow(b.position[2] - block.position[2], 2)
      );
      return distance < 2;
    });
    score += nearbyBlocks.length * 10;
    
    return score;
  };

  const handleLevelComplete = () => {
    setLevelComplete(true);
    
    // Calculate bonuses
    const timeBonus = timeLeft * 2;
    const heightBonus = structureHeight * 20;
    const stabilityScore = placedBlocks.length * 10;
    
    const levelScore = score + timeBonus + heightBonus + stabilityScore;
    setTotalScore(prev => prev + levelScore);
    
    sounds.success.play();
  };

  const handleLevelEnd = () => {
    if (structureHeight < LEVELS[currentLevel].targetHeight) {
      // Level failed
      setLevelComplete(true);
    } else {
      handleLevelComplete();
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(prev => prev + 1);
      setLevelComplete(false);
      setScore(0);
      setStructureHeight(0);
    } else {
      // Game complete
      setGameStarted(false);
    }
  };

  const handleBlockFall = (blockId) => {
    // Handle physics when blocks fall
    sounds.crash.play();
    setScore(prev => Math.max(0, prev - 5)); // Penalty for unstable structure
  };

  return (
    <div className="game-container">
      {!gameStarted ? (
        <StartScreen 
          onStart={handleStartGame}
          totalScore={totalScore}
        />
      ) : (
        <>
          <GameUI 
            level={LEVELS[currentLevel]}
            score={score}
            timeLeft={timeLeft}
            structureHeight={structureHeight}
            blocksUsed={placedBlocks.length}
          />
          
          {showInstructions && (
            <div className="instructions building-instructions">
              <h3>{LEVELS[currentLevel].name}</h3>
              <p>{LEVELS[currentLevel].description}</p>
              <p>🎯 Target Height: {LEVELS[currentLevel].targetHeight} blocks</p>
            </div>
          )}
          
          {levelComplete && (
            <LevelComplete
              level={LEVELS[currentLevel]}
              score={score}
              timeBonus={timeLeft * 2}
              heightBonus={structureHeight * 20}
              onNextLevel={handleNextLevel}
              isLastLevel={currentLevel === LEVELS.length - 1}
            />
          )}
          
          <Canvas 
            camera={{ position: [15, 12, 15], fov: 50 }}
            shadows
          >
            <Sky sunPosition={[100, 20, 100]} />
            <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />
            
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[10, 15, 5]} 
              intensity={1} 
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            <pointLight position={[-10, 10, -10]} intensity={0.3} />
            
            <Physics gravity={[0, -9.8, 0]} ref={physicsRef}>
              <RobotArm 
                ref={armRef}
                targetPosition={armTargetPosition}
                clawOpen={clawOpen}
                hasBlock={!!grabbedBlock}
              />
              
              {blocks.map(block => (
                <Block
                  key={block.id}
                  {...block}
                  isGrabbed={block.id === grabbedBlock}
                  armPosition={armTargetPosition}
                  onFall={() => handleBlockFall(block.id)}
                />
              ))}
              
              <BuildingArea 
                level={LEVELS[currentLevel]}
                placedBlocks={placedBlocks}
              />
            </Physics>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={30}
              maxPolarAngle={Math.PI / 2}
            />
          </Canvas>
          
          <TouchControls 
            onMove={handleArmMove}
            onGrab={handleGrab}
            clawOpen={clawOpen}
            armPosition={armTargetPosition}
          />
        </>
      )}
    </div>
  );
}

export default App;