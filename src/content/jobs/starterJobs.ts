import type { AccountPlan } from '../../state/accounts';

export type ZoneKind = 'lawn' | 'edge' | 'beds' | 'hedge' | 'walkway';

export interface YardZone {
  readonly id: string;
  readonly kind: ZoneKind;
  readonly tileX: number;
  readonly tileY: number;
  readonly widthTiles: number;
  readonly heightTiles: number;
  readonly secondsToService: number;
  readonly label: string;
}

export interface YardLayout {
  readonly npcId: string;
  readonly widthTiles: number;
  readonly heightTiles: number;
  readonly playerSpawn: { readonly tileX: number; readonly tileY: number };
  readonly timerSeconds: number;
  readonly title: string;
  readonly zones: ReadonlyArray<YardZone>;
}

const jerryYard: YardLayout = {
  npcId: 'jerry_porter',
  widthTiles: 20,
  heightTiles: 14,
  playerSpawn: { tileX: 10, tileY: 7 },
  timerSeconds: 75,
  title: "Jerry's front and side lawn",
  zones: [
    {
      id: 'front_lawn',
      kind: 'lawn',
      tileX: 4,
      tileY: 3,
      widthTiles: 5,
      heightTiles: 3,
      secondsToService: 3.0,
      label: 'Front lawn',
    },
    {
      id: 'side_lawn',
      kind: 'lawn',
      tileX: 12,
      tileY: 3,
      widthTiles: 5,
      heightTiles: 3,
      secondsToService: 3.0,
      label: 'Side lawn',
    },
    {
      id: 'walkway_edge',
      kind: 'edge',
      tileX: 4,
      tileY: 9,
      widthTiles: 5,
      heightTiles: 2,
      secondsToService: 2.5,
      label: 'Walkway edging',
    },
    {
      id: 'driveway_blow',
      kind: 'walkway',
      tileX: 12,
      tileY: 9,
      widthTiles: 5,
      heightTiles: 2,
      secondsToService: 2.0,
      label: 'Driveway cleanup',
    },
  ],
};

const lindaYard: YardLayout = {
  npcId: 'linda_ruiz',
  widthTiles: 20,
  heightTiles: 14,
  playerSpawn: { tileX: 10, tileY: 7 },
  timerSeconds: 80,
  title: "Linda's bed borders",
  zones: [
    {
      id: 'border_north',
      kind: 'beds',
      tileX: 3,
      tileY: 3,
      widthTiles: 6,
      heightTiles: 2,
      secondsToService: 3.5,
      label: 'North border',
    },
    {
      id: 'border_south',
      kind: 'beds',
      tileX: 3,
      tileY: 9,
      widthTiles: 6,
      heightTiles: 2,
      secondsToService: 3.5,
      label: 'South border',
    },
    {
      id: 'island_bed',
      kind: 'beds',
      tileX: 12,
      tileY: 5,
      widthTiles: 4,
      heightTiles: 4,
      secondsToService: 3.0,
      label: 'Island bed',
    },
    {
      id: 'edge_walk',
      kind: 'edge',
      tileX: 12,
      tileY: 11,
      widthTiles: 5,
      heightTiles: 2,
      secondsToService: 2.5,
      label: 'Border edging',
    },
  ],
};

const marcusYard: YardLayout = {
  npcId: 'marcus_webb',
  widthTiles: 20,
  heightTiles: 14,
  playerSpawn: { tileX: 10, tileY: 7 },
  timerSeconds: 80,
  title: "Marcus's lawn + hedge run",
  zones: [
    {
      id: 'lawn_main',
      kind: 'lawn',
      tileX: 3,
      tileY: 3,
      widthTiles: 6,
      heightTiles: 4,
      secondsToService: 3.5,
      label: 'Main lawn',
    },
    {
      id: 'lawn_strip',
      kind: 'lawn',
      tileX: 3,
      tileY: 9,
      widthTiles: 6,
      heightTiles: 2,
      secondsToService: 2.5,
      label: 'Side strip',
    },
    {
      id: 'hedge_front',
      kind: 'hedge',
      tileX: 12,
      tileY: 3,
      widthTiles: 5,
      heightTiles: 2,
      secondsToService: 3.5,
      label: 'Front hedge',
    },
    {
      id: 'hedge_back',
      kind: 'hedge',
      tileX: 12,
      tileY: 9,
      widthTiles: 5,
      heightTiles: 2,
      secondsToService: 3.5,
      label: 'Back hedge',
    },
  ],
};

const LAYOUTS: Readonly<Record<string, YardLayout>> = {
  jerry_porter: jerryYard,
  linda_ruiz: lindaYard,
  marcus_webb: marcusYard,
};

const FALLBACK_LAYOUT: YardLayout = jerryYard;

export function getYardLayout(npcId: string): YardLayout {
  return LAYOUTS[npcId] ?? FALLBACK_LAYOUT;
}

export function listYardLayouts(): ReadonlyArray<YardLayout> {
  return Object.values(LAYOUTS);
}

export const ZONE_BASE_COLOR: Readonly<Record<ZoneKind, number>> = {
  lawn: 0x3f6b22,
  edge: 0x6a8a44,
  beds: 0x6b3a55,
  hedge: 0x244d20,
  walkway: 0x6a6a6a,
};

export const ZONE_DONE_COLOR: Readonly<Record<ZoneKind, number>> = {
  lawn: 0x9fd96a,
  edge: 0xc6dc8a,
  beds: 0xd9a4c1,
  hedge: 0x7fc56a,
  walkway: 0xb8b5a6,
};

export function planMatchesAnyZone(_plan: AccountPlan): boolean {
  return true;
}
