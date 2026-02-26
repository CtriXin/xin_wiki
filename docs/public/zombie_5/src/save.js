import { SAVE_KEY } from './config.js';

const fallback = { bestLayer: 1, bestKills: 0, bestWave: 0 };

export function loadSave () {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || { ...fallback };
  } catch (_) {
    return { ...fallback };
  }
}

export function saveProgress (game) {
  const latest = loadSave();
  const next = {
    bestLayer: Math.max(latest.bestLayer || 1, game.layer, game.unlockedLayer),
    bestKills: Math.max(latest.bestKills || 0, game.kills),
    bestWave: Math.max(latest.bestWave || 0, game.wave)
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  return next;
}
