import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface ArrowKeysProps {
  onMove: (direction: string | null) => void;
}

export const VirtualJoystick: React.FC<ArrowKeysProps> = ({ onMove }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePress = (direction: string) => {
    setActiveDirection(direction);
    onMove(direction);
  };

  const handleRelease = () => {
    setActiveDirection(null);
    onMove(null);
  };

  const ArrowButton = ({ direction, icon: Icon, position }: { 
    direction: string; 
    icon: React.ComponentType<any>; 
    position: string;
  }) => {
    const isActive = activeDirection === direction;
    
    return (
      <button
        className={`absolute ${position} w-14 h-14 bg-black/30 backdrop-blur-sm rounded-lg border-2 border-white/20 flex items-center justify-center transition-all duration-75 touch-none select-none ${
          isActive ? 'bg-white/20 border-white/40 scale-95' : 'hover:bg-white/10'
        }`}
        onTouchStart={(e) => {
          e.preventDefault();
          handlePress(direction);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleRelease();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          handlePress(direction);
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          handleRelease();
        }}
        onMouseLeave={handleRelease}
      >
        <Icon 
          size={24} 
          className={`text-white/80 transition-colors duration-75 ${
            isActive ? 'text-white' : ''
          }`} 
        />
      </button>
    );
  };

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-6 right-6 w-32 h-32 z-50">
      {/* Up arrow */}
      <ArrowButton 
        direction="up" 
        icon={ChevronUp} 
        position="top-0 left-1/2 transform -translate-x-1/2" 
      />
      
      {/* Down arrow */}
      <ArrowButton 
        direction="down" 
        icon={ChevronDown} 
        position="bottom-0 left-1/2 transform -translate-x-1/2" 
      />
      
      {/* Left arrow */}
      <ArrowButton 
        direction="left" 
        icon={ChevronLeft} 
        position="top-1/2 left-0 transform -translate-y-1/2" 
      />
      
      {/* Right arrow */}
      <ArrowButton 
        direction="right" 
        icon={ChevronRight} 
        position="top-1/2 right-0 transform -translate-y-1/2" 
      />
    </div>
  );
};