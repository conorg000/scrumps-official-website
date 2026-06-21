import React, { useState } from 'react';

export interface QuestState {
  mrTibblesJoined: boolean;
  hasCompost: boolean;
  possumFed: boolean;
  collectedCDs: number;
  hollandiaCount: number;
  tinyClownJoined: boolean;
  hasXray: boolean;
  humunculousJoined: boolean;
  hasLadder: boolean;
  isChaseActive: boolean;
  hasJumpedToPool: boolean;
  bushTurkeyDefeated: boolean;
  gameEnded: boolean;
}

// The single most relevant next step, given current progress.
function currentObjective(s: QuestState): string {
  if (s.gameEnded) return 'Party forever. 🎉';
  if (s.bushTurkeyDefeated) return 'You won! Talk to Mr Feng.';
  if (s.hasJumpedToPool) return 'Fight the bush turkey at the boxing ring!';
  if (s.isChaseActive) return 'RUN! Get to the roof and jump in the pool!';
  if (!s.mrTibblesJoined) return 'Investigate the backyard — find Mr Tibbles.';
  if (!s.possumFed && !s.hasCompost) return 'Find compost on the balcony for the possum.';
  if (!s.possumFed && s.hasCompost) return 'Give the compost to the possum downstairs.';
  if (s.collectedCDs < 4) return `Collect the band's records (${s.collectedCDs}/4 CDs).`;
  if (!s.hasXray) return 'Find the x-ray in the bedroom for the skeleton.';
  if (!s.humunculousJoined) return 'Give the x-ray to the skeleton on the front porch.';
  if (s.hollandiaCount < 5) return `Find Hollandia cans for Tiny Clown (${s.hollandiaCount}/5).`;
  if (!s.tinyClownJoined) return 'Give 5 cans to Tiny Clown in the living room.';
  if (!s.hasLadder) return 'Grab the ladder in the backyard.';
  return 'Crank the music and trigger the chase!';
}

export const QuestLog: React.FC<QuestState> = (s) => {
  const [open, setOpen] = useState(true);

  const checklist: Array<[boolean, string]> = [
    [s.mrTibblesJoined, 'Meet Mr Tibbles'],
    [s.possumFed, 'Recruit the possum'],
    [s.collectedCDs >= 4, `Records ${s.collectedCDs}/4`],
    [s.hollandiaCount >= 5, `Hollandia ${s.hollandiaCount}/5`],
    [s.tinyClownJoined, 'Recruit Tiny Clown'],
    [s.humunculousJoined, 'Recruit the skeleton'],
    [s.bushTurkeyDefeated, 'Beat the bush turkey'],
  ];
  const done = checklist.filter(([c]) => c).length;
  const pct = Math.round((done / checklist.length) * 100);

  return (
    <div className="fixed top-20 left-4 z-40 w-56 max-w-[70vw] font-mono text-xs select-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-t-lg bg-black/80 text-yellow-300 border border-yellow-600/60 ${
          s.isChaseActive ? 'animate-pulse border-red-500 text-red-300' : ''
        } ${open ? '' : 'rounded-b-lg'}`}
      >
        <span className="font-bold">🎯 QUEST</span>
        <span className="text-[10px] text-yellow-200/70">{pct}% · {open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div className="bg-black/75 text-white border border-t-0 border-yellow-600/60 rounded-b-lg px-3 py-2 space-y-2">
          <p className="text-[11px] leading-snug text-yellow-100">
            <span className="text-yellow-400">▸ </span>
            {currentObjective(s)}
          </p>
          <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="space-y-0.5 pt-1">
            {checklist.map(([cleared, label]) => (
              <li key={label} className={cleared ? 'text-green-400' : 'text-white/45'}>
                {cleared ? '☑' : '☐'} {label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
