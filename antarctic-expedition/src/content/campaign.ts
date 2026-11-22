import type { ScaleId } from './organisms';

export type ExpeditionKind = 'dive' | 'oneDrop' | 'reconstruct';

export interface ExpeditionDef {
  id: string;
  number: number;
  title: string;
  narrative: string;
  kind: ExpeditionKind;
  /** For 'dive' expeditions: which wildlife are emphasized and the scale sampled next. */
  diveNextScale?: ScaleId;
  /** For 'oneDrop' expeditions: which scale's round to play. */
  scaleId?: ScaleId;
}

/** The seven-expedition campaign, roughly nine minutes played straight through. */
export const CAMPAIGN: ExpeditionDef[] = [
  {
    id: 'beneath-the-ice',
    number: 1,
    title: 'Beneath the Ice',
    narrative:
      'The research vessel has anchored off the Antarctic Peninsula. Your first task: get in ' +
      'the water and see what is actually down here. Photograph what you find, and collect a ' +
      'water sample before you surface — it will go under the microscope next.',
    kind: 'dive',
    diveNextScale: 'drop',
  },
  {
    id: 'songs-in-the-deep',
    number: 2,
    title: 'Songs in the Deep',
    narrative:
      'Hydrophones picked up unusual underwater calls nearby. Leopard seals are known predators ' +
      'here, but little is documented about how they behave with each other. Get close enough ' +
      'to photograph one without startling it, and listen for anything unusual.',
    kind: 'dive',
    diveNextScale: 'hidden',
  },
  {
    id: 'the-living-ocean',
    number: 3,
    title: 'The Living Ocean',
    narrative:
      'One more dive to round out the visible-world survey: penguins, icefish, krill, whatever ' +
      'the water gives you. Every species documented strengthens the expedition’s baseline ' +
      'record of what lives here.',
    kind: 'dive',
    diveNextScale: 'microbial',
  },
  {
    id: 'one-drop',
    number: 4,
    title: 'One Drop',
    narrative:
      'Back in the ship’s lab, a single drop of seawater goes under the stereomicroscope. ' +
      'At this scale, copepods, krill larvae, and drifting debris all look surprisingly similar ' +
      'at a glance. Document carefully — and if something is genuinely unclear, say so.',
    kind: 'oneDrop',
    scaleId: 'drop',
  },
  {
    id: 'invisible-giants',
    number: 5,
    title: 'Invisible Giants',
    narrative:
      'Switch to the fluorescence microscope. Down here, the "giants" are cells you cannot see ' +
      'without a stain and the right light: bacteria, aggregates, and the particles that will ' +
      'turn out to matter even more at the next scale down.',
    kind: 'oneDrop',
    scaleId: 'microbial',
  },
  {
    id: 'beyond-the-lens',
    number: 6,
    title: 'Beyond the Lens',
    narrative:
      'Fluorescence alone cannot resolve a virus’s shape, only that something is there. A ' +
      'full-season survey elsewhere in the Southern Ocean once found that most of what it ' +
      'counted here had never been documented before. Go find out what that looks like.',
    kind: 'oneDrop',
    scaleId: 'viral',
  },
  {
    id: 'into-the-unknown',
    number: 7,
    title: 'Into the Unknown',
    narrative:
      'The smallest scale yet: individual particle projections from a cryo-electron microscope. ' +
      'Pick enough clear ones and a simplified structure will start to take shape — a reminder ' +
      'that every discovery this expedition made started as a single, carefully judged image.',
    kind: 'reconstruct',
  },
];
