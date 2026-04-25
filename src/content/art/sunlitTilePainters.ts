import { SUNLIT_HEX } from './sunlitTokens';

const T = SUNLIT_HEX;

export type TilePainter = (ctx: CanvasRenderingContext2D, tx: number, ty: number) => void;

function noise(x: number, y: number, seed = 0): number {
  const k = (x * 73856093) ^ (y * 19349663) ^ (seed * 83492791);
  return ((k % 100) + 100) % 100;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const paintGrass: TilePainter = (ctx, tx, ty) => {
  rect(ctx, 0, 0, 16, 16, T.grassMid);
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const v = noise(tx * 16 + x, ty * 16 + y);
      if (v < 8) px(ctx, x, y, T.grassLite);
      else if (v > 92) px(ctx, x, y, T.grassDeep);
    }
  }
  if (noise(tx, ty, 1) < 50) {
    px(ctx, 4 + (noise(tx, ty, 2) % 8), 4 + (noise(tx, ty, 3) % 8), T.grassLite);
    px(ctx, 9 + (noise(tx, ty, 4) % 4), 11 + (noise(tx, ty, 5) % 3), T.grassLite);
  }
};

const paintSidewalk: TilePainter = (ctx) => {
  rect(ctx, 0, 0, 16, 16, T.sidewalk);
  rect(ctx, 0, 7, 16, 1, T.sidewalkShade);
  rect(ctx, 7, 0, 1, 16, T.sidewalkShade);
  px(ctx, 2, 2, T.sidewalkHi);
  px(ctx, 13, 4, T.sidewalkHi);
  px(ctx, 5, 11, T.sidewalkHi);
  px(ctx, 11, 13, T.sidewalkHi);
};

const paintRoad: TilePainter = (ctx, tx, ty) => {
  rect(ctx, 0, 0, 16, 16, T.road);
  for (let i = 0; i < 6; i += 1) {
    const x = noise(tx, ty, i + 1) % 16;
    const y = noise(tx, ty, i + 11) % 16;
    px(ctx, x, y, '#48433a');
  }
};

const paintDriveway: TilePainter = (ctx, tx, ty) => {
  rect(ctx, 0, 0, 16, 16, T.driveway);
  rect(ctx, 0, 0, 16, 1, T.drivewayHi);
  rect(ctx, 0, 15, 16, 1, T.drivewayLo);
  for (let i = 0; i < 4; i += 1) {
    const x = noise(tx, ty, i + 21) % 16;
    const y = noise(tx, ty, i + 31) % 16;
    px(ctx, x, y, T.drivewayLo);
  }
};

const paintWall: TilePainter = (ctx) => {
  rect(ctx, 0, 0, 16, 16, T.wallCream);
  rect(ctx, 0, 15, 16, 1, T.wallCreamD);
  rect(ctx, 0, 4, 16, 1, T.wallCreamD);
  rect(ctx, 0, 9, 16, 1, T.wallCreamD);
  rect(ctx, 5, 6, 6, 5, '#3a4a5a');
  rect(ctx, 5, 6, 6, 1, T.wallCreamD);
  rect(ctx, 7, 6, 1, 5, '#8aa4be');
  rect(ctx, 5, 8, 6, 1, '#8aa4be');
};

const paintRoofRed: TilePainter = (ctx) => {
  rect(ctx, 0, 0, 16, 16, T.roofRed);
  rect(ctx, 0, 0, 16, 2, T.roofRedD);
  for (let y = 4; y < 16; y += 4) {
    rect(ctx, 0, y, 16, 1, T.roofRedD);
    for (let x = y % 8 === 0 ? 0 : 4; x < 16; x += 8) {
      rect(ctx, x, y - 3, 1, 3, T.roofRedD);
    }
  }
  rect(ctx, 0, 15, 16, 1, T.roofRedDeep);
};

