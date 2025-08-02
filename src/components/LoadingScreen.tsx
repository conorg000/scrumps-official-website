import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [dots, setDots] = useState('');
  const [glitch, setGlitch] = useState(false);
  const [matrixChars, setMatrixChars] = useState<Array<{char: string, x: number, y: number, speed: number}>>([]);

  useEffect(() => {
    // Animate loading dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 300);

    // Random glitch effect
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 1200);

    // Matrix rain effect
    const chars = '01SCRUMP!@#$%^&*()_+-=[]{}|;:,.<>?';
    const initMatrix = () => {
      const newChars = [];
      for (let i = 0; i < 50; i++) {
        newChars.push({
          char: chars[Math.floor(Math.random() * chars.length)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          speed: Math.random() * 2 + 0.5
        });
      }
      setMatrixChars(newChars);
    };

    initMatrix();

    const matrixInterval = setInterval(() => {
      setMatrixChars(prev => prev.map(item => ({
        ...item,
        char: chars[Math.floor(Math.random() * chars.length)],
        y: (item.y + item.speed) % 100
      })));
    }, 100);

    return () => {
      clearInterval(dotInterval);
      clearInterval(glitchInterval);
      clearInterval(matrixInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Matrix rain background */}
      <div className="absolute inset-0 opacity-10">
        {matrixChars.map((item, i) => (
          <div
            key={i}
            className="absolute text-green-400 font-mono text-xs animate-pulse"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translateY(-50%)'
            }}
          >
            {item.char}
          </div>
        ))}
      </div>

      {/* Animated scanlines */}
      <div className="absolute inset-0 opacity-15">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
            style={{
              position: 'absolute',
              top: `${i * 3.33}%`,
              animation: `scanline 3s linear infinite ${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Pulsing grid overlay */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,0,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,0,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      </div>

      {/* Main content */}
      <div className="text-center z-10 relative">
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-yellow-400/20 to-green-400/20 blur-xl animate-pulse" />
        
        <div className={`relative transition-all duration-150 ${glitch ? 'transform translate-x-2 skew-x-2 text-red-500' : ''}`}>
          {/* Title with enhanced glow */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-4xl lg:text-6xl xl:text-8xl font-mono font-bold text-green-400 mb-2 tracking-wider pixel-text title-glow">
              THE
            </h1>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl xl:text-9xl font-mono font-bold text-yellow-400 tracking-wider pixel-text main-glow animate-pulse">
              SCRUMPS
            </h1>
            
            {/* Subtitle with typewriter effect */}
            <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-mono text-green-300 mt-4 pixel-text typewriter">
              FUCK OFF
            </div>
          </div>

          {/* Enhanced loading section */}
          <div className="bg-black/50 backdrop-blur-sm border border-green-400/30 rounded-lg p-6 mx-4">
            {/* Loading text with enhanced styling */}
            <div className="text-base sm:text-lg lg:text-xl font-mono text-white pixel-text mb-4 loading-text">
              LOADING{dots} {Math.round(progress)}%
            </div>

            {/* Enhanced progress bar */}
            <div className="w-48 sm:w-64 lg:w-80 h-3 sm:h-4 lg:h-5 bg-gray-900 border-2 border-green-400 mx-auto relative overflow-hidden rounded-sm">
              {/* Main progress */}
              <div 
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-green-300 relative"
                style={{
                  width: `${progress}%`,
                  transition: 'width 0.3s ease-out'
                }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
              
              {/* Progress bar glow */}
              <div 
                className="absolute top-0 left-0 h-full bg-green-400/50 blur-sm"
                style={{
                  width: `${progress}%`,
                  transition: 'width 0.3s ease-out'
                }}
              />
              
              {/* Pulsing segments */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 w-1 h-full bg-white/20 ${
                    progress > i * 10 ? 'animate-pulse' : ''
                  }`}
                  style={{ left: `${i * 10}%` }}
                />
              ))}
            </div>

            {/* Loading status messages */}
            <div className="text-xs font-mono text-green-300 mt-3 pixel-text">
              {progress < 20 && "INITIALIZING SCRUMP PROTOCOLS..."}
              {progress >= 20 && progress < 40 && "LOADING CRISPY TEXTURES..."}
              {progress >= 40 && progress < 60 && "CALIBRATING BOXING RING..."}
              {progress >= 60 && progress < 80 && "FILLING KIDDY POOL..."}
              {progress >= 80 && progress < 95 && "TUNING INSTRUMENTS..."}
              {progress >= 95 && "READY TO ROCK!"}
            </div>
          </div>

          {/* Copyright with enhanced styling */}
          <div className="text-xs font-mono text-gray-500 mt-6 pixel-text opacity-60">
            © 2025 SCRUMP STUDIOS • EST. IN A BACKYARD
          </div>
        </div>
      </div>

      {/* Enhanced floating elements */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className={`absolute opacity-40 ${
            i % 3 === 0 ? 'w-1 h-1 bg-green-400' :
            i % 3 === 1 ? 'w-2 h-2 bg-yellow-400 rounded-full' :
            'w-1 h-3 bg-green-300'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 text-green-400 font-mono text-xs opacity-30">
        [SYSTEM ONLINE]
      </div>
      <div className="absolute top-4 right-4 text-green-400 font-mono text-xs opacity-30">
        [AUDIO: OK]
      </div>
      <div className="absolute bottom-4 left-4 text-green-400 font-mono text-xs opacity-30">
        [GRAPHICS: OK]
      </div>
      <div className="absolute bottom-4 right-4 text-green-400 font-mono text-xs opacity-30">
        [READY]
      </div>

      <style jsx>{`
        .pixel-text {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.8);
        }
        
        .title-glow {
          text-shadow: 
            0 0 5px currentColor,
            0 0 10px currentColor,
            0 0 15px currentColor,
            2px 2px 0px rgba(0,0,0,0.8);
        }

        .main-glow {
          text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 30px currentColor,
            0 0 40px currentColor,
            2px 2px 0px rgba(0,0,0,0.8);
        }

        .loading-text {
          text-shadow: 
            0 0 5px currentColor,
            2px 2px 0px rgba(0,0,0,0.8);
        }

        .typewriter {
          overflow: hidden;
          border-right: 2px solid currentColor;
          white-space: nowrap;
          animation: typewriter 2s steps(8) 1s both, blink 1s infinite;
        }

        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes blink {
          50% { border-color: transparent; }
        }

        @keyframes scanline {
          0% { opacity: 0; transform: translateY(-10px); }
          50% { opacity: 1; transform: translateY(0px); }
          100% { opacity: 0; transform: translateY(10px); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.4;
          }
          50% { 
            transform: translateY(-30px) rotate(180deg); 
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};