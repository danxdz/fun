import React from 'react';

const GameUI = ({ score, timeLeft, combo, showCombo }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      <div className="ui-overlay">
        <div className="score-display">
          <span>🏆</span>
          <span>{score}</span>
        </div>
        <div className={`timer-display ${timeLeft <= 10 ? 'urgent' : ''}`}>
          <span>⏱️ {formatTime(timeLeft)}</span>
        </div>
      </div>
      
      {showCombo && combo > 1 && (
        <div className="combo-display">
          🔥 Combo x{combo}!
        </div>
      )}
      
      {/* AR Crosshair */}
      <div className={`crosshair ${showCombo && combo > 0 ? 'catching' : ''}`} />
      
      {/* AR overlay effect */}
      <div className="ar-overlay" />
    </>
  );
};

export default GameUI;