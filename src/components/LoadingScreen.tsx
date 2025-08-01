import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [dots, setDots] = useState('');
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    // Animate loading dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 300);

    // Random glitch effect
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100);
    }, 800);


    return () => {
      clearInterval(dotInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Scanlines effect */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="w-full h-1 bg-green-500"
            style={{
              position: 'absolute',
              top: `${i * 4}%`,
              animation: `scanline 2s linear infinite ${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="text-center z-10">
        {/* Title */}
        <div className={`mb-8 transition-all duration-100 ${glitch ? 'transform translate-x-1 text-red-500' : ''}`}>
          <h1 className="text-2xl sm:text-4xl lg:text-6xl xl:text-8xl font-mono font-bold text-green-400 mb-2 tracking-wider pixel-text">
            THE
          </h1>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl xl:text-9xl font-mono font-bold text-yellow-400 tracking-wider pixel-text glow">
            SCRUMPS
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-mono text-green-300 mb-8 pixel-text">
          FUCK OFF
        </div>

        {/* Loading text */}
        <div className="text-base sm:text-lg lg:text-xl font-mono text-white pixel-text">
          LOADING{dots} {Math.round(progress)}%
        </div>

        {/* Progress bar */}
        <div className="w-40 sm:w-48 lg:w-64 h-2 sm:h-3 lg:h-4 bg-gray-800 border-2 border-green-400 mx-auto mt-4 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-yellow-400 animate-pulse"
            style={{
              width: `${progress}%`,
              transition: 'width 0.3s ease-out'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
        </div>

        {/* Copyright */}
        <div className="text-xs font-mono text-gray-500 mt-8 pixel-text">
          © 2025 SCRUMP STUDIOS
        </div>
      </div>

      {/* Floating pixels */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-green-400 opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float 4s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}

      <style jsx>{`
        .pixel-text {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.8);
        }
        
        .glow {
          text-shadow: 
            0 0 5px currentColor,
            0 0 10px currentColor,
            0 0 15px currentColor,
            2px 2px 0px rgba(0,0,0,0.8);
        }

        @keyframes scanline {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }


        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};