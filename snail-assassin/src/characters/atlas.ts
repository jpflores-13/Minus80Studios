import type { CharacterConfig } from './types';

/**
 * ATLAS — Conus geographus. Fictional character; real species.
 * Ability inspirations and their evidence status: docs/SCIENCE.md.
 * All numbers are gameplay balancing values.
 */
export const ATLAS: CharacterConfig = {
  id: 'atlas',
  name: 'ATLAS',
  species: 'Conus geographus',
  commonName: 'Geography cone',
  title: 'The Chemist',
  tagline: 'Why chase your prey when you can change its biology?',
  personality: 'Intelligent, patient, methodical.',
  snailSpeed: 45,
  palette: {
    shell: 0xe9dcc0,
    pattern: 0x1f6f78,
    body: 0xc98a7a,
    accent: 0x5fd3c6,
    cloud: 0x5fd3c6,
  },
  abilities: {
    primary: {
      kind: 'cloud',
      label: 'Glucose Crash',
      effect: 'insulin',
      cost: 35,
      cooldown: 3,
      range: 220,
      radius: 95,
      lifeSeconds: 7,
      potency: 1,
    },
    secondary: {
      kind: 'cloud',
      label: 'System Override',
      effect: 'override',
      cost: 30,
      cooldown: 5,
      range: 220,
      radius: 95,
      lifeSeconds: 7,
      potency: 1,
    },
    capture: {
      kind: 'engulf',
      label: 'Engulf',
      cost: 0,
      cooldown: 1.2,
      radius: 75,
      maxCaptures: 2,
    },
  },
  strengths: ['Molecular synergy', 'Multiple-target capture', 'Area control'],
  weaknesses: ['Delayed effects', 'Resource-intensive', 'Requires patience'],
};
