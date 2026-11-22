import type { CharacterConfig } from './types';

// GLAUCUS: fictional character, real species (Prionace glauca). Plays the second escalation
// level: the same blue shark that hunted Cipher (src/characters/octopus.ts) is now playable,
// hunting squid scattered across the open water (blue sharks are heavily documented predators of
// cephalopods, including squid specifically — Galván-Magaña 2013, Markaida & Sosa-Nishizaki 2010)
// while a pod of orcas (TUNING.orca + TUNING.orcaPod in src/config/tuning.ts) hunts Glaucus in
// turn — real, documented, coordinated pack behaviour; see docs/SCIENCE.md for exactly which
// shark species that behaviour has actually been documented against (not the blue shark itself).
// Squid are placed as scattered individuals (`prey: 'squid'` below), the same way Cipher's
// cone-snail prey is, since the blue shark's documented squid prey are mostly non-schooling
// deep-water species.
//
// Glaucus's own core mechanic is genuinely different from the cone snails' and from Cipher's:
// Pursuit replaces aiming a single precise strike with committing to a time-limited chase at
// elevated speed, and Burst buys more time mid-chase instead of holding the catch still. See
// docs/SCIENCE.md for the evidence behind each ability.
export const BLUESHARK: CharacterConfig = {
  id: 'blueshark',
  name: 'GLAUCUS',
  species: 'Prionace glauca',
  commonName: 'Blue shark',
  animalLabel: 'a real blue shark',
  title: 'The Wanderer',
  tagline: 'You spent a level fleeing this one. Now the water belongs to you — mostly.',
  personality: 'Restless, wide-ranging, always descending toward the next meal.',
  specialization: 'Sustained pursuit, a late burst of speed, swallowing prey whole',
  threat: 'orca',
  prey: 'squid',
  // Sharks have no venom at all — this uses the same cost/cooldown pool every character does,
  // just under its real name for an animal that hunts by speed and endurance, not toxin.
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
      kind: 'pursuit',
      label: 'Pursuit',
      blurb:
        'Give chase: lock onto the nearest squid and swim hard at it for a few seconds. No ' +
        'aiming — close the distance before it gets away, or the chase is wasted.',
      cost: 30,
      cooldown: 2.5,
      range: 190,
      chaseSpeedMultiplier: 1.35,
      durationSeconds: 2,
      grabRadius: 30,
      missPenalty: 2,
    },
    secondary: {
      kind: 'burst',
      label: 'Burst',
      blurb: 'A short extra push of speed that buys more time on a chase already underway.',
      cost: 20,
      cooldown: 3.5,
      extraSeconds: 1.6,
    },
    capture: {
      kind: 'reel',
      label: 'Swallow Whole',
      blurb: 'Draw the caught squid in and swallow it.',
      cost: 0,
      cooldown: 0.5,
      reelSpeed: 70,
      captureRadius: 24,
      tetherLength: 220,
    },
  },
  combo: 'Pursuit → Burst → Swallow Whole',
  strengths: ['Fastest swimmer in the game', 'No aiming required', 'Long tether range'],
  weaknesses: [
    'A chase can simply run out of time',
    'Misses waste energy',
    'The orca pod hunts as a coordinated group, not a lone threat',
  ],
  attributes: { speed: 5, range: 4, burst: 5, area: 1, stealth: 1 },
};
