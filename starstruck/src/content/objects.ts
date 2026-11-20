// Things in the soil and what touching them feels like. Configurable: new prey or obstacles are
// added here, not in the engine. Signatures are gameplay abstractions, not neural recordings.

export type Material =
  'worm' | 'larva' | 'beetle' | 'rock' | 'root' | 'aquaWorm' | 'aquaLarva' | 'predator';

export interface ObjectDef {
  material: Material;
  name: string;
  edible: boolean;
  /** Energy from eating it. */
  energy: number;
  points: number;
  /** Evidence (from touches) needed to know what it is. */
  evidence: number;
  /** How the touch marks look, so materials differ by shape, not just colour. */
  mark: 'soft' | 'segmented' | 'hard' | 'rough' | 'fibrous';
  color: number;
  /** Movement speed in px/s (0 = stays put). */
  speed: number;
  /** Chance per touch that it notices you and hurries away. */
  startle: number;
  /** Only found underwater; touch alone barely identifies it — BUBBLE SNIFF does most of the work. */
  aquatic?: boolean;
}

export const OBJECTS: Record<Material, ObjectDef> = {
  worm: {
    material: 'worm',
    name: 'Earthworm',
    edible: true,
    energy: 14,
    points: 100,
    evidence: 1,
    mark: 'soft',
    color: 0xf0a9a9,
    speed: 14,
    startle: 0.15,
  },
  larva: {
    material: 'larva',
    name: 'Larva',
    edible: true,
    energy: 9,
    points: 80,
    evidence: 1,
    mark: 'segmented',
    color: 0xebc478,
    speed: 2,
    startle: 0.05,
  },
  beetle: {
    material: 'beetle',
    name: 'Beetle',
    edible: true,
    energy: 18,
    points: 150,
    evidence: 1.4,
    mark: 'hard',
    color: 0x8fb0d0,
    speed: 40,
    startle: 0.5,
  },
  rock: {
    material: 'rock',
    name: 'Pebble',
    edible: false,
    energy: 0,
    points: 0,
    evidence: 1,
    mark: 'rough',
    color: 0xc9ab86,
    speed: 0,
    startle: 0,
  },
  root: {
    material: 'root',
    name: 'Root',
    edible: false,
    energy: 0,
    points: 0,
    evidence: 1,
    mark: 'fibrous',
    color: 0x829e86,
    speed: 0,
    startle: 0,
  },
  aquaWorm: {
    material: 'aquaWorm',
    name: 'Aquatic Worm',
    edible: true,
    energy: 16,
    points: 120,
    // touch alone barely registers it; a bubble's scent does most of the work (see senses.ts)
    evidence: 2.2,
    mark: 'soft',
    color: 0x9fe3d0,
    speed: 10,
    startle: 0.1,
    aquatic: true,
  },
  aquaLarva: {
    material: 'aquaLarva',
    name: 'Aquatic Larva',
    edible: true,
    energy: 11,
    points: 100,
    evidence: 2.2,
    mark: 'segmented',
    color: 0x7fd0e0,
    speed: 3,
    startle: 0.05,
    aquatic: true,
  },
  predator: {
    material: 'predator',
    name: 'Something Bigger',
    edible: false,
    energy: 0,
    points: 0,
    // a big, unmistakable contact, so it reads as a warning even by touch alone
    evidence: 0.6,
    mark: 'hard',
    color: 0xd97070,
    speed: 46,
    startle: 0,
  },
};

/** Things with sharp teeth, basically. Touching one hurts (see game.ts). */
export function isDangerous(m: Material): boolean {
  return m === 'predator';
}
