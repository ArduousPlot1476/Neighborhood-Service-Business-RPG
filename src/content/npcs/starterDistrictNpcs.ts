import type { NpcData } from '../../types';

export const starterDistrictNpcs: ReadonlyArray<NpcData> = [
  {
    id: 'jerry_porter',
    name: 'Jerry Porter',
    tileX: 5,
    tileY: 15,
    tint: 0x6aa8d9,
    role: 'Homeowner',
    dialogueId: 'jerry_porter',
  },
  {
    id: 'linda_ruiz',
    name: 'Linda Ruiz',
    tileX: 15,
    tileY: 22,
    tint: 0xe66b8a,
    role: 'Retiree',
    dialogueId: 'linda_ruiz',
  },
  {
    id: 'marcus_webb',
    name: 'Marcus Webb',
    tileX: 32,
    tileY: 14,
    tint: 0xf0c43a,
    role: 'Busy Professional',
    dialogueId: 'marcus_webb',
  },
  {
    id: 'pat_haller',
    name: 'Pat Haller',
    tileX: 44,
    tileY: 22,
    tint: 0x8ab07a,
    role: 'Neighbor',
    dialogueId: 'pat_haller',
  },
] as const;
