import { migrateState, defaultState } from "./data.js";

export const SAVE_KEY = "oleg_simulator_save_v3";

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    return migrateState(JSON.parse(raw));
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
  return migrateState(JSON.parse(decodeURIComponent(escape(atob(b64)))));
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return defaultState();
}
