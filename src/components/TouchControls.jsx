import React, { useState, useRef, useEffect } from 'react';

const TouchControls = ({ onMove, onGrab, armPosition }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastTwoFingerY, setLastTwoFingerY] = useState(0);
  const [currentPos, setCurrentPos] = useState({ 
    baseRotation: 0,
    x: 0, 
    y: 4, 
    z: 3 
  });
  
  const containerRef = useRef();
  
  // Handle single finger swipe for base rotation (left/right) and forward/back (up/down)
  const handleSingleFingerMove = (deltaX, deltaY) => {
    const newPos = { ...currentPos };
    
    // Left/Right swipe = base rotation
    newPos.baseRotation += deltaX * 0.02;
    
    // Up/Down swipe = forward/back movement (in the direction the arm is facing)
    const forwardDelta = -deltaY * 0.05;
    newPos.x = currentPos.x + Math.sin(newPos.baseRotation) * forwardDelta;
    newPos.z = currentPos.z + Math.cos(newPos.baseRotation) * forwardDelta;
    
    // Clamp positions
    const horizontalDist = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
    if (horizontalDist > 10) {
      const scale = 10 / horizontalDist;
      newPos.x *= scale;
      newPos.z *= scale;
    }
    
    setCurrentPos(newPos);
    onMove(newPos);
  };
  
  // Handle two finger pinch/slide for vertical movement
  const handleTwoFingerMove = (deltaY) => {
    const newPos = { ...currentPos };
    
    // Two finger up/down = vertical Z movement
    newPos.y = Math.max(1, Math.min(10, currentPos.y - deltaY * 0.05));
    
    setCurrentPos(newPos);
    onMove(newPos);
  };
  
  // Touch start
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touches = e.touches;
    setTouchCount(touches.length);
    
    if (touches.length === 1) {
      setIsDragging(true);
      setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2) {
      // Two finger touch - track Y position
      const avgY = (touches[0].clientY + touches[1].clientY) / 2;
      setLastTwoFingerY(avgY);
      setIsDragging(true);
    }
  };
  
  // Touch move
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    
    const touches = e.touches;
    
    if (touches.length === 1 && touchCount === 1) {
      // Single finger swipe
      const deltaX = touches[0].clientX - lastTouch.x;
      const deltaY = touches[0].clientY - lastTouch.y;
      
      handleSingleFingerMove(deltaX, deltaY);
      
      setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2) {
      // Two finger gesture
      const avgY = (touches[0].clientY + touches[1].clientY) / 2;
      const deltaY = avgY - lastTwoFingerY;
      
      handleTwoFingerMove(deltaY);
      
      setLastTwoFingerY(avgY);
    }
  };
  
  // Touch end
  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      setIsDragging(false);
      setTouchCount(0);
    } else {
      setTouchCount(e.touches.length);
    }
  };
  
  // Mouse controls for desktop testing
  const handleMouseDown = (e) => {
    if (e.shiftKey) {
      // Shift+drag simulates two finger gesture
      setTouchCount(2);
      setLastTwoFingerY(e.clientY);
    } else {
      setTouchCount(1);
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
    setIsDragging(true);
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    if (e.shiftKey) {
      // Simulate two finger vertical movement
      const deltaY = e.clientY - lastTwoFingerY;
      handleTwoFingerMove(deltaY);
      setLastTwoFingerY(e.clientY);
    } else if (touchCount === 1) {
      // Single finger movement
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      handleSingleFingerMove(deltaX, deltaY);
      
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setTouchCount(0);
  };
  
  // Sync with external position changes
  useEffect(() => {
    if (armPosition && typeof armPosition === 'object') {
      setCurrentPos(prev => ({
        ...prev,
        x: armPosition.x || prev.x,
        y: armPosition.y || prev.y,
        z: armPosition.z || prev.z,
        baseRotation: armPosition.baseRotation || prev.baseRotation
      }));
    }
  }, [armPosition]);
  
  return (
    <div className="touch-controls">
      {/* Main gesture area */}
      <div 
        ref={containerRef}
        className="gesture-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="gesture-hints">
          <div className="hint-row">
            <span className="gesture-icon">👆</span>
            <span>Swipe left/right: Rotate base</span>
          </div>
          <div className="hint-row">
            <span className="gesture-icon">👆</span>
            <span>Swipe up/down: Forward/back</span>
          </div>
          <div className="hint-row">
            <span className="gesture-icon">✌️</span>
            <span>Two fingers up/down: Height</span>
          </div>
          {touchCount === 2 && <div className="active-gesture">Two finger mode</div>}
        </div>
        
        {/* Position indicator */}
        <div className="position-indicator">
          Rotation: {(currentPos.baseRotation * 180 / Math.PI).toFixed(0)}° | 
          Height: {currentPos.y.toFixed(1)} | 
          Reach: {Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z).toFixed(1)}
        </div>
      </div>
      
      {/* Grab/Release button */}
      <button 
        className="grab-button"
        onClick={onGrab}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onGrab();
        }}
      >
        {armPosition?.clawOpen ? '✊ Grab' : '✋ Release'}
      </button>
    </div>
  );
};

export default TouchControls;