const paintDoor: TilePainter = (ctx) => {
  paintWall(ctx, 0, 0);
  rect(ctx, 4, 3, 8, 13, T.doorFrame);
  rect(ctx, 5, 4, 6, 11, T.doorWood);
  rect(ctx, 5, 9, 6, 1, T.doorFrame);
  px(ctx, 9, 11, T.sun);
  rect(ctx, 3, 15, 10, 1, T.sidewalk);
};

const paintFence: TilePainter = (ctx, tx, ty) => {
  paintGrass(ctx, tx, ty);
  rect(ctx, 0, 7, 16, 2, T.fenceWhite);
  for (let x = 1; x < 16; x += 3) {
    rect(ctx, x, 4, 1, 8, T.fenceWhite);
    px(ctx, x, 3, T.fenceWhite);
    px(ctx, x, 11, T.fenceShade);
  }
  rect(ctx, 0, 9, 16, 1, T.fenceShade);
};

const paintTree: TilePainter = (ctx, tx, ty) => {
  paintGrass(ctx, tx, ty);
  rect(ctx, 3, 1, 10, 10, T.hedgeMid);
  rect(ctx, 2, 3, 12, 6, T.hedgeMid);
  rect(ctx, 4, 0, 8, 1, T.hedgeMid);
  rect(ctx, 9, 4, 4, 6, T.hedgeDark);
  rect(ctx, 3, 9, 10, 2, T.hedgeDark);
  px(ctx, 5, 2, T.grassLite);
  px(ctx, 6, 1, T.grassLite);
  px(ctx, 4, 4, T.grassLite);
  px(ctx, 7, 3, T.grassLite);
  rect(ctx, 7, 11, 2, 4, T.bark);
  px(ctx, 6, 14, T.bark);
  px(ctx, 9, 14, T.bark);
};

const paintFlower: TilePainter = (ctx, tx, ty) => {
  paintGrass(ctx, tx, ty);
  px(ctx, 3, 5, T.flowerPink);
  px(ctx, 4, 4, T.flowerPink);
  px(ctx, 4, 5, T.flowerWhite);
  px(ctx, 9, 8, T.flowerBlue);
  px(ctx, 10, 7, T.flowerBlue);
  px(ctx, 10, 8, T.flowerWhite);
  px(ctx, 6, 11, T.sun);
  px(ctx, 7, 10, T.sun);
  px(ctx, 7, 11, T.flowerWhite);
  px(ctx, 3, 6, T.grassDeep);
  px(ctx, 11, 9, T.grassDeep);
  px(ctx, 6, 12, T.grassDeep);
};

/**
 * Tile id registry — kept aligned with the existing Phaser PreloadScene
 * TILE_INDEX (0..9) so the starter district's tile data stays valid without
 * remapping. Service-job zone tiles are listed but not yet referenced by any
 * tilemap; they exist as a content seam for a future ServiceJobScene reskin.
 */
export const SUNLIT_TILE_PAINTERS: ReadonlyArray<TilePainter> = [
  paintGrass, // 0 GRASS
  paintSidewalk, // 1 SIDEWALK
  paintRoad, // 2 ROAD
  paintDriveway, // 3 DRIVEWAY
  paintWall, // 4 WALL
  paintRoofRed, // 5 ROOF
  paintFence, // 6 FENCE
  paintTree, // 7 TREE
  paintDoor, // 8 DOOR
  paintFlower, // 9 FLOWER
];

/**
 * Render the full tileset into one strip texture (16 px × N tiles wide).
 * Returns the canvas; the caller is responsible for adding it to Phaser.
 */
export function renderSunlitTileset(): HTMLCanvasElement {
  const tileCount = SUNLIT_TILE_PAINTERS.length;
  const canvas = document.createElement('canvas');
  canvas.width = 16 * tileCount;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('renderSunlitTileset: 2D context unavailable.');
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < tileCount; i += 1) {
    const painter = SUNLIT_TILE_PAINTERS[i]!;
    ctx.save();
    ctx.translate(i * 16, 0);
    painter(ctx, i, 0);
    ctx.restore();
  }
  return canvas;
}
