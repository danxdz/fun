import React from 'react';

const GameOver = ({ score, onPlayAgain }) => {
  const getRank = (score) => {
    if (score >= 200) return { rank: '🏆 Master Grabber!', color: '#FFD700' };
    if (score >= 150) return { rank: '🥈 Expert Operator!', color: '#C0C0C0' };
    if (score >= 100) return { rank: '🥉 Skilled Player!', color: '#CD7F32' };
    if (score >= 50) return { rank: '⭐ Good Try!', color: '#4169E1' };
    return { rank: '🎯 Keep Practicing!', color: '#32CD32' };
  };
  
  const { rank, color } = getRank(score);
  
  return (
    <div className="game-over-screen">
      <h1 className="game-over-title">Time's Up!</h1>
      <div className="final-score">
        Final Score: {score}
      </div>
      <div style={{ fontSize: 'clamp(20px, 4vw, 30px)', color, marginBottom: '20px' }}>
        {rank}
      </div>
      <button className="play-again-btn" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
};

export default GameOver;