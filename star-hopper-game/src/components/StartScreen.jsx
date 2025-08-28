import React from 'react';

const StartScreen = ({ onStart, gyroPermission, setGyroPermission }) => {
  const handleStart = async () => {
    // Request gyro permission if needed (iOS 13+)
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        setGyroPermission(response === 'granted');
      } catch (error) {
        console.error('Gyro permission error:', error);
        setGyroPermission(false);
      }
    } else {
      setGyroPermission(true);
    }
    
    onStart();
  };
  
  return (
    <div className="start-screen">
      <h1 className="game-title">🎯 AR Catcher 🌟</h1>
      <p className="game-subtitle">
        Move your phone to catch flying objects!
      </p>
      
      <button className="start-button" onClick={handleStart}>
        Start Game 🚀
      </button>
      
      <div className="permission-notice">
        <p>📱 This game uses your phone's gyroscope</p>
        <p>🎮 Move your phone like a window to look around</p>
        <p>🎯 Align objects with the circle to catch them</p>
        <p>🔥 Build combos for bonus points!</p>
      </div>
    </div>
  );
};

export default StartScreen;