import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Howl } from 'howler';
import './App.css';
import FlyingObject from './components/FlyingObject';
import Catcher from './components/Catcher';
import GameUI from './components/GameUI';
import GyroCamera from './components/GyroCamera';
import GameOver from './components/GameOver';
import StartScreen from './components/StartScreen';
import ARBackground from './components/ARBackground';

// Initialize sounds
const sounds = {
  catch: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.5,
    rate: 2
  }),
  miss: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.3,
    rate: 0.5
  }),
  whoosh: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.2,
    rate: 0.8
  })
};

function App() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [flyingObjects, setFlyingObjects] = useState([]);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });
  const [gyroPermission, setGyroPermission] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [catcherGlow, setCatcherGlow] = useState(false);
  
  const nextObjectId = useRef(0);
  const spawnTimer = useRef(null);

  // Spawn flying objects
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const spawnObject = () => {
        const types = ['⭐', '🎈', '🎁', '💎', '🍎', '🍊', '🍓', '🌟', '🏀', '⚽'];
        const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32', '#FF8C00', '#9370DB', '#FF1493', '#4169E1', '#FFB6C1'];
        
        // Spawn from random positions around the player
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 10;
        const height = Math.random() * 10 - 5;
        
        const newObject = {
          id: nextObjectId.current++,
          position: [
            Math.cos(angle) * distance,
            height,
            Math.sin(angle) * distance
          ],
          type: types[Math.floor(Math.random() * types.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          points: Math.floor(Math.random() * 3 + 1) * 10,
          speed: 3 + Math.random() * 2,
          caught: false
        };
        
        setFlyingObjects(prev => [...prev, newObject]);
        sounds.whoosh.play();
      };
      
      // Spawn objects at intervals
      spawnTimer.current = setInterval(spawnObject, 2000);
      
      return () => {
        if (spawnTimer.current) clearInterval(spawnTimer.current);
      };
    }
  }, [gameStarted, gameOver]);

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

  // Hide instructions
  useEffect(() => {
    if (gameStarted && showInstructions) {
      setTimeout(() => setShowInstructions(false), 5000);
    }
  }, [gameStarted, showInstructions]);

  const handleStartGame = () => {
    setGameStarted(true);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setFlyingObjects([]);
    setCombo(0);
    setShowInstructions(true);
  };

  const handleCatch = (objectId) => {
    const object = flyingObjects.find(o => o.id === objectId);
    if (object && !object.caught) {
      // Mark as caught
      setFlyingObjects(prev => prev.map(o => 
        o.id === objectId ? { ...o, caught: true } : o
      ));
      
      // Update score with combo multiplier
      const comboMultiplier = Math.min(combo + 1, 5);
      const points = object.points * comboMultiplier;
      setScore(prev => prev + points);
      
      // Update combo
      setCombo(prev => prev + 1);
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 1000);
      
      // Visual feedback
      setCatcherGlow(true);
      setTimeout(() => setCatcherGlow(false), 300);
      
      sounds.catch.play();
    }
  };

  const handleMiss = (objectId) => {
    // Reset combo on miss
    if (combo > 0) {
      setCombo(0);
      sounds.miss.play();
    }
    
    // Remove missed object
    setFlyingObjects(prev => prev.filter(o => o.id !== objectId));
  };

  const handleGyroUpdate = (rotation) => {
    setCameraRotation(rotation);
  };

  const handlePlayAgain = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setTimeLeft(60);
    setFlyingObjects([]);
    setCombo(0);
  };

  return (
    <div className="game-container ar-mode">
      {!gameStarted ? (
        <StartScreen 
          onStart={handleStartGame}
          gyroPermission={gyroPermission}
          setGyroPermission={setGyroPermission}
        />
      ) : (
        <>
          <GameUI 
            score={score} 
            timeLeft={timeLeft} 
            combo={combo}
            showCombo={showCombo}
          />
          
          {showInstructions && (
            <div className="instructions ar-instructions">
              <h3>🎯 Catch 'Em All!</h3>
              <p>📱 Move your phone to look around<br/>
              🎯 Align objects with the circle to catch<br/>
              🔥 Build combos for more points!</p>
            </div>
          )}
          
          {gameOver && (
            <GameOver score={score} onPlayAgain={handlePlayAgain} />
          )}
          
          <Canvas 
            camera={{ position: [0, 0, 0], fov: 75 }}
            className="ar-canvas"
          >
            <ARBackground />
            
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <pointLight position={[0, 0, 0]} intensity={0.5} />
            
            <GyroCamera 
              onGyroUpdate={handleGyroUpdate}
              gyroPermission={gyroPermission}
              setGyroPermission={setGyroPermission}
            />
            
            <Catcher 
              glowing={catcherGlow}
              combo={combo}
            />
            
            {flyingObjects.map(object => (
              <FlyingObject
                key={object.id}
                {...object}
                onCatch={() => handleCatch(object.id)}
                onMiss={() => handleMiss(object.id)}
                cameraRotation={cameraRotation}
              />
            ))}
          </Canvas>
        </>
      )}
    </div>
  );
}

export default App;