import React from 'react';

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="welcome-screen">
      <h1 className="game-title">⭐ Star Hopper Adventures ⭐</h1>
      <p className="game-subtitle">Help the bunny collect all the stars!</p>
      <button className="play-button" onClick={onStart}>
        Let's Play! 🎮
      </button>
    </div>
  );
};

export default WelcomeScreen;