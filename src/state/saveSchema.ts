import type { SerializedGameState } from './GameState';

export const SAVE_SCHEMA_VERSION = 1;

export interface SaveEnvelope {
  readonly schemaVersion: number;
  readonly appVersion: string;
  readonly savedAt: number;
  readonly payload: SerializedGameState;
}

export function isLikelyEnvelope(value: unknown): value is SaveEnvelope {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.schemaVersion === 'number' &&
    typeof v.savedAt === 'number' &&
    typeof v.appVersion === 'string' &&
    !!v.payload &&
    typeof v.payload === 'object'
  );
}
