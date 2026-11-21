import type { Rng } from '../utils/rng';
import type { WorkerTraits } from '../systems/colony';
import type { Vec2 } from '../utils/math';

// The crew. All fictional stand-ins for ordinary Bombus impatiens workers; see docs/SCIENCE.md
// for what's real and what's gameplay abstraction. None of these are permanent character
// classes in the simulation itself, a worker's traits just happen to be set this way.

export type CharacterId = 'buzzby' | 'pollen' | 'dash' | 'bumble' | 'stinger' | 'queenie';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  line: string;
  accent: number;
  traits: WorkerTraits;
}

const at = (x: number, y: number): Vec2 => ({ x, y });

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  buzzby: {
    id: 'buzzby',
    name: 'Buzzby',
    title: 'The one you play',
    line: 'An ordinary worker, same as everyone else here.',
    accent: 0xe8b84b,
    traits: {
      forageTendency: 0.5,
      broodCareTendency: 0.5,
      nestMaintenanceTendency: 0.5,
      spatialPreference: at(560, 340),
      responsiveness: 0.5,
      socialActivity: 0.4,
      latentPotential: 0.2,
    },
  },
  pollen: {
    id: 'pollen',
    name: 'Pollen',
    title: 'Gentle, brood-minded',
    line: 'Someone has to mind the little ones.',
    accent: 0xf6d98a,
    traits: {
      forageTendency: 0.2,
      broodCareTendency: 0.85,
      nestMaintenanceTendency: 0.3,
      spatialPreference: at(680, 260),
      responsiveness: 0.5,
      socialActivity: 0.35,
      latentPotential: 0.15,
    },
  },
  dash: {
    id: 'dash',
    name: 'Dash',
    title: 'Energetic forager',
    line: "Flowers don't visit themselves.",
    accent: 0xd98e3f,
    traits: {
      forageTendency: 0.85,
      broodCareTendency: 0.15,
      nestMaintenanceTendency: 0.2,
      spatialPreference: at(420, 430),
      responsiveness: 0.7,
      socialActivity: 0.5,
      latentPotential: 0.2,
    },
  },
  bumble: {
    id: 'bumble',
    name: 'Bumble',
    title: 'Relaxed, dependable',
    line: "Someone's got to keep this place tidy.",
    accent: 0x7a9b5c,
    traits: {
      forageTendency: 0.2,
      broodCareTendency: 0.25,
      nestMaintenanceTendency: 0.75,
      spatialPreference: at(600, 460),
      responsiveness: 0.4,
      socialActivity: 0.3,
      latentPotential: 0.1,
    },
  },
  stinger: {
    id: 'stinger',
    name: 'Stinger',
    title: 'Territorial, assertive',
    line: 'Someone has to keep an eye on things.',
    accent: 0xd97a7a,
    traits: {
      forageTendency: 0.3,
      broodCareTendency: 0.2,
      nestMaintenanceTendency: 0.55,
      spatialPreference: at(500, 240),
      responsiveness: 0.45,
      socialActivity: 0.6,
      latentPotential: 0.45,
    },
  },
  queenie: {
    id: 'queenie',
    name: 'Queenie',
    title: 'Easy to overlook',
    line: 'Nobody asks me much. That might change.',
    accent: 0xb89a6e,
    traits: {
      forageTendency: 0.25,
      broodCareTendency: 0.25,
      nestMaintenanceTendency: 0.25,
      spatialPreference: at(460, 360),
      responsiveness: 0.3,
      socialActivity: 0.25,
      // this is the whole point of her: nothing about her looks remarkable while the
      // colony has a queen. The brief's "previously overlooked worker" trait lives here.
      latentPotential: 0.9,
    },
  },
};

export const CHARACTER_ORDER: CharacterId[] = [
  'buzzby',
  'pollen',
  'dash',
  'bumble',
  'stinger',
  'queenie',
];

/** Filler colony members, for levels that need more than the six named characters. */
export function makeGenericWorker(_index: number, rng: Rng, center: Vec2): WorkerTraits {
  const angle = rng.next() * Math.PI * 2;
  const radius = 60 + rng.next() * 160;
  return {
    forageTendency: rng.next(),
    broodCareTendency: rng.next(),
    nestMaintenanceTendency: rng.next(),
    spatialPreference: {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    },
    responsiveness: 0.25 + rng.next() * 0.6,
    socialActivity: 0.15 + rng.next() * 0.5,
    // most workers have a little latent potential; only a few run high, same shape the
    // brief asks for ("a subset of workers become more influential").
    latentPotential: rng.next() < 0.15 ? 0.5 + rng.next() * 0.4 : rng.next() * 0.2,
  };
}

export function genericWorkerName(index: number): string {
  return `Worker ${index + 1}`;
}
