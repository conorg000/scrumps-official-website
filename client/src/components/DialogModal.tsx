import React from 'react';
import { ChevronRight } from 'lucide-react';

// Mr Tibbles portrait - cute white fluffy cat face
const MrTibblesPortrait: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    {/* Background */}
    <rect width="64" height="64" fill="#1f2937" />

    {/* Face - white fluffy */}
    <ellipse cx="32" cy="36" rx="22" ry="20" fill="#ffffff" />
    <ellipse cx="32" cy="38" rx="18" ry="16" fill="#f0f0f0" />

    {/* Fluffy cheeks */}
    <ellipse cx="14" cy="38" rx="8" ry="6" fill="#ffffff" />
    <ellipse cx="50" cy="38" rx="8" ry="6" fill="#ffffff" />

    {/* Ears */}
    <polygon points="12,20 20,8 26,22" fill="#ffffff" />
    <polygon points="52,20 44,8 38,22" fill="#ffffff" />
    {/* Inner ears - pink */}
    <polygon points="15,20 20,12 24,21" fill="#ffb6c1" />
    <polygon points="49,20 44,12 40,21" fill="#ffb6c1" />

    {/* Eyes - big and cute */}
    <ellipse cx="24" cy="34" rx="6" ry="7" fill="#000000" />
    <ellipse cx="40" cy="34" rx="6" ry="7" fill="#000000" />
    {/* Eye shine */}
    <circle cx="26" cy="32" r="2" fill="#ffffff" />
    <circle cx="42" cy="32" r="2" fill="#ffffff" />

    {/* Nose - pink */}
    <polygon points="32,42 28,46 36,46" fill="#ffb6c1" />

    {/* Mouth */}
    <path d="M 28 48 Q 32 52 36 48" stroke="#808080" strokeWidth="1.5" fill="none" />

    {/* Whiskers */}
    <line x1="4" y1="40" x2="18" y2="42" stroke="#808080" strokeWidth="1" />
    <line x1="4" y1="44" x2="18" y2="44" stroke="#808080" strokeWidth="1" />
    <line x1="46" y1="42" x2="60" y2="40" stroke="#808080" strokeWidth="1" />
    <line x1="46" y1="44" x2="60" y2="44" stroke="#808080" strokeWidth="1" />
  </svg>
);

// Possum portrait - scruffy grey possum with pointy face
const PossumPortrait: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    {/* Background */}
    <rect width="64" height="64" fill="#1f2937" />

    {/* Big round ears */}
    <ellipse cx="14" cy="18" rx="10" ry="10" fill="#4a4a4a" />
    <ellipse cx="50" cy="18" rx="10" ry="10" fill="#4a4a4a" />
    {/* Inner ears - pink */}
    <ellipse cx="14" cy="18" rx="6" ry="6" fill="#d4a5a5" />
    <ellipse cx="50" cy="18" rx="6" ry="6" fill="#d4a5a5" />

    {/* Face - grey and pointy */}
    <ellipse cx="32" cy="38" rx="20" ry="18" fill="#6b6b6b" />
    {/* Lighter face patch */}
    <ellipse cx="32" cy="42" rx="14" ry="12" fill="#8a8a8a" />

    {/* Snout - pointy */}
    <ellipse cx="32" cy="48" rx="8" ry="6" fill="#9a9a9a" />

    {/* Nose - pink and wet looking */}
    <ellipse cx="32" cy="46" rx="4" ry="3" fill="#ff9999" />
    <ellipse cx="33" cy="45" rx="1" ry="1" fill="#ffcccc" />

    {/* Eyes - beady and mischievous */}
    <ellipse cx="24" cy="34" rx="4" ry="5" fill="#000000" />
    <ellipse cx="40" cy="34" rx="4" ry="5" fill="#000000" />
    {/* Eye shine */}
    <circle cx="25" cy="33" r="1.5" fill="#ffffff" />
    <circle cx="41" cy="33" r="1.5" fill="#ffffff" />

    {/* Dark eye patches */}
    <ellipse cx="24" cy="34" rx="6" ry="7" fill="none" stroke="#4a4a4a" strokeWidth="2" />
    <ellipse cx="40" cy="34" rx="6" ry="7" fill="none" stroke="#4a4a4a" strokeWidth="2" />

    {/* Whiskers */}
    <line x1="6" y1="44" x2="20" y2="46" stroke="#888888" strokeWidth="1" />
    <line x1="6" y1="48" x2="20" y2="48" stroke="#888888" strokeWidth="1" />
    <line x1="6" y1="52" x2="20" y2="50" stroke="#888888" strokeWidth="1" />
    <line x1="44" y1="46" x2="58" y2="44" stroke="#888888" strokeWidth="1" />
    <line x1="44" y1="48" x2="58" y2="48" stroke="#888888" strokeWidth="1" />
    <line x1="44" y1="50" x2="58" y2="52" stroke="#888888" strokeWidth="1" />

    {/* Scruffy fur tufts */}
    <path d="M 18 26 L 16 22 L 20 24" fill="#5a5a5a" />
    <path d="M 46 26 L 48 22 L 44 24" fill="#5a5a5a" />
  </svg>
);

interface DialogModalProps {
  isVisible: boolean;
  characterName: string;
  text: string[];
  characterSprite?: string;
  imageSrc?: string;
  imageTitle?: string;
  onClose?: () => void;
  currentTextIndex?: number;
  onNextText?: () => void;
}

export const DialogModal: React.FC<DialogModalProps> = ({
  isVisible,
  characterName,
  text,
  characterSprite,
  imageSrc,
  imageTitle,
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
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Image section - takes up most of the screen if image is provided */}
      {imageSrc && (
        <div className="flex-1 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full h-full max-w-4xl max-h-[70vh] bg-gray-900 border-2 border-gray-600 rounded-xl overflow-hidden">
            <div className="w-full h-full flex items-center justify-center p-4">
              <img 
                src={imageSrc}
                alt={imageTitle || 'Image'}
                className="w-full h-full object-contain pixelated"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Dialog section - always at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-[100]">
        <div className="max-w-2xl mx-auto bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Main dialog content - horizontal layout */}
          <div className="flex items-center p-4 gap-4">
            {/* Character portrait */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                {characterName === 'Mr Tibbles' ? (
                  <MrTibblesPortrait />
                ) : characterName === 'Possum' ? (
                  <PossumPortrait />
                ) : (
                  <img
                    src="/scrumps-character.png"
                    alt={characterName}
                    className="w-full h-full object-contain pixelated"
                  />
                )}
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
              <div className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors cursor-pointer animate-pulse">
                {isLastText ? (
                  <span className="text-lg">🖕</span>
                ) : (
                  <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
    <style>{`
      .pixelated {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
    `}</style>
    </div>
  );
};