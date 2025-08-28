import React, { useState, useEffect } from 'react';

const CalibrationScreen = ({ onComplete, setGyroPermission }) => {
  const [sensitivity, setSensitivity] = useState(1.5);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [baseOrientation, setBaseOrientation] = useState(null);
  
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
            onComplete(baseOrientation || { x: 0, y: 0, z: 0 }, sensitivity);
          }, 1500);
        }, 2000);
      }
    };
    
    window.addEventListener('deviceorientation', handleOrientation);
  };
  
  const handleSensitivityChange = (e) => {
    setSensitivity(parseFloat(e.target.value));
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
              <label>Gyroscope Sensitivity</label>
              <div className="slider-container">
                <span>Slow</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.1" 
                  value={sensitivity}
                  onChange={handleSensitivityChange}
                  className="sensitivity-slider"
                />
                <span>Fast</span>
              </div>
              <div className="sensitivity-value">
                {sensitivity.toFixed(1)}x
              </div>
            </div>
            
            <div className="calibration-instructions">
              <h3>How to hold your phone:</h3>
              <div className="instruction-item">
                📱 Hold your phone upright (portrait mode)
              </div>
              <div className="instruction-item">
                👀 Like looking through a window
              </div>
              <div className="instruction-item">
                🎯 Move phone to look around
              </div>
            </div>
            
            <button className="calibrate-button" onClick={startCalibration}>
              Start Calibration 🎯
            </button>
            
            <button className="skip-button" onClick={skipCalibration}>
              Skip & Use Defaults →
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
                <h2>Calibration Complete!</h2>
                <p>Starting game...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalibrationScreen;