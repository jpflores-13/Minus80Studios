// DIVE wildlife database: the Visible World's charismatic fauna. Natural-history facts here are
// well established for these taxa. Anything citing a specific finding or number lives in
// content/science.ts with its own source. See docs/ORGANISM_DATABASE.md and docs/SCIENCE.md.

export interface WildlifeSpecies {
  id: string;
  name: string;
  /** Typical fast-approach flee distance, in field px. Smaller = more approachable. */
  fleeDistance: number;
  /** Ideal photographing distance (best framing/behavior tradeoff), in field px. */
  idealDistance: number;
  baseValue: number;
  /** A documented natural behavior this species sometimes performs on camera. */
  behavior?: string;
}

export const WILDLIFE: Record<string, WildlifeSpecies> = {
  weddellSeal: {
    id: 'weddellSeal',
    name: 'Weddell seal',
    fleeDistance: 60,
    idealDistance: 110,
    baseValue: 12,
    behavior: 'hauled out, resting on the ice',
  },
  leopardSeal: {
    id: 'leopardSeal',
    name: 'Leopard seal',
    fleeDistance: 90,
    idealDistance: 160,
    baseValue: 20,
    behavior: 'vocalizing underwater',
  },
  adeliePenguin: {
    id: 'adeliePenguin',
    name: 'Adelie penguin',
    fleeDistance: 50,
    idealDistance: 90,
    baseValue: 10,
    behavior: 'foraging in a tight group',
  },
  icefish: {
    id: 'icefish',
    name: 'Crocodile icefish',
    fleeDistance: 40,
    idealDistance: 70,
    baseValue: 14,
    behavior: 'holding still over cold, oxygen-rich water',
  },
  krillSwarm: {
    id: 'krillSwarm',
    name: 'Antarctic krill swarm',
    fleeDistance: 20,
    idealDistance: 50,
    baseValue: 8,
  },
};

export const WILDLIFE_ORDER: string[] = [
  'weddellSeal',
  'leopardSeal',
  'adeliePenguin',
  'icefish',
  'krillSwarm',
];
