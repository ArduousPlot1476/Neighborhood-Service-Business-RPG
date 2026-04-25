/**
 * Sunlit Ledger palette (M7 art direction).
 *
 * Hex string is for canvas / Phaser text colour; numeric form is for Phaser
 * GameObjects (Rectangles, fillStyle, setTint). Source of truth is tokens.js
 * in the design handoff package.
 */

export const SUNLIT_HEX = {
  // Paper / ledger
  ink: '#1a1410',
  inkSoft: '#3a2e24',
  paper: '#f4e9d0',
  paperWarm: '#ecdcb1',
  paperLine: '#c8b27e',
  paperEdge: '#a48748',

  // Greens
  grassDeep: '#3d6b2c',
  grassMid: '#5a8a3a',
  grassLite: '#86b04a',
  hedgeDark: '#244d20',
  hedgeMid: '#3d6e2c',

  // Earth
  soil: '#6b4a2b',
  soilDark: '#4a321d',
  mulch: '#5a3a22',
  bark: '#3e2a18',

  // Sun / accents
  sun: '#f0c43a',
  sunDeep: '#d4a019',
  flowerPink: '#e26ba0',
  flowerWhite: '#f6e8d0',
  flowerBlue: '#6aa8d9',

  // Stone / road
  road: '#5d564b',
  roadStripe: '#e8d28a',
  sidewalk: '#b6ac96',
  sidewalkShade: '#9c937e',
  sidewalkHi: '#c4baa3',
  driveway: '#8a8474',
  drivewayHi: '#9c9684',
  drivewayLo: '#74705f',

  // Houses
  wallCream: '#e2c98e',
  wallCreamD: '#b89a5e',
  roofRed: '#a8482e',
  roofRedD: '#7a3220',
  roofRedDeep: '#5a2418',
  roofBlue: '#456b8a',
  roofBlueD: '#2c4a64',
  roofBlueDeep: '#1e3448',
  doorWood: '#6b3a1e',
  doorFrame: '#3a2818',
  fenceWhite: '#e8dcb8',
  fenceShade: '#a89870',

  // IronRoot
  ironCharcoal: '#2a2826',
  ironRust: '#a23a1c',
  ironRustHi: '#d44e26',
  ironSteel: '#6e6a64',
  ironPaper: '#e8e2d4',

  // Status / risk bands
  riskHealthy: '#5a8a3a',
  riskWatch: '#d4a019',
  riskAtRisk: '#c8741a',
  riskThreat: '#a23a1c',
  riskChurned: '#6e6a64',

  // Aggregates already defined for cross-cutting UI use
  panelBg: '#f4e9d0',
  panelBgWarm: '#ecdcb1',
  panelEdge: '#a48748',
  panelLine: '#c8b27e',
  panelInk: '#1a1410',
  panelInkSoft: '#3a2e24',
  panelMute: '#7a624a',
} as const;

const hexToNum = (hex: string): number => parseInt(hex.replace('#', ''), 16);

type SunlitKey = keyof typeof SUNLIT_HEX;

type SunlitNum = { [K in SunlitKey]: number };

export const SUNLIT_NUM: SunlitNum = Object.fromEntries(
  (Object.entries(SUNLIT_HEX) as Array<[SunlitKey, string]>).map(([k, v]) => [k, hexToNum(v)]),
) as SunlitNum;

export const SUNLIT_FONT_MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace";
