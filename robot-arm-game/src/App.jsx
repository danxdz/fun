import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import { Howl } from 'howler';
import './App.css';
import RobotArm from './components/RobotArm';
import Prize from './components/Prize';
import GameUI from './components/GameUI';
import GyroControls from './components/GyroControls';
import GameOver from './components/GameOver';

// Initialize sounds
const sounds = {
  grab: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.4 
  }),
  collect: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.5,
    rate: 2
  }),
  move: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.2,
    rate: 0.5
  })
};

function App() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [armRotation, setArmRotation] = useState({ x: 0, y: 0, z: 0 });
  const [clawOpen, setClawOpen] = useState(true);
  const [prizes, setPrizes] = useState([]);
  const [showCollected, setShowCollected] = useState(false);
  const [collectedPrize, setCollectedPrize] = useState(null);
  const [gyroPermission, setGyroPermission] = useState(false);
  const [gyroSupported, setGyroSupported] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const armRef = useRef();

  // Initialize prizes
  useEffect(() => {
    const initialPrizes = [];
    const prizeTypes = ['🎁', '🧸', '🎮', '🏀', '⚽', '🎨', '🎯', '🎪', '🎭', '🎸'];
    
    for (let i = 0; i < 10; i++) {
      initialPrizes.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 8,
          0.5,
          (Math.random() - 0.5) * 8
        ],
        type: prizeTypes[i],
        collected: false,
        points: Math.floor(Math.random() * 3 + 1) * 10
      });
    }
    setPrizes(initialPrizes);
  }, []);

  // Game timer
  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
    }
  }, [timeLeft, gameStarted, gameOver]);

  // Hide instructions after a few seconds
  useEffect(() => {
    if (gameStarted) {
      setTimeout(() => setShowInstructions(false), 5000);
    }
  }, [gameStarted]);

  const handleStartGame = () => {
    setGameStarted(true);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setShowInstructions(true);
  };

  const handleGrab = () => {
    if (!isGrabbing) {
      setIsGrabbing(true);
      setClawOpen(false);
      sounds.grab.play();
      
      // Check for prize collection
      if (armRef.current) {
        const armPos = armRef.current.getClawPosition();
        prizes.forEach(prize => {
          if (!prize.collected) {
            const distance = Math.sqrt(
              Math.pow(armPos[0] - prize.position[0], 2) +
              Math.pow(armPos[2] - prize.position[2], 2)
            );
            
            if (distance < 1.5) {
              // Collect the prize
              setPrizes(prev => prev.map(p => 
                p.id === prize.id ? { ...p, collected: true } : p
              ));
              setScore(prev => prev + prize.points);
              setCollectedPrize(prize);
              setShowCollected(true);
              sounds.collect.play();
              
              setTimeout(() => {
                setShowCollected(false);
                setCollectedPrize(null);
              }, 1000);
            }
          }
        });
      }
      
      // Release after 1 second
      setTimeout(() => {
        setIsGrabbing(false);
        setClawOpen(true);
      }, 1000);
    }
  };

  const handleGyroUpdate = (rotation) => {
    setArmRotation(rotation);
    if (Math.abs(rotation.x) > 5 || Math.abs(rotation.y) > 5) {
      sounds.move.play();
    }
  };

  const handleManualControl = (direction) => {
    const speed = 15;
    switch(direction) {
      case 'up':
        setArmRotation(prev => ({ ...prev, x: Math.min(prev.x + speed, 45) }));
        break;
      case 'down':
        setArmRotation(prev => ({ ...prev, x: Math.max(prev.x - speed, -45) }));
        break;
      case 'left':
        setArmRotation(prev => ({ ...prev, y: Math.min(prev.y + speed, 45) }));
        break;
      case 'right':
        setArmRotation(prev => ({ ...prev, y: Math.max(prev.y - speed, -45) }));
        break;
    }
    sounds.move.play();
  };

  const handlePlayAgain = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setTimeLeft(60);
    
    // Reset prizes
    setPrizes(prev => prev.map(p => ({ ...p, collected: false })));
  };

  return (
    <div className="game-container">
      {!gameStarted ? (
        <div className="permission-modal">
          <div className="permission-content">
            <h1 className="permission-title">🤖 Robot Arm Claw Game 🎮</h1>
            <p className="permission-text">
              Control the robot arm to grab prizes!<br/>
              Use your phone's gyroscope or on-screen controls.
            </p>
            <button className="permission-button" onClick={handleStartGame}>
              Start Game!
            </button>
          </div>
        </div>
      ) : (
        <>
          <GameUI score={score} timeLeft={timeLeft} />
          
          {showInstructions && (
            <div className="instructions">
              <h3>How to Play</h3>
              <p>📱 Tilt your phone to move the arm<br/>
              🎯 Press GRAB to catch prizes<br/>
              ⏰ Collect as many as you can!</p>
            </div>
          )}
          
          {showCollected && collectedPrize && (
            <div className="prize-collected">
              +{collectedPrize.points} {collectedPrize.type}
            </div>
          )}
          
          {gameOver && (
            <GameOver score={score} onPlayAgain={handlePlayAgain} />
          )}
          
          <Canvas 
            camera={{ position: [0, 8, 12], fov: 60 }}
            shadows
          >
            <Sky sunPosition={[100, 20, 100]} />
            <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />
            
            <ambientLight intensity={0.4} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1} 
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            <pointLight position={[-10, 10, -10]} intensity={0.5} />
            <spotLight
              position={[0, 10, 0]}
              angle={0.5}
              penumbra={0.5}
              intensity={0.5}
              castShadow
            />
            
            <RobotArm 
              ref={armRef}
              rotation={armRotation}
              clawOpen={clawOpen}
              isGrabbing={isGrabbing}
            />
            
            {/* Prizes */}
            {prizes.map(prize => (
              <Prize
                key={prize.id}
                position={prize.position}
                type={prize.type}
                collected={prize.collected}
                points={prize.points}
              />
            ))}
            
            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            
            {/* Game area boundaries */}
            <mesh position={[0, 0.5, -10]} castShadow>
              <boxGeometry args={[20, 2, 0.5]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[0, 0.5, 10]} castShadow>
              <boxGeometry args={[20, 2, 0.5]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[-10, 0.5, 0]} castShadow>
              <boxGeometry args={[0.5, 2, 20]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[10, 0.5, 0]} castShadow>
              <boxGeometry args={[0.5, 2, 20]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            
            <OrbitControls 
              enablePan={false}
              enableZoom={false}
              enableRotate={false}
            />
          </Canvas>
          
          <GyroControls 
            onGyroUpdate={handleGyroUpdate}
            onManualControl={handleManualControl}
            onGrab={handleGrab}
            isGrabbing={isGrabbing}
            gyroPermission={gyroPermission}
            setGyroPermission={setGyroPermission}
            gyroSupported={gyroSupported}
            setGyroSupported={setGyroSupported}
          />
        </>
      )}
    </div>
  );
}

export default App;