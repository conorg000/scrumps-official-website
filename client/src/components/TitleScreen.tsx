import React from 'react';
import { SOCIAL_LINKS } from '../bandConfig';

interface TitleScreenProps {
  onStart: () => void;
  ready: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, ready }) => {
  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden scanlines"
      style={{
        background:
          'radial-gradient(circle at 50% 30%, #2a3d6b 0%, #16213e 55%, #0b1020 100%)',
      }}
    >
      {/* Drifting starry/disco specks */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-yellow-200"
            style={{
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animation: `float-y ${3 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Hero crisp */}
      <div className="animate-float-y mb-4 text-7xl sm:text-8xl drop-shadow-[0_8px_0_rgba(0,0,0,0.4)]">
        🥔
      </div>

      <h1 className="font-pixel text-3xl sm:text-5xl text-center text-shimmer px-4">
        THE SCRUMPS
      </h1>
      <p className="font-pixel text-[10px] sm:text-xs text-yellow-200/80 mt-4 mb-1">
        an absurd backyard adventure
      </p>
      <p className="text-gray-300/70 text-xs sm:text-sm mb-8 text-center px-6 max-w-md">
        You are a sentient crisp. It's inspection day. Hide the subletters, dodge Adele,
        collect the band's records, and survive the bush turkey.
      </p>

      <button
        onClick={onStart}
        disabled={!ready}
        className={`font-pixel text-sm sm:text-base px-8 py-4 rounded-lg border-4 transition-all duration-200 ${
          ready
            ? 'bg-yellow-400 text-black border-yellow-600 hover:scale-110 hover:bg-yellow-300 animate-glow cursor-pointer'
            : 'bg-gray-600 text-gray-300 border-gray-700 cursor-wait opacity-70'
        }`}
      >
        {ready ? 'ENTER THE BACKYARD' : 'LOADING…'}
      </button>

      {/* Social links */}
      <div className="flex gap-5 mt-10">
        {SOCIAL_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-2xl hover:scale-125 transition-transform"
            title={l.label}
            aria-label={l.label}
          >
            {l.icon}
          </a>
        ))}
      </div>
      <p className="text-gray-500 text-[10px] mt-6 font-mono">🎧 best with sound on</p>
    </div>
  );
};
