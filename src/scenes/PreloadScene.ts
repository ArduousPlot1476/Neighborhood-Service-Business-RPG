import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';
import {
  SUNLIT_TILE_PAINTERS,
  renderSunlitTileset,
} from '../content/art/sunlitTilePainters';
import {
  SUNLIT_CHARACTERS,
  SUNLIT_CHARACTER_HEIGHT,
  SUNLIT_CHARACTER_WIDTH,
  characterTextureKey,
  renderCharacter,
} from '../content/art/sunlitCharacters';

export const TILESET_KEY = 'tiles';
export const PERSON_KEY = 'person';

/** Index registry preserved from M1 so the starter district tile data still resolves. */
export const TILE_INDEX = {
  GRASS: 0,
  SIDEWALK: 1,
  ROAD: 2,
  DRIVEWAY: 3,
  WALL: 4,
  ROOF: 5,
  FENCE: 6,
  TREE: 7,
  DOOR: 8,
  FLOWER: 9,
} as const;

export const SOLID_TILE_INDICES: ReadonlyArray<number> = [
  TILE_INDEX.WALL,
  TILE_INDEX.ROOF,
  TILE_INDEX.FENCE,
  TILE_INDEX.TREE,
];

const TILE_COUNT = SUNLIT_TILE_PAINTERS.length;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    this.renderTileset();
    this.renderPersons();
    this.scene.start('DistrictScene');
  }

  private renderTileset(): void {
    const canvas = renderSunlitTileset();
    this.textures.addCanvas(TILESET_KEY, canvas);
    void TILE_COUNT;
  }

  private renderPersons(): void {
    for (const character of SUNLIT_CHARACTERS) {
      const canvas = renderCharacter(character);
      const key = characterTextureKey(character.id);
      this.textures.addCanvas(key, canvas);
    }
    // Keep PERSON_KEY alive as the player's default texture so existing entity
    // construction keeps working without a texture swap.
    if (!this.textures.exists(PERSON_KEY)) {
      const playerCanvas = renderCharacter(SUNLIT_CHARACTERS[0]!);
      this.textures.addCanvas(PERSON_KEY, playerCanvas);
    }
  }
}

export const PERSON_WIDTH = SUNLIT_CHARACTER_WIDTH;
export const PERSON_HEIGHT = SUNLIT_CHARACTER_HEIGHT;
export { TILE_SIZE };
