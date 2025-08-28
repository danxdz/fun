import React from 'react';

const UIOverlay = ({ score, level }) => {
  return (
    <div className="ui-overlay">
      <div className="score-display">
        <span className="star-icon">⭐</span>
        <span>{score}</span>
      </div>
      <div className="level-display">
        Level {level}
      </div>
    </div>
  );
};

export default UIOverlay;