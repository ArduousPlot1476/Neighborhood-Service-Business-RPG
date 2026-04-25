import { SUNLIT_HEX } from './sunlitTokens';

const T = SUNLIT_HEX;

export interface SunlitCharacter {
  readonly id: string;
  readonly name: string;
  readonly grid: ReadonlyArray<string>;
  readonly legend: Readonly<Record<string, string>>;
}

const playerLegend: Record<string, string> = {
  K: T.ink,
  s: '#e8c8a0',
  w: '#f4dec0',
  h: '#3a2418',
  c: '#4a6e3a',
  m: '#365228',
  p: '#3a2818',
  b: '#1a1410',
  a: '#5a3a22',
};

const playerGrid = [
  '................',
  '......KKKK......',
  '.....KaaaaK.....',
  '....KaaaaaaK....',
  '....KsssssK.....',
  '....KsswssK.....',
  '....KsKsKsK.....',
  '....KsssssK.....',
  '...KcccccccK....',
  '..KccccccccK....',
  '..KcccccccccK...',
  '..Kccccccccmm...',
  '..Kcccccccmmm...',
  '..Kccccccmmmm...',
  '..Kccccccmmmm...',
  '..KccccccmmmmK..',
  '...Kpppppppp....',
  '...Kpppppppp....',
  '...KppKKKppp....',
  '...Kppp..ppp....',
  '...Kppp..ppp....',
  '...Kbbb..bbb....',
  '...KbbK..KbbK...',
  '....KK....KK....',
];

const jerryLegend: Record<string, string> = {
  K: T.ink,
  s: '#d4a878',
  w: '#e8c89a',
  h: '#5a3a22',
  c: '#6aa8d9',
  m: '#3e7aae',
  p: '#a48748',
  b: '#3a2418',
};

const jerryGrid = [
  '................',
  '......KKKK......',
  '.....KhhhhK.....',
  '....KhhhhhhK....',
  '....KsssssK.....',
  '....KsswssK.....',
  '....KsKsKsK.....',
  '....KsssssK.....',
  '....KsssssK.....',
  '...KccccccccK...',
  '..Kccccccccmm...',
  '..Kccccccccmm...',
  '..Kcccccccmmmm..',
  '..Kcccccccmmmm..',
  '..Kcccccccmmmm..',
  '...KKccccccmm...',
  '....Kpppppp.....',
  '....Kpppppp.....',
  '....Kpppppp.....',
  '....KppKKpp.....',
  '....Kss..ssK....',
  '....Kss..ssK....',
  '....Kbbb.bbb....',
  '....KKK..KKK....',
];

const lindaLegend: Record<string, string> = {
  K: T.ink,
  s: '#e0c0a0',
  w: '#efd9bb',
  h: '#a89a86',
  c: '#e26ba0',
  m: '#a8487a',
  p: '#5a4a3a',
  b: '#3a2418',
  a: '#f4e9d0',
};

const lindaGrid = [
  '................',
  '......KKKK......',
  '.....KhhhhK.....',
  '....KhhhhhhK....',
  '....KaaaaaaK....',
  '....KsssssK.....',
  '...KKsKsKsKK....',
  '...KaKsKsKaK....',
  '....KsssssK.....',
  '...KccccccccK...',
  '..Kccccccccmm...',
  '..KccccccccmmK..',
  '..KccaaccaaccmK.',
  '..Kccccccccmmm..',
  '..Kccccccccmmm..',
  '..Kccccccccmmm..',
  '...KppppppppK...',
  '....Kppppppp....',
  '....Kppppppp....',
  '....Kppppppp....',
  '....Kppppppp....',
  '....Kppppppp....',
  '....Kbb..bbK....',
  '....KK....KK....',
];

const marcusLegend: Record<string, string> = {
  K: T.ink,
  s: '#c89878',
  w: '#dcae8a',
  h: '#1a1410',
  c: '#3a4a5a',
  m: '#1e2a3a',
  p: '#1a1410',
  b: '#1a1410',
  r: '#a48748',
};

