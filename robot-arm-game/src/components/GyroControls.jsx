import React, { useEffect, useState } from 'react';

const GyroControls = ({ 
  onGyroUpdate, 
  onManualControl, 
  onGrab, 
  isGrabbing,
  gyroPermission,
  setGyroPermission,
  gyroSupported,
  setGyroSupported
}) => {
  const [gyroValues, setGyroValues] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [useGyro, setUseGyro] = useState(false);
  
  useEffect(() => {
    // Check if gyroscope is available
    if (window.DeviceOrientationEvent) {
      setGyroSupported(true);
      
      // Check if permission is needed (iOS 13+)
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires permission
        setGyroPermission(false);
      } else {
        // Android and older iOS
        setGyroPermission(true);
        setupGyroscope();
      }
    } else {
      setGyroSupported(false);
    }
  }, []);
  
  const requestGyroPermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setGyroPermission(true);
          setupGyroscope();
          setUseGyro(true);
        }
      } catch (error) {
        console.error('Error requesting gyroscope permission:', error);
        setGyroPermission(false);
      }
    }
  };
  
  const setupGyroscope = () => {
    const handleOrientation = (event) => {
      const { alpha, beta, gamma } = event;
      
      // Convert gyroscope values to arm rotation
      // Beta: front-to-back tilt (-180 to 180)
      // Gamma: left-to-right tilt (-90 to 90)
      const rotation = {
        x: Math.max(-45, Math.min(45, beta - 45)), // Adjust for comfortable holding angle
        y: Math.max(-45, Math.min(45, gamma)),
        z: 0
      };
      
      setGyroValues({ alpha, beta, gamma });
      onGyroUpdate(rotation);
    };
    
    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  };
  
  return (
    <div className="controls-panel">
      {/* Grab button */}
      <button 
        className={`grab-button ${isGrabbing ? 'grabbing' : ''}`}
        onTouchStart={(e) => { e.preventDefault(); onGrab(); }}
        onMouseDown={(e) => { e.preventDefault(); onGrab(); }}
        disabled={isGrabbing}
      >
        {isGrabbing ? '✊' : '✋'}<br/>
        GRAB
      </button>
      
      {/* Gyro indicator */}
      {gyroSupported && useGyro && (
        <div className="gyro-indicator">
          <div className="gyro-value">
            <span>Tilt X:</span>
            <div className="gyro-bar">
              <div 
                className="gyro-fill" 
                style={{ 
                  width: `${Math.abs(gyroValues.beta - 45) * 2}%`,
                  left: gyroValues.beta > 45 ? '50%' : 'auto',
                  right: gyroValues.beta <= 45 ? '50%' : 'auto'
                }}
              />
            </div>
          </div>
          <div className="gyro-value">
            <span>Tilt Y:</span>
            <div className="gyro-bar">
              <div 
                className="gyro-fill" 
                style={{ 
                  width: `${Math.abs(gyroValues.gamma) * 2}%`,
                  left: gyroValues.gamma > 0 ? '50%' : 'auto',
                  right: gyroValues.gamma <= 0 ? '50%' : 'auto'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Permission request button for iOS */}
      {gyroSupported && !gyroPermission && (
        <button 
          className="permission-button"
          onClick={requestGyroPermission}
          style={{ 
            padding: '10px 20px', 
            fontSize: '14px',
            marginTop: '10px'
          }}
        >
          Enable Gyro Controls 📱
        </button>
      )}
      
      {/* Fallback controls */}
      {(!gyroSupported || !useGyro) && (
        <>
          <div className="fallback-controls">
            <button 
              className="control-btn"
              onTouchStart={(e) => { e.preventDefault(); onManualControl('left'); }}
              onMouseDown={(e) => { e.preventDefault(); onManualControl('left'); }}
            >
              ←
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="control-btn"
                onTouchStart={(e) => { e.preventDefault(); onManualControl('up'); }}
                onMouseDown={(e) => { e.preventDefault(); onManualControl('up'); }}
              >
                ↑
              </button>
              <button 
                className="control-btn"
                onTouchStart={(e) => { e.preventDefault(); onManualControl('down'); }}
                onMouseDown={(e) => { e.preventDefault(); onManualControl('down'); }}
              >
                ↓
              </button>
            </div>
            <button 
              className="control-btn"
              onTouchStart={(e) => { e.preventDefault(); onManualControl('right'); }}
              onMouseDown={(e) => { e.preventDefault(); onManualControl('right'); }}
            >
              →
            </button>
          </div>
          
          {gyroSupported && (
            <button
              style={{ 
                marginTop: '10px',
                padding: '8px 16px',
                fontSize: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
              onClick={() => {
                requestGyroPermission();
                setUseGyro(true);
              }}
            >
              Switch to Gyro 📱
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default GyroControls;