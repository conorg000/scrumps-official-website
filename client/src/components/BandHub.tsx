import React, { useState } from 'react';
import {
  STREAMING_LINKS,
  SOCIAL_LINKS,
  MERCH_URL,
  SHOWS_URL,
} from '../bandConfig';

interface BandHubProps {
  onClose: () => void;
}

export const BandHub: React.FC<BandHubProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [signedUp, setSignedUp] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    // TODO(band): POST to your real mailing-list provider (Mailchimp/Buttondown…)
    try {
      localStorage.setItem('scrumps-mailing-list', email);
    } catch {
      /* ignore storage failures */
    }
    setSignedUp(true);
  };

  const linkRow = (links: typeof STREAMING_LINKS) => (
    <div className="grid grid-cols-2 gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-2 text-sm transition-colors"
        >
          <span className="text-lg">{l.icon}</span>
          <span>{l.label}</span>
        </a>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl border-4 border-yellow-500 bg-gradient-to-b from-[#1d2545] to-[#10162e] text-white p-5 scanlines animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="font-pixel text-base text-center text-shimmer mb-1">THE SCRUMPS</h2>
        <p className="text-center text-yellow-200/70 text-[10px] font-mono mb-5">
          official band HQ
        </p>

        <section className="mb-5">
          <h3 className="font-pixel text-[11px] text-yellow-300 mb-2">🎧 LISTEN</h3>
          {linkRow(STREAMING_LINKS)}
        </section>

        <section className="mb-5 grid grid-cols-2 gap-2">
          <a
            href={SHOWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-pink-500/20 hover:bg-pink-500/30 rounded-lg py-4 transition-colors"
          >
            <span className="text-2xl">🎤</span>
            <span className="text-sm mt-1">Live Shows</span>
          </a>
          <a
            href={MERCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-green-500/20 hover:bg-green-500/30 rounded-lg py-4 transition-colors"
          >
            <span className="text-2xl">👕</span>
            <span className="text-sm mt-1">Merch</span>
          </a>
        </section>

        <section className="mb-5">
          <h3 className="font-pixel text-[11px] text-yellow-300 mb-2">📡 FOLLOW</h3>
          {linkRow(SOCIAL_LINKS)}
        </section>

        <section>
          <h3 className="font-pixel text-[11px] text-yellow-300 mb-2">✉️ JOIN THE PARTY LIST</h3>
          {signedUp ? (
            <p className="text-green-300 text-sm bg-green-500/10 rounded-md px-3 py-3 text-center">
              You're on the list. See you at the next one. 🍺
            </p>
          ) : (
            <form onSubmit={handleSignup} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 min-w-0 rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm placeholder-white/40 focus:outline-none focus:border-yellow-400"
              />
              <button
                type="submit"
                className="bg-yellow-400 text-black font-bold rounded-md px-4 py-2 text-sm hover:bg-yellow-300"
              >
                Join
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
