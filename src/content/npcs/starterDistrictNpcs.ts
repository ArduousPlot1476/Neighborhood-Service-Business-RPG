import type { NpcData } from '../../types';

export const starterDistrictNpcs: ReadonlyArray<NpcData> = [
  {
    id: 'jerry_porter',
    name: 'Jerry Porter',
    tileX: 5,
    tileY: 15,
    tint: 0x6aa8d9,
    role: 'Homeowner',
    line: "The lawn has been getting ahead of me for weeks. If somebody reliable showed up, I'd say yes on the spot.",
  },
  {
    id: 'linda_ruiz',
    name: 'Linda Ruiz',
    tileX: 15,
    tileY: 22,
    tint: 0xe66b8a,
    role: 'Retiree',
    line: "Lovely morning. The flower beds out back could use attention - not that I expect miracles on a first visit.",
  },
  {
    id: 'marcus_webb',
    name: 'Marcus Webb',
    tileX: 32,
    tileY: 14,
    tint: 0xf0c43a,
    role: 'Busy Professional',
    line: "Quick question - you handle hedges, or just lawns? I do not have time to read a flyer. Give me the short version.",
  },
  {
    id: 'pat_haller',
    name: 'Pat Haller',
    tileX: 44,
    tileY: 22,
    tint: 0x8ab07a,
    role: 'Neighbor',
    line: "Welcome to Sycamore Ridge. Two blocks of steady work here if you read the street right and do not oversell.",
  },
] as const;
