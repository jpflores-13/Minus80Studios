import type { CharacterConfig } from './types';

// CIPHER: fictional character, real species (Octopus bimaculoides). Plays the escalation level
// that follows the three-snail campaign: now the player is the predator, hunting cone snails
// scattered across the reef while a blue shark (TUNING.shark in src/systems/predator.ts) hunts
// Cipher in turn. Abilities reuse the same strike/lock/reel kinds Catalyst uses (see
// src/systems/hunt.ts); see docs/SCIENCE.md for the evidence behind each one. Cone snails are
// confirmed solitary foragers (no social hunting groups), so Cipher's prey is placed as scattered
// individuals (`prey: 'snail'` below), not a school.
export const OCTOPUS: CharacterConfig = {
  id: 'octopus',
  name: 'CIPHER',
  species: 'Octopus bimaculoides',
  commonName: 'California two-spot octopus',
  animalLabel: 'a real octopus',
  title: 'The Ambusher',
  tagline: 'You spent three lives learning to hide from this one. Now you are this one.',
  personality: 'Patient, exacting, built for a single decisive moment.',
  specialization: 'Ambush pounce, paralytic bite, coordinated arm restraint',
  threat: 'shark',
  prey: 'snail',
  resourceName: 'Venom',
  speed: 55,
  palette: {
    shell: 0x6a4a63,
    pattern: 0x9b3f5a,
    body: 0xc4566f,
    accent: 0xff8fa8,
    cloud: 0xff8fa8,
    ui: '#ff8fa8',
  },
  abilities: {
    primary: {
      kind: 'strike',
      label: 'Pounce',
      blurb:
        'Jet toward one cone snail and spread your arms over it in one ambush strike. Misses waste venom.',
      cost: 30,
      cooldown: 2,
      range: 160,
      aimTolerance: 36,
      missPenalty: 2,
    },
    secondary: {
      kind: 'lock',
      label: 'Paralytic Bite',
      blurb:
        'Bite through the beak. Venom from your salivary glands keeps the catch from escaping.',
      cost: 20,
      cooldown: 4,
      potency: 1,
    },
    capture: {
      kind: 'reel',
      label: 'Draw to Mouth',
      blurb: 'Pull the restrained snail in with your arms and suckers.',
      cost: 0,
      cooldown: 0.5,
      reelSpeed: 65,
      captureRadius: 24,
      tetherLength: 210,
    },
  },
  combo: 'Pounce → Paralytic Bite → Draw to Mouth',
  strengths: ['Immediate effects', 'No wasted motion once locked on', 'Fast swimmer'],
  weaknesses: [
    'Single target',
    'Misses waste venom',
    'The blue shark is faster and harder to hide from',
  ],
  attributes: { speed: 4, range: 3, burst: 5, area: 1, stealth: 2 },
};
