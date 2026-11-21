import type { SpecimenType } from '../systems/oneDrop';

// The organism and artifact database for ONE DROP, keyed by biological scale. Natural-history
// facts here are well established for these taxa; anything claiming a specific finding or
// number lives in content/science.ts with its own citation. See docs/ORGANISM_DATABASE.md.

export type ScaleId = 'visible' | 'drop' | 'hidden' | 'microbial' | 'viral' | 'molecular';

export interface ScaleInfo {
  id: ScaleId;
  name: string;
  approxSize: string;
  instrument: string;
}

export const SCALES: Record<ScaleId, ScaleInfo> = {
  visible: {
    id: 'visible',
    name: 'The Visible World',
    approxSize: 'centimetres',
    instrument: 'Underwater camera',
  },
  drop: {
    id: 'drop',
    name: 'A Drop of Ocean',
    approxSize: 'millimetres',
    instrument: 'Stereomicroscope',
  },
  hidden: {
    id: 'hidden',
    name: 'The Hidden Ecosystem',
    approxSize: 'tens of micrometres',
    instrument: 'Compound light microscope',
  },
  microbial: {
    id: 'microbial',
    name: 'The Microbial World',
    approxSize: 'a few micrometres',
    instrument: 'Fluorescence microscope',
  },
  viral: {
    id: 'viral',
    name: 'The Viral Frontier',
    approxSize: '20-200 nanometres',
    instrument: 'Fluorescence + electron microscope',
  },
  molecular: {
    id: 'molecular',
    name: 'The Molecular Frontier',
    approxSize: 'nanometres and below',
    instrument: 'Cryo-electron microscope',
  },
};

export const SCALE_ORDER: ScaleId[] = [
  'visible',
  'drop',
  'hidden',
  'microbial',
  'viral',
  'molecular',
];

/** One ONE DROP specimen set per scale. Non-targets and artifacts vary with the preparation. */
export const SPECIMENS: Record<ScaleId, Record<string, SpecimenType>> = {
  drop: {
    copepod: { id: 'copepod', name: 'Copepod', kind: 'target', radius: 10, speed: 70, value: 10 },
    krillLarva: {
      id: 'krillLarva',
      name: 'Krill larva',
      kind: 'nonTarget',
      radius: 11,
      speed: 55,
      value: 0,
    },
    bubble: { id: 'bubble', name: 'Air bubble', kind: 'artifact', radius: 8, speed: 90, value: 0 },
    debris: { id: 'debris', name: 'Debris', kind: 'artifact', radius: 9, speed: 30, value: 0 },
    faintShape: {
      id: 'faintShape',
      name: 'Indistinct shape',
      kind: 'unknown',
      radius: 9,
      speed: 40,
      value: 0,
    },
  },
  hidden: {
    diatom: { id: 'diatom', name: 'Diatom', kind: 'target', radius: 7, speed: 25, value: 12 },
    dinoflagellate: {
      id: 'dinoflagellate',
      name: 'Dinoflagellate',
      kind: 'nonTarget',
      radius: 7,
      speed: 45,
      value: 0,
    },
    ciliate: { id: 'ciliate', name: 'Ciliate', kind: 'nonTarget', radius: 8, speed: 60, value: 0 },
    outOfFocus: {
      id: 'outOfFocus',
      name: 'Out-of-focus blur',
      kind: 'artifact',
      radius: 9,
      speed: 20,
      value: 0,
    },
    ambiguousCell: {
      id: 'ambiguousCell',
      name: 'Ambiguous cell',
      kind: 'unknown',
      radius: 7,
      speed: 30,
      value: 0,
    },
  },
  microbial: {
    labeledBacterium: {
      id: 'labeledBacterium',
      name: 'Labelled bacterial cell',
      kind: 'target',
      radius: 5,
      speed: 20,
      value: 14,
    },
    aggregate: {
      id: 'aggregate',
      name: 'Microbial aggregate',
      kind: 'nonTarget',
      radius: 6,
      speed: 15,
      value: 0,
    },
    backgroundSignal: {
      id: 'backgroundSignal',
      name: 'Background fluorescence',
      kind: 'artifact',
      radius: 6,
      speed: 10,
      value: 0,
    },
    noise: { id: 'noise', name: 'Imaging noise', kind: 'artifact', radius: 4, speed: 35, value: 0 },
    dimParticle: {
      id: 'dimParticle',
      name: 'Dim particle',
      kind: 'unknown',
      radius: 5,
      speed: 20,
      value: 0,
    },
  },
  viral: {
    virusParticle: {
      id: 'virusParticle',
      name: 'Virus-like particle',
      kind: 'target',
      radius: 4,
      speed: 18,
      value: 16,
    },
    hostFragment: {
      id: 'hostFragment',
      name: 'Host cell fragment',
      kind: 'nonTarget',
      radius: 5,
      speed: 12,
      value: 0,
    },
    stainArtifact: {
      id: 'stainArtifact',
      name: 'Stain artifact',
      kind: 'artifact',
      radius: 4,
      speed: 25,
      value: 0,
    },
    faintSignal: {
      id: 'faintSignal',
      name: 'Faint signal',
      kind: 'unknown',
      radius: 4,
      speed: 15,
      value: 0,
    },
  },
  visible: {
    krill: {
      id: 'krill',
      name: 'Antarctic krill',
      kind: 'target',
      radius: 14,
      speed: 60,
      value: 8,
    },
    copepodSwarm: {
      id: 'copepodSwarm',
      name: 'Copepod swarm',
      kind: 'nonTarget',
      radius: 12,
      speed: 50,
      value: 0,
    },
    iceGlare: {
      id: 'iceGlare',
      name: 'Ice glare',
      kind: 'artifact',
      radius: 16,
      speed: 10,
      value: 0,
    },
    distantShape: {
      id: 'distantShape',
      name: 'Distant shape',
      kind: 'unknown',
      radius: 13,
      speed: 40,
      value: 0,
    },
  },
  molecular: {
    goodProjection: {
      id: 'goodProjection',
      name: 'Clear particle projection',
      kind: 'target',
      radius: 9,
      speed: 0,
      value: 18,
    },
    overlapping: {
      id: 'overlapping',
      name: 'Overlapping particles',
      kind: 'nonTarget',
      radius: 10,
      speed: 0,
      value: 0,
    },
    contamination: {
      id: 'contamination',
      name: 'Contamination',
      kind: 'artifact',
      radius: 8,
      speed: 0,
      value: 0,
    },
    poorOrientation: {
      id: 'poorOrientation',
      name: 'Poor-quality orientation',
      kind: 'unknown',
      radius: 9,
      speed: 0,
      value: 0,
    },
  },
};
