export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface TilePos {
  readonly tileX: number;
  readonly tileY: number;
}

export interface NpcData {
  readonly id: string;
  readonly name: string;
  readonly tileX: number;
  readonly tileY: number;
  readonly tint: number;
  readonly role: string;
  readonly dialogueId: string;
}

export interface DistrictData {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly tiles: ReadonlyArray<ReadonlyArray<number>>;
  readonly spawn: TilePos;
}

export type SceneState = 'EXPLORING' | 'DIALOGUE' | 'INFO_PANEL' | 'ENCOUNTER';
