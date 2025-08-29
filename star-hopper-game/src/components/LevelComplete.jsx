import React from 'react';

const LevelComplete = ({ level, score, timeBonus, heightBonus, onNextLevel, isLastLevel }) => {
  const totalScore = score + timeBonus + heightBonus;
  
  return (
    <div className="level-complete-screen">
      <div className="complete-content">
        <h1 className="complete-title">
          {score > 0 ? '🎉 Level Complete! 🎉' : '⏰ Time\'s Up! ⏰'}
        </h1>
        
        <h2 className="level-name">{level.name}</h2>
        
        <div className="score-breakdown">
          <div className="score-item">
            <span>Base Score:</span>
            <span>{score}</span>
          </div>
          <div className="score-item">
            <span>Time Bonus:</span>
            <span>+{timeBonus}</span>
          </div>
          <div className="score-item">
            <span>Height Bonus:</span>
            <span>+{heightBonus}</span>
          </div>
          <div className="score-item total">
            <span>Total:</span>
            <span>{totalScore}</span>
          </div>
        </div>
        
        <div className="stars">
          {[...Array(3)].map((_, i) => (
            <span 
              key={i} 
              className={`star ${totalScore > (i + 1) * 100 ? 'earned' : ''}`}
            >
              ⭐
            </span>
          ))}
        </div>
        
        <button className="next-button" onClick={onNextLevel}>
          {isLastLevel ? 'Finish Game 🏁' : 'Next Level →'}
        </button>
      </div>
    </div>
  );
};

export default LevelComplete;