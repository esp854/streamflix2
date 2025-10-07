import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start the animation sequence
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 3000); // Show splash for 3 seconds

    // Animate progress bar
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <div className="logo-animation">
            <svg className="streamflix-logo" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div className="logo-text">StreamFlix</div>
        </div>
        
        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="loading-text">Chargement de votre expérience StreamFlix...</div>
      </div>
    </div>
  );
};

export default SplashScreen;