const marcusGrid = [
  '................',
  '......KKKKK.....',
  '.....KhhhhhK....',
  '....KhhhhhhK....',
  '....KsssssK.....',
  '....KsswssK.....',
  '....KsKsKsK.....',
  '....KsKKsKK.....',
  '....KsssssK.....',
  '...KccccccccK...',
  '..KccccwccccK...',
  '..Kccccwcccmm...',
  '..Kcccwwwccmm...',
  '..Kccccwccccmm..',
  '..Kccccwccccmm..',
  '..KccccwcccmmK..',
  '..KKccccccccmK..',
  '..rrrrrrrrr.....',
  '..rwwwwwwwr.....',
  '..rwwwwwwwr.....',
  '...Kppppppp.....',
  '...Kpppppp......',
  '...Kbb.bbK......',
  '....KK..KK......',
];

const patLegend: Record<string, string> = {
  K: T.ink,
  s: '#d4a878',
  w: '#e8c89a',
  h: '#5a3a22',
  c: '#a23a1c',
  p: '#4a6e3a',
  m: '#2a4220',
  b: '#3a2418',
  a: '#a48748',
};

const patGrid = [
  '......KKKK......',
  '....KKaaaaKK....',
  '...KaaaaaaaaK...',
  '...KaaaaaaaaK...',
  '....KsssssK.....',
  '....KsswssK.....',
  '....KsKsKsK.....',
  '....KsssssK.....',
  '...KKsssssKK....',
  '..KKpppppppKK...',
  '..Kppppppppmm...',
  '..KKpwwwppppmm..',
  '..Kpppppppppmm..',
  '..Kpppppppppmm..',
  '..KccpppppppmK..',
  '..Kpcppppppmmm..',
  '..Kpppppppppmm..',
  '..KppppKKppppm..',
  '...Kpppp.pppp...',
  '...Kpppp.pppp...',
  '...Kpppp.pppp...',
  '...Kss....ssK...',
  '...Kbbb..bbbK...',
  '...KKK....KKK...',
];

const ironrootLegend: Record<string, string> = {
  K: T.ink,
  s: '#b89a76',
  w: '#d4b48e',
  h: '#1a1410',
  c: '#2a2826',
  i: '#6e6a64',
  p: '#1a1410',
  b: '#1a1410',
  r: '#a23a1c',
};

const ironrootGrid = [
  '................',
  '......KKKK......',
  '.....KhhhhK.....',
  '....KhhhhwhK....',
  '....KsssssK.....',
  '....KsKsKsK.....',
  '....KsKKsKK.....',
  '....KsssssK.....',
  '....KKcccKK.....',
  '...KcccccccK....',
  '..KciiccciicK...',
  '..Kciiwccciic...',
  '..Kcicccccciic..',
  '..Kccccccccccc..',
  '..Kccccccccccc..',
  '..KKccccccccKK..',
  '...Kpppppppp....',
  '..rrrrrrr.pp....',
  '..riiiiiir.p....',
  '..rrrrrrrr.p....',
  '....Kpppp.pp....',
  '....Kss..ssK....',
  '....Kbbb.bbb....',
  '....KKK..KKK....',
];

export const SUNLIT_CHARACTERS: ReadonlyArray<SunlitCharacter> = [
  { id: 'player', name: 'Player', grid: playerGrid, legend: playerLegend },
  { id: 'jerry_porter', name: 'Jerry Porter', grid: jerryGrid, legend: jerryLegend },
  { id: 'linda_ruiz', name: 'Linda Ruiz', grid: lindaGrid, legend: lindaLegend },
  { id: 'marcus_webb', name: 'Marcus Webb', grid: marcusGrid, legend: marcusLegend },
  { id: 'pat_haller', name: 'Pat Haller', grid: patGrid, legend: patLegend },
  { id: 'ironroot_rep', name: 'IronRoot Rep', grid: ironrootGrid, legend: ironrootLegend },
];

export const SUNLIT_CHARACTER_WIDTH = 16;
export const SUNLIT_CHARACTER_HEIGHT = 24;

/**
 * Render a single character grid into a fresh canvas.
 * Each cell is a single pixel; '.' / ' ' are transparent.
 */
export function renderCharacter(character: SunlitCharacter): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SUNLIT_CHARACTER_WIDTH;
  canvas.height = SUNLIT_CHARACTER_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('renderCharacter: 2D context unavailable.');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < character.grid.length && y < SUNLIT_CHARACTER_HEIGHT; y += 1) {
    const row = character.grid[y]!;
    for (let x = 0; x < row.length && x < SUNLIT_CHARACTER_WIDTH; x += 1) {
      const ch = row[x]!;
      if (ch === '.' || ch === ' ') continue;
      const color = character.legend[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function characterTextureKey(id: string): string {
  return `sl_char_${id}`;
}
