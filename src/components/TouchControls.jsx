import React, { useState, useRef, useEffect } from 'react';

const TouchControls = ({ onMove, onGrab, armPosition }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: armPosition.x, y: armPosition.y, z: armPosition.z });
  const containerRef = useRef();
  const lastTouchRef = useRef({ x: 0, y: 0 });
  
  // Handle touch/mouse start for gesture control
  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
    lastTouchRef.current = { x: clientX, y: clientY };
  };
  
  // Handle touch/mouse move for gesture control
  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    
    const deltaX = (clientX - lastTouchRef.current.x) * 0.05;
    const deltaY = -(clientY - lastTouchRef.current.y) * 0.05;
    
    // Update arm position based on gesture
    const newPos = {
      x: currentPos.x + deltaX,
      y: currentPos.y + deltaY,
      z: currentPos.z
    };
    
    // Clamp to valid range
    newPos.x = Math.max(-10, Math.min(10, newPos.x));
    newPos.y = Math.max(0.5, Math.min(12, newPos.y));
    
    setCurrentPos(newPos);
    onMove(newPos);
    
    lastTouchRef.current = { x: clientX, y: clientY };
  };
  
  // Handle touch/mouse end
  const handleEnd = () => {
    setIsDragging(false);
  };
  
  // Handle Z-axis movement (forward/backward)
  const handleZMove = (direction) => {
    const newPos = {
      ...currentPos,
      z: Math.max(0.5, Math.min(10, currentPos.z + direction * 0.5))
    };
    setCurrentPos(newPos);
    onMove(newPos);
  };
  
  // Sync with external position changes
  useEffect(() => {
    setCurrentPos({ x: armPosition.x, y: armPosition.y, z: armPosition.z });
  }, [armPosition]);
  
  return (
    <div className="touch-controls">
      {/* Main gesture area for X/Y movement */}
      <div 
        ref={containerRef}
        className="gesture-area"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleEnd();
        }}
      >
        <div className="gesture-hint">
          {isDragging ? '✋ Moving...' : '👆 Swipe to move arm X/Y'}
        </div>
        
        {/* Position indicator */}
        <div className="position-indicator">
          X: {currentPos.x.toFixed(1)} | Y: {currentPos.y.toFixed(1)} | Z: {currentPos.z.toFixed(1)}
        </div>
      </div>
      
      {/* Z-axis controls (forward/backward) */}
      <div className="z-controls">
        <button 
          className="control-btn z-forward"
          onClick={() => handleZMove(1)}
          onTouchStart={(e) => {
            e.preventDefault();
            handleZMove(1);
          }}
        >
          ↑ Forward
        </button>
        <button 
          className="control-btn z-backward"
          onClick={() => handleZMove(-1)}
          onTouchStart={(e) => {
            e.preventDefault();
            handleZMove(-1);
          }}
        >
          ↓ Back
        </button>
      </div>
      
      {/* Grab/Release button */}
      <button 
        className="grab-button"
        onClick={onGrab}
        onTouchStart={(e) => {
          e.preventDefault();
          onGrab();
        }}
      >
        {armPosition.clawOpen ? '✊ Grab' : '✋ Release'}
      </button>
    </div>
  );
};

export default TouchControls;