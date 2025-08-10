import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [dots, setDots] = useState('');
  const [glitch, setGlitch] = useState(false);
  const [matrixChars, setMatrixChars] = useState<Array<{char: string, x: number, y: number, speed: number}>>([]);
  const [horizontalGlitches, setHorizontalGlitches] = useState<Array<{id: number, y: number, width: number, opacity: number}>>([]);
  const [staticNoise, setStaticNoise] = useState(0.1);
  const [crtFlicker, setCrtFlicker] = useState(false);
  const [titleGlitch, setTitleGlitch] = useState({ active: false, offset: 0, color: '' });

  useEffect(() => {
    // Animate loading dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 300);

    // Enhanced glitch effect
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 800 + Math.random() * 800);

    // Title glitch effect
    const titleGlitchInterval = setInterval(() => {
      setTitleGlitch({
        active: true,
        offset: Math.random() * 4 - 2,
        color: Math.random() > 0.5 ? '#ff0000' : '#00ffff'
      });
      setTimeout(() => setTitleGlitch({ active: false, offset: 0, color: '' }), 100);
    }, 1500 + Math.random() * 2000);

    // CRT flicker effect
    const crtInterval = setInterval(() => {
      setCrtFlicker(true);
      setTimeout(() => setCrtFlicker(false), 50);
    }, 3000 + Math.random() * 5000);

    // Horizontal glitch lines
    const horizontalGlitchInterval = setInterval(() => {
      const newGlitch = {
        id: Date.now(),
        y: Math.random() * 100,
        width: Math.random() * 80 + 20,
        opacity: Math.random() * 0.8 + 0.2
      };
      
      setHorizontalGlitches(prev => [...prev, newGlitch]);
      
      setTimeout(() => {
        setHorizontalGlitches(prev => prev.filter(g => g.id !== newGlitch.id));
      }, 150);
    }, 500 + Math.random() * 1000);

    // Static noise animation
    const staticInterval = setInterval(() => {
      setStaticNoise(Math.random() * 0.15 + 0.05);
    }, 50);

    // Matrix rain effect
    const chars = '01SCRUMP!@#$%^&*()_+-=[]{}|;:,.<>?ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
    const initMatrix = () => {
      const newChars = [];
      for (let i = 0; i < 80; i++) {
        newChars.push({
          char: chars[Math.floor(Math.random() * chars.length)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          speed: Math.random() * 3 + 0.5
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
    }, 80);

    return () => {
      clearInterval(dotInterval);
      clearInterval(glitchInterval);
      clearInterval(titleGlitchInterval);
      clearInterval(crtInterval);
      clearInterval(horizontalGlitchInterval);
      clearInterval(staticInterval);
      clearInterval(matrixInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* CRT Screen Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none z-50 ${crtFlicker ? 'animate-pulse' : ''}`}
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.1) 100%),
            linear-gradient(0deg, transparent 50%, rgba(0,255,0,0.03) 50%, rgba(0,255,0,0.03) 52%, transparent 52%)
          `,
          backgroundSize: '100% 100%, 100% 4px',
          filter: `
            contrast(1.1) 
            brightness(1.1) 
            hue-rotate(${Math.sin(Date.now() * 0.001) * 5}deg)
            ${crtFlicker ? 'brightness(1.3) contrast(1.3)' : ''}
          `,
          borderRadius: '20px',
          boxShadow: `
            inset 0 0 100px rgba(0,255,0,0.1),
            0 0 50px rgba(0,255,0,0.2)
          `
        }}
      />

      {/* Static Noise Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          opacity: staticNoise,
          background: `
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              transparent 0deg,
              rgba(255,255,255,0.1) 1deg,
              transparent 2deg
            )
          `,
          backgroundSize: '2px 2px',
          filter: 'blur(0.5px)',
          animation: 'staticNoise 0.1s infinite linear'
        }}
      />

      {/* Horizontal Glitch Lines */}
      {horizontalGlitches.map(glitchLine => (
        <div
          key={glitchLine.id}
          className="absolute left-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-30"
          style={{
            top: `${glitchLine.y}%`,
            width: `${glitchLine.width}%`,
            opacity: glitchLine.opacity,
            boxShadow: '0 0 10px currentColor',
            animation: 'horizontalGlitch 0.15s ease-out'
          }}
        />
      ))}

      {/* Enhanced Matrix rain background */}
      <div className="absolute inset-0 opacity-20">
        {matrixChars.map((item, i) => (
          <div
            key={i}
            className="absolute text-green-400 font-mono text-xs animate-pulse"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translateY(-50%)',
              textShadow: '0 0 10px currentColor',
              filter: `hue-rotate(${Math.sin(i * 0.1) * 60}deg)`
            }}
          >
            {item.char}
          </div>
        ))}
      </div>

      {/* Enhanced animated scanlines */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
            style={{
              position: 'absolute',
              top: `${i * 2}%`,
              animation: `scanline ${2 + Math.random() * 3}s linear infinite ${i * 0.05}s`,
              boxShadow: '0 0 5px currentColor'
            }}
          />
        ))}
      </div>

      {/* Pulsing grid overlay with enhanced effects */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,0,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,0,0.4) 1px, transparent 1px),
              radial-gradient(circle at 25% 25%, rgba(255,255,0,0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(0,255,255,0.1) 0%, transparent 50%)
            `,
            backgroundSize: '15px 15px, 15px 15px, 200px 200px, 200px 200px',
            animation: 'gridPulse 3s ease-in-out infinite'
          }}
        />
      </div>

      {/* Main content */}
      <div className="text-center z-20 relative">
        {/* Enhanced glowing border effect */}
        <div 
          className="absolute inset-0 blur-2xl animate-pulse"
          style={{
            background: `
              conic-gradient(
                from 0deg,
                #00ff00 0deg,
                #ffff00 90deg,
                #ff0000 180deg,
                #00ffff 270deg,
                #00ff00 360deg
              )
            `,
            animation: 'rainbowSpin 4s linear infinite'
          }}
        />
        
        <div className={`relative transition-all duration-100 ${glitch ? 'transform translate-x-3 skew-x-3 text-red-500 scale-105' : ''}`}>
          {/* Enhanced title with advanced glow */}
          <div className="mb-8">
            <h1 
              className={`text-2xl sm:text-4xl lg:text-6xl xl:text-8xl font-mono font-bold text-green-400 mb-2 tracking-wider pixel-text title-glow ${titleGlitch.active ? 'title-glitch' : ''}`}
              style={titleGlitch.active ? {
                transform: `translateX(${titleGlitch.offset}px) skewX(${titleGlitch.offset}deg)`,
                color: titleGlitch.color,
                textShadow: `
                  ${titleGlitch.offset}px 0 ${titleGlitch.color},
                  ${-titleGlitch.offset}px 0 #00ff00,
                  0 0 20px currentColor
                `
              } : {}}
            >
              THE
            </h1>
            <h1 
              className={`text-3xl sm:text-5xl lg:text-7xl xl:text-9xl font-mono font-bold text-yellow-400 tracking-wider pixel-text main-glow animate-pulse ${titleGlitch.active ? 'title-glitch' : ''}`}
              style={titleGlitch.active ? {
                transform: `translateX(${-titleGlitch.offset}px) skewX(${-titleGlitch.offset}deg)`,
                color: titleGlitch.color,
                textShadow: `
                  ${titleGlitch.offset}px 0 ${titleGlitch.color},
                  ${-titleGlitch.offset}px 0 #ffff00,
                  0 0 30px currentColor
                `
              } : {}}
            >
              SCRUMPS
            </h1>
            
            {/* Enhanced subtitle with typewriter effect */}
            <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-mono text-green-300 mt-4 pixel-text typewriter">
              FUCK OFF
            </div>
          </div>

          {/* Enhanced loading section with animated border */}
          <div 
            className="bg-black/60 backdrop-blur-md border-2 rounded-lg p-6 mx-4 relative overflow-hidden"
            style={{
              borderColor: 'transparent',
              background: `
                linear-gradient(black, black) padding-box,
                conic-gradient(
                  from ${Date.now() * 0.001}rad,
                  #00ff00,
                  #ffff00,
                  #ff0000,
                  #00ffff,
                  #00ff00
                ) border-box
              `,
              animation: 'borderGlow 3s linear infinite'
            }}
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-green-400 rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `particleFloat ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            {/* Enhanced loading text */}
            <div className="text-base sm:text-lg lg:text-xl font-mono text-white pixel-text mb-4 loading-text relative z-10">
              LOADING{dots} {Math.round(progress)}%
            </div>

            {/* Ultra-enhanced progress bar */}
            <div className="w-48 sm:w-64 lg:w-80 h-4 sm:h-5 lg:h-6 bg-gray-900 border-2 border-green-400 mx-auto relative overflow-hidden rounded-sm">
              {/* Main progress with enhanced gradient */}
              <div 
                className="h-full relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: `
                    linear-gradient(90deg, 
                      #00ff00 0%, 
                      #ffff00 25%, 
                      #ff8800 50%, 
                      #ff0000 75%, 
                      #ff00ff 100%
                    )
                  `,
                  transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 20px currentColor'
                }}
              >
                {/* Multiple animated shine effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-shimmer2" />
              </div>
              
              {/* Enhanced progress bar glow */}
              <div 
                className="absolute top-0 left-0 h-full blur-md"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000)',
                  transition: 'width 0.3s ease-out'
                }}
              />
              
              {/* Enhanced pulsing segments */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 w-0.5 h-full ${
                    progress > i * 5 ? 'bg-white animate-pulse' : 'bg-gray-700'
                  }`}
                  style={{ 
                    left: `${i * 5}%`,
                    boxShadow: progress > i * 5 ? '0 0 5px white' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Enhanced loading status messages */}
            <div className="text-xs font-mono text-green-300 mt-3 pixel-text relative z-10">
              {progress < 15 && "INITIALIZING SCRUMP PROTOCOLS..."}
              {progress >= 15 && progress < 30 && "LOADING CRISPY TEXTURES..."}
              {progress >= 30 && progress < 45 && "CALIBRATING BOXING RING..."}
              {progress >= 45 && progress < 60 && "FILLING KIDDY POOL..."}
              {progress >= 60 && progress < 75 && "TUNING INSTRUMENTS..."}
              {progress >= 75 && progress < 90 && "WARMING UP AMPLIFIERS..."}
              {progress >= 90 && progress < 95 && "FINAL SOUND CHECK..."}
              {progress >= 95 && "NOW FUCK OFF 🖕"}
            </div>
          </div>

          {/* Enhanced copyright with glitch effect */}
          <div className={`text-xs font-mono text-gray-500 mt-6 pixel-text opacity-60 ${Math.random() > 0.95 ? 'animate-pulse text-red-500' : ''}`}>
            © 2025 SCRUMP STUDIOS • EST. IN A BACKYARD • FUCK THE SYSTEM
          </div>
        </div>
      </div>

      {/* Enhanced floating elements with more variety */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className={`absolute ${
            i % 5 === 0 ? 'w-1 h-1 bg-green-400' :
            i % 5 === 1 ? 'w-2 h-2 bg-yellow-400 rounded-full' :
            i % 5 === 2 ? 'w-1 h-3 bg-green-300' :
            i % 5 === 3 ? 'w-3 h-1 bg-cyan-400' :
            'w-2 h-2 bg-red-400 rotate-45'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.6,
            animation: `float ${2 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
            boxShadow: '0 0 10px currentColor'
          }}
        />
      ))}

      {/* Enhanced corner decorations with animations */}
      <div className="absolute top-4 left-4 text-green-400 font-mono text-xs opacity-40 animate-pulse">
        [SYSTEM ONLINE] ▲
      </div>
      <div className="absolute top-4 right-4 text-yellow-400 font-mono text-xs opacity-40 animate-pulse">
        [AUDIO: OK] ♪
      </div>
      <div className="absolute bottom-4 left-4 text-cyan-400 font-mono text-xs opacity-40 animate-pulse">
        [GRAPHICS: OK] ◆
      </div>
      <div className="absolute bottom-4 right-4 text-green-400 font-mono text-xs opacity-40 animate-pulse">
        [READY] ●
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
            0 0 20px currentColor,
            2px 2px 0px rgba(0,0,0,0.8);
        }

        .main-glow {
          text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 30px currentColor,
            0 0 40px currentColor,
            0 0 50px currentColor,
            2px 2px 0px rgba(0,0,0,0.8);
        }

        .loading-text {
          text-shadow: 
            0 0 5px currentColor,
            0 0 10px currentColor,
            2px 2px 0px rgba(0,0,0,0.8);
        }

        .typewriter {
          overflow: hidden;
          border-right: 2px solid currentColor;
          white-space: nowrap;
          animation: typewriter 2s steps(8) 1s both, blink 1s infinite;
        }

        .title-glitch {
          animation: titleGlitchAnim 0.1s ease-in-out;
        }

        @keyframes titleGlitchAnim {
          0%, 100% { transform: translateX(0) skewX(0); }
          25% { transform: translateX(-2px) skewX(-2deg); }
          75% { transform: translateX(2px) skewX(2deg); }
        }

        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes blink {
          50% { border-color: transparent; }
        }

        @keyframes scanline {
          0% { opacity: 0; transform: translateY(-10px) scaleX(0); }
          50% { opacity: 1; transform: translateY(0px) scaleX(1); }
          100% { opacity: 0; transform: translateY(10px) scaleX(0); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes shimmer2 {
          0% { transform: translateX(-100%) skewX(-10deg); }
          100% { transform: translateX(100%) skewX(-10deg); }
        }

        @keyframes horizontalGlitch {
          0% { transform: translateX(-100%) scaleX(0); opacity: 0; }
          50% { transform: translateX(0) scaleX(1); opacity: 1; }
          100% { transform: translateX(100%) scaleX(0); opacity: 0; }
        }

        @keyframes staticNoise {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
          100% { transform: translate(1px, 1px); }
        }

        @keyframes rainbowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes borderGlow {
          0%, 100% { filter: brightness(1) hue-rotate(0deg); }
          50% { filter: brightness(1.2) hue-rotate(180deg); }
        }

        @keyframes gridPulse {
          0%, 100% { 
            opacity: 0.1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.2; 
            transform: scale(1.02);
          }
        }

        @keyframes particleFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-20px) rotate(180deg); 
            opacity: 0.8;
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.6;
          }
          25% { 
            transform: translateY(-15px) rotate(90deg); 
            opacity: 0.8;
          }
          75% { 
            transform: translateY(-30px) rotate(270deg); 
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};