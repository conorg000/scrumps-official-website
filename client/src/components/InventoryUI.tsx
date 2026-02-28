import React from 'react';

interface InventoryUIProps {
  hollandiaCount: number;
  collectedCDs: string[];
  hasCompost: boolean;
  hasLadder: boolean;
  hasXray: boolean;
  mrTibblesJoined: boolean;
  possumFed: boolean;
  tinyClownJoined: boolean;
  humunculousJoined: boolean;
  isChaseActive: boolean;
}

export const InventoryUI: React.FC<InventoryUIProps> = ({
  hollandiaCount,
  collectedCDs,
  hasCompost,
  hasLadder,
  hasXray,
  mrTibblesJoined,
  possumFed,
  tinyClownJoined,
  humunculousJoined,
  isChaseActive,
}) => {
  const hasHeldItems = hasLadder || hasXray || hasCompost;
  const hasCompanions = mrTibblesJoined || possumFed || tinyClownJoined || humunculousJoined;

  return (
    <div
      className={`fixed bottom-24 left-4 bg-black/70 text-white px-3 py-2 rounded-lg font-mono text-xs z-40 space-y-1 border ${
        isChaseActive ? 'border-red-500 animate-pulse' : 'border-gray-600'
      }`}
    >
      <div className="flex gap-3">
        <span>🍺 {hollandiaCount}/5</span>
        <span>💿 {collectedCDs.length}/4</span>
      </div>

      {hasHeldItems && (
        <div className="flex gap-2">
          {hasLadder && <span>🪜</span>}
          {hasXray && <span>🔬</span>}
          {hasCompost && <span>🥬</span>}
        </div>
      )}

      {hasCompanions && (
        <div className="flex gap-2">
          {mrTibblesJoined && <span>🐱</span>}
          {possumFed && <span>🦝</span>}
          {tinyClownJoined && <span>🤡</span>}
          {humunculousJoined && <span>💀</span>}
        </div>
      )}
    </div>
  );
};
