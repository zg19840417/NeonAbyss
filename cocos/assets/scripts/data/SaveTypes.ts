import type { GameRuntimeState } from './RuntimeTypes';

export interface SaveMeta {
  version: string;
  created_at: number;
  updated_at: number;
}

export interface SaveData {
  meta: SaveMeta;
  runtime: GameRuntimeState;
}

export interface SaveSlotSummary {
  slot_id: string;
  updated_at: number;
  chapter_id: string | null;
  stage_id: string | null;
  unlocked_girl_count: number;
}
