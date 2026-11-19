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
  specialization: 'Hormonal mimicry and glucose regulation',
  snailSpeed: 45,
  palette: {
    shell: 0xe9dcc0,
    pattern: 0x1f6f78,
    body: 0xc98a7a,
    accent: 0x5fd3c6,
    cloud: 0x5fd3c6,
    ui: '#5fd3c6',
  },
  abilities: {
    primary: {
      kind: 'cloud',
      label: 'Glucose Crash',
      blurb: 'Release an insulin-inspired cloud that slowly drains nearby fish.',
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
      blurb: 'Block the fish’s recovery. Weak alone, devastating after Glucose Crash.',
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
      blurb: 'Open the false mouth and swallow weakened fish, two at once.',
      cost: 0,
      cooldown: 1.2,
      radius: 75,
      maxCaptures: 2,
      unawareBonus: 0,
    },
  },
  combo: 'Glucose Crash → System Override → Engulf',
  strengths: ['Molecular synergy', 'Multiple-target capture', 'Area control'],
  weaknesses: ['Delayed effects', 'Resource-intensive', 'Requires patience'],
  attributes: { speed: 2, range: 4, burst: 2, area: 5, stealth: 3 },
};
