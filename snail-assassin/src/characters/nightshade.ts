import type { CharacterConfig } from './types';

/**
 * NIGHTSHADE — Conus tulipa. Fictional character; real species.
 * Ghost Signal is inspired by a venom component that reduced escape responses of
 * zebrafish larvae in lab tests; Silent Tide by C. tulipa venom insulin. The two
 * act on DIFFERENT state variables (escape vs. glucose), so their combo is
 * complementary, not a claimed molecular synergy (docs/SCIENCE.md).
 * All numbers are gameplay balancing values.
 */
export const NIGHTSHADE: CharacterConfig = {
  id: 'nightshade',
  name: 'NIGHTSHADE',
  species: 'Conus tulipa',
  commonName: 'Tulip cone',
  title: 'The Phantom',
  tagline: 'The best hunt is the one your prey never notices.',
  personality: 'Elusive, quiet, patient.',
  specialization: 'Dampened escape responses and metabolic impairment',
  snailSpeed: 48,
  palette: {
    shell: 0xe8d9f0,
    pattern: 0x7a4fa0,
    body: 0xc49ab8,
    accent: 0xc9a2ff,
    cloud: 0xc9a2ff,
    ui: '#c9a2ff',
  },
  abilities: {
    primary: {
      kind: 'cloud',
      label: 'Ghost Signal',
      blurb: 'A cloud that dulls the fish’s urge to flee, letting you creep close.',
      effect: 'dampen',
      cost: 25,
      cooldown: 3,
      range: 200,
      radius: 110,
      lifeSeconds: 8,
      potency: 1,
    },
    secondary: {
      kind: 'cloud',
      label: 'Silent Tide',
      blurb: 'An insulin-inspired cloud that slowly saps nearby fish.',
      effect: 'insulin',
      cost: 30,
      cooldown: 4,
      range: 160,
      radius: 100,
      lifeSeconds: 7,
      potency: 1,
    },
    capture: {
      kind: 'engulf',
      label: 'Phantom Net',
      blurb: 'Silently engulf weakened fish that haven’t noticed you.',
      cost: 0,
      cooldown: 1.2,
      radius: 62,
      maxCaptures: 2,
      unawareBonus: 0.5,
    },
  },
  combo: 'Ghost Signal → Silent Tide → Phantom Net',
  strengths: ['Stealth', 'Crowd control', 'Close approaches'],
  weaknesses: ['No instant immobilization', 'Needs positioning', 'Weak vs. scattered prey'],
  attributes: { speed: 3, range: 2, burst: 2, area: 4, stealth: 5 },
};
