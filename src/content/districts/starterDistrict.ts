import { TILE_INDEX } from '../../scenes/PreloadScene';
import type { DistrictData } from '../../types';

const T = TILE_INDEX;

function buildStarterDistrict(): DistrictData {
  const W = 50;
  const H = 34;
  const tiles: number[][] = Array.from({ length: H }, () => Array<number>(W).fill(T.GRASS));

  // Tree border
  for (let x = 0; x < W; x++) {
    tiles[0][x] = T.TREE;
    tiles[H - 1][x] = T.TREE;
  }
  for (let y = 0; y < H; y++) {
    tiles[y][0] = T.TREE;
    tiles[y][W - 1] = T.TREE;
  }

  // Main road running horizontally through the middle
  for (let x = 1; x < W - 1; x++) {
    tiles[17][x] = T.ROAD;
    tiles[18][x] = T.ROAD;
  }
  // Sidewalks edging the road
  for (let x = 1; x < W - 1; x++) {
    tiles[16][x] = T.SIDEWALK;
    tiles[19][x] = T.SIDEWALK;
  }

  // Vertical sidewalks connecting to the road (cross streets)
  const crossWalkCols = [6, 20, 35, 45];
  for (const cx of crossWalkCols) {
    for (let y = 1; y < H - 1; y++) {
      if (tiles[y][cx] === T.GRASS) tiles[y][cx] = T.SIDEWALK;
    }
  }

  const placeHouse = (tx: number, ty: number, doorOnSouth: boolean): void => {
    const hw = 5;
    const hh = 4;
    for (let y = 0; y < hh; y++) {
      for (let x = 0; x < hw; x++) {
        const wx = tx + x;
        const wy = ty + y;
        if (wx <= 0 || wx >= W - 1 || wy <= 0 || wy >= H - 1) continue;
        tiles[wy][wx] = y === 0 ? T.ROOF : T.WALL;
      }
    }
    const doorX = tx + Math.floor(hw / 2);
    const doorY = doorOnSouth ? ty + hh - 1 : ty;
    if (doorX > 0 && doorX < W - 1 && doorY > 0 && doorY < H - 1) {
      tiles[doorY][doorX] = T.DOOR;
    }

    // Driveway strip leading from the door toward the road
    if (doorOnSouth) {
      for (let y = ty + hh; y <= ty + hh + 3; y++) {
        if (y >= H - 1) break;
        if (tiles[y][doorX] === T.GRASS) tiles[y][doorX] = T.DRIVEWAY;
      }
    } else {
      for (let y = ty - 1; y >= ty - 4; y--) {
        if (y <= 0) break;
        if (tiles[y][doorX] === T.GRASS) tiles[y][doorX] = T.DRIVEWAY;
      }
    }

    // Front-yard fence line and sparse flower decoration
    const fy = doorOnSouth ? ty - 1 : ty + hh;
    if (fy > 0 && fy < H - 1) {
      const left = tx - 1;
      const right = tx + hw;
      if (left > 0 && tiles[fy][left] === T.GRASS) tiles[fy][left] = T.FENCE;
      if (right < W - 1 && tiles[fy][right] === T.GRASS) tiles[fy][right] = T.FENCE;
      for (let x = tx; x < tx + hw; x++) {
        if (x === doorX) continue;
        if (x <= 0 || x >= W - 1) continue;
        if (tiles[fy][x] === T.GRASS && ((x - tx) % 2 === 0)) {
          tiles[fy][x] = T.FLOWER;
        }
      }
    }
  };

  // North row: houses face south toward road
  placeHouse(2, 9, true);
  placeHouse(12, 9, true);
  placeHouse(26, 9, true);
  placeHouse(40, 9, true);

  // South row: houses face north toward road
  placeHouse(2, 23, false);
  placeHouse(12, 23, false);
  placeHouse(26, 23, false);
  placeHouse(40, 23, false);

  // Small decorative tree in park strip near the road
  tiles[3][32] = T.TREE;
  tiles[3][33] = T.FLOWER;
  tiles[30][8] = T.TREE;
  tiles[30][33] = T.TREE;

  return {
    id: 'starter_district',
    name: 'Sycamore Ridge',
    width: W,
    height: H,
    tiles,
    spawn: { tileX: 20, tileY: 16 },
  };
}

export const starterDistrict: DistrictData = buildStarterDistrict();
