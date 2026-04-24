import type { GameState, SerializedGameState } from './GameState';
import {
  SAVE_SCHEMA_VERSION,
  isLikelyEnvelope,
  type SaveEnvelope,
} from './saveSchema';

const STORAGE_KEY = 'nrpg:save:v1';
const APP_VERSION = '0.6.0';

export type SaveOutcome =
  | { readonly status: 'ok'; readonly savedAt: number }
  | { readonly status: 'unsupported'; readonly reason: string }
  | { readonly status: 'error'; readonly reason: string };

export type LoadOutcome =
  | { readonly status: 'missing' }
  | { readonly status: 'incompatible'; readonly reason: string }
  | { readonly status: 'corrupt'; readonly reason: string }
  | { readonly status: 'ok'; readonly envelope: SaveEnvelope };

export type ClearOutcome = { readonly status: 'ok' } | { readonly status: 'error'; readonly reason: string };

export function hasSavedGame(): boolean {
  if (!isStorageAvailable()) return false;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}

export function writeSave(state: GameState): SaveOutcome {
  if (!isStorageAvailable()) {
    return { status: 'unsupported', reason: 'localStorage is not available in this browser.' };
  }
  const envelope: SaveEnvelope = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    savedAt: Date.now(),
    payload: state.toJSON(),
  };
  try {
    const serialized = JSON.stringify(envelope);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return { status: 'ok', savedAt: envelope.savedAt };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    return { status: 'error', reason };
  }
}

export function readSave(): LoadOutcome {
  if (!isStorageAvailable()) {
    return { status: 'incompatible', reason: 'localStorage is not available in this browser.' };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return { status: 'missing' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'invalid JSON';
    return { status: 'corrupt', reason };
  }
  if (!isLikelyEnvelope(parsed)) {
    return { status: 'corrupt', reason: 'save envelope shape is invalid' };
  }
  if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION) {
    return {
      status: 'incompatible',
      reason: `save schema is v${parsed.schemaVersion}; this build expects v${SAVE_SCHEMA_VERSION}`,
    };
  }
  const payload = parsed.payload as SerializedGameState;
  if (
    !Array.isArray(payload.prospects) ||
    !Array.isArray(payload.deals) ||
    !Array.isArray(payload.accounts) ||
    !Array.isArray(payload.jobs) ||
    !Array.isArray(payload.disruptions)
  ) {
    return { status: 'corrupt', reason: 'save payload is missing one or more state domains' };
  }
  return { status: 'ok', envelope: parsed };
}

export function clearSave(): ClearOutcome {
  if (!isStorageAvailable()) {
    return { status: 'error', reason: 'localStorage is not available in this browser.' };
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return { status: 'ok' };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    return { status: 'error', reason };
  }
}

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__nrpg_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
