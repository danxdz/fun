import React from 'react';

const Controls = ({ onMoveLeft, onMoveRight, onStopLeft, onStopRight, onJump }) => {
  return (
    <div className="controls">
      <button 
        className="control-btn"
        onTouchStart={onMoveLeft}
        onTouchEnd={onStopLeft}
        onMouseDown={onMoveLeft}
        onMouseUp={onStopLeft}
        onMouseLeave={onStopLeft}
      >
        ←
      </button>
      <button 
        className="control-btn jump-btn"
        onTouchStart={onJump}
        onClick={onJump}
      >
        ↑
      </button>
      <button 
        className="control-btn"
        onTouchStart={onMoveRight}
        onTouchEnd={onStopRight}
        onMouseDown={onMoveRight}
        onMouseUp={onStopRight}
        onMouseLeave={onStopRight}
      >
        →
      </button>
    </div>
  );
};

export default Controls;