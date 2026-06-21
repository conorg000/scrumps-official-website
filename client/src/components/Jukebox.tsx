import React, { useEffect, useRef, useState } from 'react';
import { SONGS, STREAMING_LINKS } from '../bandConfig';

interface JukeboxProps {
  collectedCDs: string[];
  onClose: () => void;
  /** Background music element to pause while a track previews */
  bgAudioRef: React.RefObject<HTMLAudioElement>;
}

export const Jukebox: React.FC<JukeboxProps> = ({ collectedCDs, onClose, bgAudioRef }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const allUnlocked = collectedCDs.length >= SONGS.length;

  useEffect(() => {
    // Resume background music when the jukebox closes
    return () => {
      audioRef.current?.pause();
      const bg = bgAudioRef.current;
      if (bg && !bg.muted) bg.play().catch(() => {});
    };
  }, [bgAudioRef]);

  const isUnlocked = (song: typeof SONGS[number]) => collectedCDs.includes(song.cd);

  const togglePlay = (song: typeof SONGS[number]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === song.id) {
      audio.pause();
      setPlayingId(null);
      const bg = bgAudioRef.current;
      if (bg && !bg.muted) bg.play().catch(() => {});
      return;
    }

    // Duck the background track while previewing
    bgAudioRef.current?.pause();
    audio.src = song.previewSrc;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    setPlayingId(song.id);
    (window as any).Effects?.sfx('select');
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      <div
        className="relative w-full max-w-md rounded-2xl border-4 border-purple-500 bg-gradient-to-b from-[#241640] to-[#120a22] text-white p-5 scanlines animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="font-pixel text-base text-center text-purple-200 mb-1">💿 JUKEBOX</h2>
        <p className="text-center text-purple-300/70 text-[10px] font-mono mb-4">
          {collectedCDs.length}/{SONGS.length} records found
        </p>

        <div className="space-y-2">
          {SONGS.map((song) => {
            const unlocked = isUnlocked(song);
            const playing = playingId === song.id;
            return (
              <div
                key={song.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 border ${
                  unlocked ? 'bg-white/10 border-purple-400/40' : 'bg-white/5 border-white/10'
                }`}
              >
                <button
                  disabled={!unlocked}
                  onClick={() => togglePlay(song)}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg ${
                    unlocked
                      ? 'bg-purple-500 hover:bg-purple-400 cursor-pointer'
                      : 'bg-gray-700 cursor-not-allowed'
                  }`}
                  aria-label={unlocked ? (playing ? 'Pause' : 'Play') : 'Locked'}
                >
                  {unlocked ? (playing ? '⏸' : '▶') : '🔒'}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold truncate ${unlocked ? '' : 'text-white/40'}`}>
                    {unlocked ? song.title : '???'}
                  </div>
                  <div className="text-[11px] text-white/50 truncate">
                    {unlocked ? (playing ? 'now playing…' : 'tap to preview') : `find the CD in ${song.foundAt}`}
                  </div>
                </div>
                {unlocked && (
                  <a
                    href={song.streamHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-purple-200 underline hover:text-white shrink-0"
                  >
                    full ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {allUnlocked && (
          <div className="mt-4 rounded-lg bg-purple-500/20 border border-purple-400/50 p-3 text-center animate-pop-in">
            <p className="font-pixel text-[10px] text-yellow-300 mb-2">★ FULL EP UNLOCKED ★</p>
            <div className="flex flex-wrap justify-center gap-2">
              {STREAMING_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-white/10 hover:bg-white/25 rounded px-2 py-1"
                >
                  {l.icon} {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
