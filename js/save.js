import { SAVE_KEY, defaultState } from "./data.js";

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveGame(state) {
  state.lastSave = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportSave(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(b64) {
  const json = decodeURIComponent(escape(atob(b64)));
  return { ...defaultState(), ...JSON.parse(json) };
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return defaultState();
}
