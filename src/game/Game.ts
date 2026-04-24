import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { DistrictScene } from '../scenes/DistrictScene';
import { ClosingEncounterScene } from '../scenes/ClosingEncounterScene';
import { ServiceJobScene } from '../scenes/ServiceJobScene';
import { DayCloseScene } from '../scenes/DayCloseScene';
import { GAME_HEIGHT, GAME_WIDTH } from './config';

export function createGame(parentId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentId,
    backgroundColor: '#0f1a14',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [
      BootScene,
      PreloadScene,
      DistrictScene,
      ClosingEncounterScene,
      ServiceJobScene,
      DayCloseScene,
    ],
  };
  return new Phaser.Game(config);
}
