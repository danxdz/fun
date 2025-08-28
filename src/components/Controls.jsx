import React from 'react';

const Controls = ({ onMoveLeft, onMoveRight, onStopLeft, onStopRight, onJump }) => {
  const handleLeftStart = (e) => {
    e.preventDefault();
    onMoveLeft();
  };
  
  const handleLeftStop = (e) => {
    e.preventDefault();
    onStopLeft();
  };
  
  const handleRightStart = (e) => {
    e.preventDefault();
    onMoveRight();
  };
  
  const handleRightStop = (e) => {
    e.preventDefault();
    onStopRight();
  };
  
  const handleJump = (e) => {
    e.preventDefault();
    onJump();
  };
  
  return (
    <div className="controls">
      <button 
        className="control-btn"
        onTouchStart={handleLeftStart}
        onTouchEnd={handleLeftStop}
        onMouseDown={handleLeftStart}
        onMouseUp={handleLeftStop}
        onMouseLeave={handleLeftStop}
      >
        ←
      </button>
      <button 
        className="control-btn jump-btn"
        onTouchStart={handleJump}
        onMouseDown={handleJump}
      >
        ↑
      </button>
      <button 
        className="control-btn"
        onTouchStart={handleRightStart}
        onTouchEnd={handleRightStop}
        onMouseDown={handleRightStart}
        onMouseUp={handleRightStop}
        onMouseLeave={handleRightStop}
      >
        →
      </button>
    </div>
  );
};

export default Controls;