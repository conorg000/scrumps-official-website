import React from 'react';
import { ChevronRight } from 'lucide-react';

interface DialogModalProps {
  isVisible: boolean;
  characterName: string;
  text: string[];
  characterSprite?: string;
  onClose?: () => void;
  currentTextIndex?: number;
  onNextText?: () => void;
}

export const DialogModal: React.FC<DialogModalProps> = ({
  isVisible,
  characterName,
  text,
  characterSprite,
  onClose,
  currentTextIndex = 0,
  onNextText
}) => {
  if (!isVisible) return null;

  const handleContinue = () => {
    if (currentTextIndex < text.length - 1) {
      // More text to show, go to next
      onNextText?.();
    } else {
      // End of dialog, close
      onClose?.();
    }
  };

  const currentText = text[currentTextIndex] || '';
  const isLastText = currentTextIndex >= text.length - 1;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-2xl mx-auto bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Main dialog content - horizontal layout */}
        <div className="flex items-center p-4 gap-4">
          {/* Character portrait */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
              <img 
                src="/scrumps-character.png"
                alt={characterName}
                className="w-full h-full object-contain pixelated"
              />
            </div>
          </div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Character name */}
            <h3 className="font-bold text-sm sm:text-base text-yellow-400 font-mono mb-1 truncate">
              {characterName}
            </h3>
            
            {/* Dialog text */}
            <p className="text-white text-xs sm:text-sm font-mono leading-relaxed">
              {currentText}
            </p>
            
            {/* Progress indicator for multi-text dialogs */}
            {text.length > 1 && (
              <div className="flex gap-1 mt-2">
                {text.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-1 rounded-full ${
                      index === currentTextIndex ? 'bg-yellow-400' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Continue button */}
          <div className="flex-shrink-0" onClick={handleContinue}>
            <div className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg transition-colors cursor-pointer animate-pulse">
              {isLastText ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black rounded-sm" />
              ) : (
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              )}
            </div>
          </div>
        </div>
      </div>
    
    <style jsx>{`
      .pixelated {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
    `}</style>
    </div>
  );
};