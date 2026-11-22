import type { CharacterConfig } from './types';

// GLAUCUS: fictional character, real species (Prionace glauca). Plays the second escalation
// level: the same blue shark that hunted Cipher (src/characters/octopus.ts) is now playable,
// hunting squid scattered across the open water (blue sharks are heavily documented predators of
// cephalopods, including squid specifically — Galván-Magaña 2013, Markaida & Sosa-Nishizaki 2010)
// while a pod of orcas (TUNING.orca + TUNING.orcaPod in src/config/tuning.ts) hunts Glaucus in
// turn — real, documented, coordinated pack behaviour; see docs/SCIENCE.md for exactly which
// shark species that behaviour has actually been documented against (not the blue shark itself).
// Abilities reuse the same strike/lock/reel kinds Catalyst and Cipher use (see src/systems/hunt.ts);
// see docs/SCIENCE.md for the evidence behind each one. Squid are placed as scattered individuals
// (`prey: 'squid'` below), the same way Cipher's cone-snail prey is, since the blue shark's
// documented squid prey are mostly non-schooling deep-water species.
export const BLUESHARK: CharacterConfig = {
  id: 'blueshark',
  name: 'GLAUCUS',
  species: 'Prionace glauca',
  commonName: 'Blue shark',
  animalLabel: 'a real blue shark',
  title: 'The Wanderer',
  tagline: 'You spent a level fleeing this one. Now the water belongs to you — mostly.',
  personality: 'Restless, wide-ranging, always descending toward the next meal.',
  specialization: 'Pursuit strike, crushing bite, swallow prey whole',
  threat: 'orca',
  prey: 'squid',
  // Sharks have no venom at all — this uses the same cost/cooldown pool every character does,
  // just under its real name for an animal that hunts by speed and bite force, not toxin.
  resourceName: 'Energy',
  speed: 70,
  palette: {
    shell: 0x4a6a82,
    pattern: 0x33495e,
    body: 0x4a6a82,
    accent: 0x9fd6e0,
    cloud: 0x9fd6e0,
    ui: '#9fd6e0',
  },
  abilities: {
    primary: {
      kind: 'strike',
      label: 'Pursuit Strike',
      blurb: 'Close the distance and strike at one squid in open water. Misses waste energy.',
      cost: 30,
      cooldown: 2,
      range: 180,
      aimTolerance: 36,
      missPenalty: 2,
    },
    secondary: {
      kind: 'lock',
      label: 'Crushing Bite',
      blurb: 'Clamp down hard enough that the squid cannot jet away.',
      cost: 20,
      cooldown: 4,
      potency: 1,
    },
    capture: {
      kind: 'reel',
      label: 'Swallow Whole',
      blurb: 'Draw the bitten squid in and swallow it.',
      cost: 0,
      cooldown: 0.5,
      reelSpeed: 70,
      captureRadius: 24,
      tetherLength: 220,
    },
  },
  combo: 'Pursuit Strike → Crushing Bite → Swallow Whole',
  strengths: ['Fast swimmer', 'Immediate effects once locked on', 'Long tether range'],
  weaknesses: [
    'Single target',
    'Misses waste energy',
    'The orca pod hunts as a coordinated group, not a lone threat',
  ],
  attributes: { speed: 5, range: 4, burst: 4, area: 1, stealth: 2 },
};
