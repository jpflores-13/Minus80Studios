import type { Building } from '../levels/types';

// Every word the game shows for the simulation, in both views. City words are what players see
// during the campaign; science words appear only in Science Mode, after the reveal.
// Scientists can edit the right-hand column without touching the game code.

export type View = 'city' | 'science';

export const TERMS = {
  shortcut: { city: 'shortcut', science: 'loop' },
  shortcuts: { city: 'shortcuts', science: 'loops' },
  machine: { city: 'machine', science: 'cohesin' },
  machines: { city: 'machines', science: 'cohesin complexes' },
  depot: { city: 'depot', science: 'loading site' },
  checkpoint: { city: 'checkpoint', science: 'CTCF site' },
  checkpoints: { city: 'checkpoints', science: 'CTCF sites' },
  road: { city: 'road', science: 'chromatin' },
  address: { city: 'Address', science: 'Bin' },
  district: { city: 'district', science: 'domain' },
  mixups: { city: 'mix-ups', science: 'cross-domain contacts' },
  wrong: { city: 'wrong connections', science: 'non-cognate contacts' },
  truck: { city: 'truck', science: 'transcribing polymerase' },
  running: { city: 'running ✓', science: 'expressed ✓' },
  waiting: { city: 'waiting…', science: 'silent…' },
  closed: { city: 'closed', science: 'inactive' },
  map: { city: 'City Connectivity Map', science: 'Simulated contact map' },
  mapNote: {
    city: 'darker = those two addresses were joined more often',
    science: 'model contact propensity, not measured Hi-C data',
  },
  maintenance: { city: 'Maintenance', science: 'Release (residence time)' },
  depotSpeed: { city: 'Depot speed', science: 'Loading rate' },
  fleet: { city: 'Fleet', science: 'Cohesin amount' },
} as const;

export function term(key: keyof typeof TERMS, view: View): string {
  return TERMS[key][view];
}

const RESOURCE_LETTER = { bread: 'A', power: 'B', water: 'C' } as const;

/** Building names. In Science Mode, matching letters show which enhancer can drive which gene. */
export function buildingName(b: Building, view: View): string {
  if (view === 'city') return b.name;
  return `${b.role === 'supplier' ? 'Enhancer' : 'Gene'} ${RESOURCE_LETTER[b.resource]}`;
}

export function buildingRole(b: Building, view: View): string {
  if (view === 'city') return b.role === 'supplier' ? `makes ${b.resource}` : `needs ${b.resource}`;
  return b.role === 'supplier'
    ? `drives gene ${RESOURCE_LETTER[b.resource]}`
    : `needs enhancer ${RESOURCE_LETTER[b.resource]}`;
}

/** Short explanations for Science Mode, shown when the cursor is over something. */
export const SCIENCE_TIPS = {
  checkpoint:
    'CTCF binds DNA at sites with a direction. In this model, a site stops cohesin arriving from the side it faces, most of the time. Convergent pairs (→ … ←) can anchor a loop.',
  depot:
    'Cohesin is loaded onto chromatin (NIPBL is involved in loading). Here, loading only happens at marked sites, which is a simplification.',
  machine:
    'Cohesin extrudes a loop, here by moving each side outward one bin at a time at random. It is released after a random residence time.',
  enhancer:
    'Enhancers are regulatory DNA that can boost a gene when brought into contact with it. Contact makes activation more likely, never certain.',
  gene: 'A gene is expressed here when a matching enhancer has recently been in contact with it.',
  truck:
    'Transcription can move cohesin along the DNA in this model. Whether and how much this happens in cells is an active research question.',
  domain:
    'Domains are regions that contact themselves more than their neighbours. Boundaries insulate them, here through CTCF sites.',
} as const;
