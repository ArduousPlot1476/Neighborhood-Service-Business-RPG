import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';

export const TILESET_KEY = 'tiles';
export const PERSON_KEY = 'person';

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

const TILE_COUNT = 10;
const PERSON_W = 12;
const PERSON_H = 16;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    this.renderTileset();
    this.renderPerson();
    this.scene.start('DistrictScene');
  }

  private renderTileset(): void {
    const g = this.add.graphics();
    g.setVisible(false);

    const palette = {
      grass: 0x446b2a,
      grassLo: 0x2f5120,
      grassHi: 0x5e8a3a,
      sidewalk: 0xb8b5a6,
      sidewalkEdge: 0x8a8575,
      road: 0x333333,
      roadLine: 0xd9c78a,
      driveway: 0x8a8a8a,
      drivewayLo: 0x6a6a6a,
      wall: 0xc48a5a,
      wallLo: 0x8a5a33,
      wallMid: 0xa06a3a,
      roofA: 0x6b2a2a,
      roofB: 0x4a1a1a,
      fencePost: 0xd9c78a,
      fenceRail: 0xa08a54,
      trunk: 0x6a3a1a,
      leaves: 0x24421a,
      leavesHi: 0x3a6b24,
      door: 0x3a2410,
      doorKnob: 0xdac070,
      flowerA: 0xe66b8a,
      flowerB: 0xf0d04a,
    };

    const ox = (i: number): number => i * TILE_SIZE;
    let x: number;

    // GRASS
    x = ox(TILE_INDEX.GRASS);
    g.fillStyle(palette.grass, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.grassLo, 1)
      .fillRect(x + 3, 4, 1, 1)
      .fillRect(x + 10, 8, 1, 1)
      .fillRect(x + 5, 12, 1, 1);
    g.fillStyle(palette.grassHi, 1)
      .fillRect(x + 7, 3, 1, 1)
      .fillRect(x + 12, 11, 1, 1);

    // SIDEWALK
    x = ox(TILE_INDEX.SIDEWALK);
    g.fillStyle(palette.sidewalk, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.sidewalkEdge, 1)
      .fillRect(x, 0, TILE_SIZE, 1)
      .fillRect(x, TILE_SIZE - 1, TILE_SIZE, 1);

    // ROAD
    x = ox(TILE_INDEX.ROAD);
    g.fillStyle(palette.road, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.roadLine, 1).fillRect(x + 6, 7, 4, 2);

    // DRIVEWAY
    x = ox(TILE_INDEX.DRIVEWAY);
    g.fillStyle(palette.driveway, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.drivewayLo, 1)
      .fillRect(x + 2, 4, 1, 1)
      .fillRect(x + 11, 10, 1, 1);

    // WALL
    x = ox(TILE_INDEX.WALL);
    g.fillStyle(palette.wall, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.wallMid, 1).fillRect(x, 7, TILE_SIZE, 1);
    g.fillStyle(palette.wallLo, 1)
      .fillRect(x, 0, TILE_SIZE, 1)
      .fillRect(x, TILE_SIZE - 1, TILE_SIZE, 1)
      .fillRect(x, 0, 1, TILE_SIZE)
      .fillRect(x + TILE_SIZE - 1, 0, 1, TILE_SIZE);

    // ROOF
    x = ox(TILE_INDEX.ROOF);
    g.fillStyle(palette.roofA, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.roofB, 1);
    for (let i = 0; i < TILE_SIZE; i += 4) {
      g.fillRect(x + i, 0, 1, TILE_SIZE);
    }

    // FENCE
    x = ox(TILE_INDEX.FENCE);
    g.fillStyle(palette.grass, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.fencePost, 1)
      .fillRect(x + 1, 4, 2, 10)
      .fillRect(x + 7, 4, 2, 10)
      .fillRect(x + 13, 4, 2, 10);
    g.fillStyle(palette.fenceRail, 1)
      .fillRect(x + 1, 6, 14, 1)
      .fillRect(x + 1, 11, 14, 1);

    // TREE
    x = ox(TILE_INDEX.TREE);
    g.fillStyle(palette.grass, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.trunk, 1).fillRect(x + 7, 11, 2, 4);
    g.fillStyle(palette.leaves, 1)
      .fillRect(x + 3, 3, 10, 7)
      .fillRect(x + 2, 5, 12, 4);
    g.fillStyle(palette.leavesHi, 1)
      .fillRect(x + 5, 4, 3, 2)
      .fillRect(x + 9, 7, 2, 1);

    // DOOR
    x = ox(TILE_INDEX.DOOR);
    g.fillStyle(palette.wall, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.door, 1).fillRect(x + 4, 2, 8, 14);
    g.fillStyle(palette.doorKnob, 1).fillRect(x + 10, 9, 1, 1);
    g.fillStyle(palette.wallLo, 1)
      .fillRect(x, 0, TILE_SIZE, 1)
      .fillRect(x, TILE_SIZE - 1, TILE_SIZE, 1);

    // FLOWER
    x = ox(TILE_INDEX.FLOWER);
    g.fillStyle(palette.grass, 1).fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(palette.flowerA, 1)
      .fillRect(x + 3, 3, 2, 2)
      .fillRect(x + 11, 5, 2, 2)
      .fillRect(x + 6, 9, 2, 2);
    g.fillStyle(palette.flowerB, 1)
      .fillRect(x + 8, 3, 2, 2)
      .fillRect(x + 2, 11, 2, 2)
      .fillRect(x + 12, 11, 2, 2);

    g.generateTexture(TILESET_KEY, TILE_SIZE * TILE_COUNT, TILE_SIZE);
    g.destroy();
  }

  private renderPerson(): void {
    const g = this.add.graphics();
    g.setVisible(false);

    // head/skin
    g.fillStyle(0xf0c090, 1).fillRect(3, 2, 6, 5);
    // hair cap
    g.fillStyle(0x3a2a14, 1)
      .fillRect(3, 1, 6, 2)
      .fillRect(2, 2, 1, 2)
      .fillRect(9, 2, 1, 2);
    // eyes
    g.fillStyle(0x101010, 1).fillRect(4, 5, 1, 1).fillRect(7, 5, 1, 1);
    // shirt
    g.fillStyle(0xffffff, 1).fillRect(2, 7, 8, 5);
    // arms
    g.fillStyle(0xf0c090, 1).fillRect(1, 8, 1, 3).fillRect(10, 8, 1, 3);
    // pants
    g.fillStyle(0x3a3a5a, 1).fillRect(3, 12, 6, 3);
    // shoes
    g.fillStyle(0x1a1a1a, 1).fillRect(3, 15, 2, 1).fillRect(7, 15, 2, 1);

    g.generateTexture(PERSON_KEY, PERSON_W, PERSON_H);
    g.destroy();
  }
}
