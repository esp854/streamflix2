import React, { useEffect } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  useEffect(() => {
    // Start the animation sequence
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 3000); // Show splash for 3 seconds

    return () => clearTimeout(timer);
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
      </div>
    </div>
  );
};

export default SplashScreen;