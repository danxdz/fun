import React, { useState, useRef } from 'react';

const TouchControls = ({ onMove, onGrab, clawOpen, armPosition }) => {
  const [activeControl, setActiveControl] = useState(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const intervalRef = useRef(null);
  
  const handleTouchStart = (direction, value) => {
    setActiveControl(direction);
    touchStartRef.current = { x: 0, y: 0 };
    
    // Start continuous movement with appropriate speed
    const moveSpeed = direction === 'y' ? value : value;
    intervalRef.current = setInterval(() => {
      onMove(direction, moveSpeed);
    }, 50);
  };
  
  const handleTouchEnd = () => {
    setActiveControl(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  const handleJoystickStart = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    touchStartRef.current = {
      x: touch.clientX - rect.left - rect.width / 2,
      y: touch.clientY - rect.top - rect.height / 2
    };
    setActiveControl('joystick');
  };
  
  const handleJoystickMove = (e) => {
    if (activeControl !== 'joystick') return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (touch.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (touch.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    
    // Move arm based on joystick position with dead zone
    if (Math.abs(x) > 0.1) onMove('x', x * 0.4);
    if (Math.abs(y) > 0.1) onMove('z', -y * 0.4); // Negative for intuitive movement
  };
  
  const handleJoystickEnd = () => {
    setActiveControl(null);
  };
  
  return (
    <div className="touch-controls">
      {/* Position display */}
      <div className="arm-position-display">
        <div>X: {armPosition.x.toFixed(1)}</div>
        <div>Y: {armPosition.y.toFixed(1)}</div>
        <div>Z: {armPosition.z.toFixed(1)}</div>
      </div>
      
      {/* Joystick for X/Z movement */}
      <div className="joystick-container">
        <div 
          className="joystick"
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            touchStartRef.current = {
              x: e.clientX - rect.left - rect.width / 2,
              y: e.clientY - rect.top - rect.height / 2
            };
            setActiveControl('joystick');
          }}
          onMouseMove={(e) => {
            if (activeControl !== 'joystick') return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
            if (Math.abs(x) > 0.1) onMove('x', x * 0.4);
            if (Math.abs(y) > 0.1) onMove('z', -y * 0.4);
          }}
          onMouseUp={handleJoystickEnd}
          onMouseLeave={handleJoystickEnd}
        >
          <div className="joystick-knob" />
          <div className="joystick-label">Move</div>
        </div>
      </div>
      
      {/* Height controls */}
      <div className="height-controls">
        <button
          className={`control-btn height-btn ${activeControl === 'up' ? 'active' : ''}`}
          onTouchStart={() => handleTouchStart('y', 0.3)}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleTouchStart('y', 0.3)}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          ↑
        </button>
        <div className="height-label">Height</div>
        <button
          className={`control-btn height-btn ${activeControl === 'down' ? 'active' : ''}`}
          onTouchStart={() => handleTouchStart('y', -0.3)}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleTouchStart('y', -0.3)}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          ↓
        </button>
      </div>
      
      {/* Precision controls */}
      <div className="precision-controls">
        <div className="precision-label">Precision</div>
        <button
          className="precision-btn"
          onClick={() => {
            // Toggle precision mode (slower movement)
          }}
        >
          🎯
        </button>
      </div>
      
      {/* Grab button */}
      <button
        className={`grab-button ${!clawOpen ? 'grabbing' : ''}`}
        onClick={onGrab}
        onTouchStart={(e) => { e.preventDefault(); onGrab(); }}
      >
        {clawOpen ? '✋' : '✊'}
        <span>{clawOpen ? 'GRAB' : 'RELEASE'}</span>
      </button>
    </div>
  );
};

export default TouchControls;