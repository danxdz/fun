import React from 'react';

const GameUI = ({ score, timeLeft }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="ui-overlay">
      <div className="score-display">
        <span>🏆</span>
        <span>Score: {score}</span>
      </div>
      <div className={`timer-display ${timeLeft <= 10 ? 'urgent' : ''}`}>
        <span>⏱️ {formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};

export default GameUI;