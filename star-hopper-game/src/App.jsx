import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Sparkles } from '@react-three/drei';
import { Howl } from 'howler';
import './App.css';
import Game from './components/Game';
import WelcomeScreen from './components/WelcomeScreen';
import UIOverlay from './components/UIOverlay';
import Controls from './components/Controls';
import VictoryScreen from './components/VictoryScreen';
import PuzzleHint from './components/PuzzleHint';

// Initialize sounds
const sounds = {
  jump: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.3 
  }),
  collect: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.4,
    rate: 1.5
  }),
  victory: new Howl({ 
    src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'], 
    volume: 0.5,
    rate: 2
  })
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showVictory, setShowVictory] = useState(false);
  const [playerPosition, setPlayerPosition] = useState([0, 0.5, 0]);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [puzzleHint, setPuzzleHint] = useState('');
  const gameRef = useRef();

  const handleStartGame = () => {
    setGameStarted(true);
    setPuzzleHint('Collect all the stars! Jump on colored blocks to solve puzzles!');
    setTimeout(() => setPuzzleHint(''), 5000);
  };

  const handleJump = () => {
    if (gameRef.current) {
      gameRef.current.jump();
      sounds.jump.play();
    }
  };

  const handleCollectStar = () => {
    setScore(prev => prev + 1);
    sounds.collect.play();
    
    // Check if level complete
    if (score + 1 >= level * 5) {
      setShowVictory(true);
      sounds.victory.play();
    }
  };

  const handleNextLevel = () => {
    setLevel(prev => prev + 1);
    setShowVictory(false);
    setScore(0);
    setPlayerPosition([0, 0.5, 0]);
    
    // Show level-specific hints
    const hints = [
      'New challenge! Jump on the blue blocks in order!',
      'Red blocks disappear! Be quick!',
      'Green blocks are bouncy! Use them to reach high places!',
      'Yellow blocks move! Time your jumps carefully!',
      'Mix and match! Solve the rainbow puzzle!'
    ];
    setPuzzleHint(hints[Math.min(level - 1, hints.length - 1)]);
    setTimeout(() => setPuzzleHint(''), 5000);
  };

  const handleSolvedPuzzle = (puzzleType) => {
    const puzzleMessages = {
      color: 'Great job! You solved the color puzzle!',
      sequence: 'Amazing! You found the right order!',
      timing: 'Perfect timing! You did it!',
      height: 'Wow! You reached so high!'
    };
    setPuzzleHint(puzzleMessages[puzzleType] || 'Puzzle solved!');
    setTimeout(() => setPuzzleHint(''), 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsMovingLeft(true);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsMovingRight(true);
      }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        handleJump();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsMovingLeft(false);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsMovingRight(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="game-container">
      {!gameStarted ? (
        <WelcomeScreen onStart={handleStartGame} />
      ) : (
        <>
          <UIOverlay score={score} level={level} />
          {showVictory && <VictoryScreen level={level} onNextLevel={handleNextLevel} />}
          {puzzleHint && <PuzzleHint message={puzzleHint} />}
          
          <Canvas 
            camera={{ position: [0, 5, 10], fov: 60 }}
            shadows
          >
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1} 
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            <pointLight position={[-10, 10, -10]} intensity={0.5} />
            
            <Sparkles 
              count={100}
              scale={20}
              size={2}
              speed={0.5}
              color="#FFD700"
            />
            
            <Game
              ref={gameRef}
              level={level}
              onCollectStar={handleCollectStar}
              onSolvePuzzle={handleSolvedPuzzle}
              isMovingLeft={isMovingLeft}
              isMovingRight={isMovingRight}
              playerPosition={playerPosition}
              setPlayerPosition={setPlayerPosition}
            />
            
            <OrbitControls 
              enablePan={false}
              enableZoom={false}
              enableRotate={false}
              target={playerPosition}
            />
          </Canvas>
          
          <Controls 
            onMoveLeft={() => setIsMovingLeft(true)}
            onMoveRight={() => setIsMovingRight(true)}
            onStopLeft={() => setIsMovingLeft(false)}
            onStopRight={() => setIsMovingRight(false)}
            onJump={handleJump}
          />
        </>
      )}
    </div>
  );
}

export default App;