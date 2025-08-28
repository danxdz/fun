import React, { useState, useEffect } from 'react';

const CalibrationScreen = ({ onComplete, setGyroPermission }) => {
  const [sensitivity, setSensitivity] = useState(1.2); // Slightly lower default for smoother movement
  const [smoothing, setSmoothing] = useState('medium');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [baseOrientation, setBaseOrientation] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testRotation, setTestRotation] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    // Request gyro permission on mount
    requestGyroPermission();
  }, []);
  
  const requestGyroPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        setGyroPermission(response === 'granted');
      } catch (error) {
        console.error('Gyro permission error:', error);
        setGyroPermission(false);
      }
    } else {
      setGyroPermission(true);
    }
  };
  
  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationStep(1);
    
    // Capture current orientation as baseline
    const handleOrientation = (event) => {
      if (!baseOrientation) {
        setBaseOrientation({
          x: event.beta || 0,
          y: event.gamma || 0,
          z: event.alpha || 0
        });
        window.removeEventListener('deviceorientation', handleOrientation);
        
        // Complete calibration after a moment
        setTimeout(() => {
          setCalibrationStep(2);
          setTimeout(() => {
            // Apply smoothing preset to sensitivity
            let finalSensitivity = sensitivity;
            if (smoothing === 'high') {
              finalSensitivity *= 0.7; // Reduce sensitivity for smoother movement
            } else if (smoothing === 'low') {
              finalSensitivity *= 1.3; // Increase for more responsive movement
            }
            
            onComplete(baseOrientation || { x: 0, y: 0, z: 0 }, finalSensitivity);
          }, 1500);
        }, 2000);
      }
    };
    
    window.addEventListener('deviceorientation', handleOrientation);
  };
  
  const handleSensitivityChange = (e) => {
    setSensitivity(parseFloat(e.target.value));
  };
  
  const handleSmoothingChange = (level) => {
    setSmoothing(level);
  };
  
  const startTestMode = () => {
    setTestMode(true);
    
    const handleTestOrientation = (event) => {
      if (event.beta !== null && event.gamma !== null) {
        setTestRotation({
          x: event.beta - 45,
          y: event.gamma
        });
      }
    };
    
    window.addEventListener('deviceorientation', handleTestOrientation);
    
    setTimeout(() => {
      window.removeEventListener('deviceorientation', handleTestOrientation);
      setTestMode(false);
    }, 5000);
  };
  
  const skipCalibration = () => {
    onComplete({ x: 0, y: 0, z: 0 }, sensitivity);
  };
  
  return (
    <div className="calibration-screen">
      <div className="calibration-content">
        {!isCalibrating ? (
          <>
            <h1 className="calibration-title">📱 Setup Controls</h1>
            
            <div className="sensitivity-control">
              <label>Movement Speed</label>
              <div className="slider-container">
                <span>🐌</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.5" 
                  step="0.1" 
                  value={sensitivity}
                  onChange={handleSensitivityChange}
                  className="sensitivity-slider"
                />
                <span>🚀</span>
              </div>
              <div className="sensitivity-value">
                {sensitivity.toFixed(1)}x
              </div>
            </div>
            
            <div className="smoothing-control">
              <label>Motion Smoothing</label>
              <div className="smoothing-buttons">
                <button 
                  className={`smoothing-btn ${smoothing === 'low' ? 'active' : ''}`}
                  onClick={() => handleSmoothingChange('low')}
                >
                  Low
                  <span>Responsive</span>
                </button>
                <button 
                  className={`smoothing-btn ${smoothing === 'medium' ? 'active' : ''}`}
                  onClick={() => handleSmoothingChange('medium')}
                >
                  Medium
                  <span>Balanced</span>
                </button>
                <button 
                  className={`smoothing-btn ${smoothing === 'high' ? 'active' : ''}`}
                  onClick={() => handleSmoothingChange('high')}
                >
                  High
                  <span>Very Smooth</span>
                </button>
              </div>
            </div>
            
            {testMode && (
              <div className="test-indicator">
                <div className="test-box">
                  <div 
                    className="test-dot"
                    style={{
                      transform: `translate(${testRotation.y * 2}px, ${testRotation.x}px)`
                    }}
                  />
                </div>
                <p>Testing gyroscope...</p>
              </div>
            )}
            
            <div className="calibration-instructions">
              <h3>Tips for best experience:</h3>
              <div className="instruction-item">
                📱 Hold phone upright comfortably
              </div>
              <div className="instruction-item">
                🎯 Start with Medium smoothing
              </div>
              <div className="instruction-item">
                ⚡ Reduce speed if movement feels too fast
              </div>
            </div>
            
            <div className="button-group">
              <button className="test-button" onClick={startTestMode} disabled={testMode}>
                {testMode ? 'Testing...' : 'Test Gyro 🔄'}
              </button>
              <button className="calibrate-button" onClick={startCalibration}>
                Start Game 🎮
              </button>
            </div>
            
            <button className="skip-button" onClick={skipCalibration}>
              Quick Start (Use Defaults) →
            </button>
          </>
        ) : (
          <div className="calibrating">
            {calibrationStep === 1 && (
              <>
                <div className="calibration-icon">📱</div>
                <h2>Hold your phone comfortably</h2>
                <p>Keep it steady in your normal playing position...</p>
                <div className="loading-bar">
                  <div className="loading-fill" />
                </div>
              </>
            )}
            {calibrationStep === 2 && (
              <>
                <div className="calibration-icon">✅</div>
                <h2>Ready to Play!</h2>
                <p>Starting game with {smoothing} smoothing...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalibrationScreen;