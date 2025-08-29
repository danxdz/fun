import React from 'react';

const GameUI = ({ level, score, timeLeft, structureHeight, blocksUsed }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'creative': return '#9C27B0';
      default: return '#2196F3';
    }
  };
  
  return (
    <div className="game-ui-overlay">
      <div className="level-info">
        <h2>{level.name}</h2>
        <span className="difficulty" style={{ color: getDifficultyColor(level.difficulty) }}>
          {level.difficulty.toUpperCase()}
        </span>
      </div>
      
      <div className="stats-container">
        <div className="stat-box">
          <span className="stat-label">Score</span>
          <span className="stat-value">{score}</span>
        </div>
        
        <div className="stat-box">
          <span className="stat-label">Time</span>
          <span className={`stat-value ${timeLeft < 30 ? 'urgent' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        
        <div className="stat-box">
          <span className="stat-label">Height</span>
          <span className="stat-value">
            {structureHeight}/{level.targetHeight || '∞'}
          </span>
        </div>
        
        <div className="stat-box">
          <span className="stat-label">Blocks</span>
          <span className="stat-value">
            {blocksUsed}/{level.blockCount}
          </span>
        </div>
      </div>
      
      {level.targetHeight > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${Math.min(100, (structureHeight / level.targetHeight) * 100)}%`,
              backgroundColor: structureHeight >= level.targetHeight ? '#4CAF50' : '#2196F3'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GameUI;