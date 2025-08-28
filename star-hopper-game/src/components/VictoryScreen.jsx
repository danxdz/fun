import React from 'react';

const VictoryScreen = ({ level, onNextLevel }) => {
  return (
    <div className="victory-screen">
      <h2 className="victory-title">🎉 Level {level} Complete! 🎉</h2>
      <button className="next-level-btn" onClick={onNextLevel}>
        Next Level →
      </button>
    </div>
  );
};

export default VictoryScreen;