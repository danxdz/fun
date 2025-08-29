import React from 'react';

const StartScreen = ({ onStart, totalScore }) => {
  return (
    <div className="start-screen builder-start">
      <div className="start-content">
        <h1 className="game-title">🏗️ Block Builder Challenge 🎯</h1>
        <p className="game-subtitle">
          Use the robot arm to stack blocks and complete building challenges!
        </p>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <span>Control a precision robot arm</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🧱</span>
            <span>Stack blocks with physics</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏆</span>
            <span>Complete 5 unique challenges</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⏱️</span>
            <span>Race against time</span>
          </div>
        </div>
        
        {totalScore > 0 && (
          <div className="total-score">
            Total Score: {totalScore} 🌟
          </div>
        )}
        
        <button className="start-button" onClick={onStart}>
          Start Building! 🚀
        </button>
        
        <div className="controls-preview">
          <h3>How to Play:</h3>
          <p>🕹️ Use joystick to move the arm</p>
          <p>⬆️⬇️ Adjust height with arrows</p>
          <p>🔄 Rotate with spin buttons</p>
          <p>✋ Grab and release blocks</p>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;