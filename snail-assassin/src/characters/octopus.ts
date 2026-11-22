import type { CharacterConfig } from './types';

// CIPHER: fictional character, real species (Octopus bimaculoides). Plays the escalation level
// that follows the three-snail campaign: now the player is the predator, hunting cone snails
// scattered across the reef while a blue shark (TUNING.shark in src/systems/predator.ts) hunts
// Cipher in turn. Cone snails are confirmed solitary foragers (no social hunting groups), so
// Cipher's prey is placed as scattered individuals (`prey: 'snail'` below), not a school.
//
// Cipher's own core mechanic is genuinely different from the three cone snails' (and from
// Glaucus's — see blueshark.ts): a timed Camouflage window stands in for aiming and holding
// still, and Pounce restrains its catch the instant it lands, with no separate lock step. See
// docs/SCIENCE.md for the evidence behind each ability.
export const OCTOPUS: CharacterConfig = {
  id: 'octopus',
  name: 'CIPHER',
  species: 'Octopus bimaculoides',
  commonName: 'California two-spot octopus',
  animalLabel: 'a real octopus',
  title: 'The Ambusher',
  tagline: 'You spent three lives learning to hide from this one. Now you are this one.',
  personality: 'Patient, exacting, built for a single decisive moment.',
  specialization: 'Chromatophore camouflage, synchronous-arm ambush, paralytic bite',
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
      kind: 'camouflage',
      label: 'Camouflage',
      blurb:
        'Match the reef with your skin. You move more slowly, but the shark barely notices you ' +
        'moving at all. Ends the instant you Pounce.',
      cost: 25,
      cooldown: 6,
      durationSeconds: 5,
      speedMultiplier: 0.55,
      detectionMultiplier: 0.12,
    },
    secondary: {
      kind: 'strike',
      label: 'Pounce',
      blurb:
        'Jet toward one cone snail and spread every arm over it at once. A synchronous grab that ' +
        'restrains the catch immediately — no separate hold needed. Misses waste venom.',
      cost: 35,
      cooldown: 2.5,
      range: 160,
      aimTolerance: 36,
      missPenalty: 2,
      instantGrip: true,
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
  combo: 'Camouflage → Pounce → Draw to Mouth',
  strengths: [
    'Hard for the shark to notice while camouflaged',
    'One motion both catches and restrains',
    'Fast swimmer',
  ],
  weaknesses: [
    'Slower while camouflaged, and it ends the moment you strike',
    'Misses waste venom',
    'The blue shark is faster and harder to hide from once it has already spotted you',
  ],
  attributes: { speed: 4, range: 3, burst: 5, area: 1, stealth: 5 },
};
