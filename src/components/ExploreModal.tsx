import React from 'react';
import { X } from 'lucide-react';

interface ExploreModalProps {
  isVisible: boolean;
  imageSrc: string;
  title: string;
  description: string;
  onClose: () => void;
}

export const ExploreModal: React.FC<ExploreModalProps> = ({
  isVisible,
  imageSrc,
  title,
  description,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors border border-gray-600"
        >
          <X size={20} />
        </button>
        
        {/* Image Section - Takes up most of the modal */}
        <div className="relative bg-gray-800">
          <div className="w-full h-[70vh] flex items-center justify-center p-4">
            <img 
              src={imageSrc}
              alt={title}
              className="w-full h-full object-contain pixelated"
            />
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4">
          {/* Description */}
          <div className="text-white font-mono leading-relaxed text-sm sm:text-base text-center">
            {description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
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