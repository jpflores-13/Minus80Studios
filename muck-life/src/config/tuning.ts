// Every number that shapes MUCK LIFE lives here, split into three kinds so nobody mistakes one for
// another (see docs/SCIENCE_TO_GAMEPLAY.md):
//
//   MEASURED   — values reported by Stein & Cardon (2026). Shown to players as experimental findings.
//   SIMULATION — simplified-model parameters. Chosen so the model behaves *qualitatively* like the
//                study (pools follow growth, laterals outlast adventitious roots, diel swings are
//                small). They are not calibrated physics and must never be presented as measurements.
//   ARCADE     — pure game balance: points, timers, hitboxes. No biological meaning at all.

/** MEASURED — Stein & Cardon 2026, New Phytologist 252:1832–1842 (doi:10.1111/nph.71593). */
export const MEASURED = {
  /** Abstract: strongly oxygenated regions "regularly 25–30% oxygen saturation". */
  growthPoolTypicalPct: [25, 30] as const,
  /** Results: new adventitious roots or rhizomes raised O2 "from zero to between 25 and 35%". */
  growthPoolRangePct: [25, 35] as const,
  /** Abstract: diel cycles drove "only slight variation … (c. 5% oxygen saturation)". */
  dielAbstractPct: 5,
  /** Results: mean daily max–min, three plants, "only c. 3%". */
  dielMeanRangePct: 3,
  /** Table 1, mean ± SE duration (h) of oxygen pools at a sediment location. */
  poolDurationHours: {
    rhizome: { mean: 78, se: 28 },
    adventitious: { mean: 95, se: 17 },
    lateral: { mean: 502, se: 170 },
  },
  /** Results: new adventitious roots "erupted from rhizomes 3–7 d after rhizome establishment". */
  adventitiousFromRhizomeDays: [3, 7] as const,
  /** Methods: four plants, studied sequentially, May 2024 – April 2026. */
  plants: 4,
  /** Methods: growth-room light period 05:00–19:00 (14 h). */
  lightOnHour: 5,
  lightOffHour: 19,
  /** Methods: images every 3 or 5 min over 2–3 d for most series. */
  imageIntervalMin: [3, 5] as const,
  /** Methods: rhizobox external size (cm) and optode area (cm). */
  rhizoboxCm: { height: 39.4, width: 20.3, depth: 3.8 },
  optodeCm: { height: 26, width: 13 },
  /** Results: root-free sediment injected with oxygenated water returned to anoxia in ~1.5 h. */
  sedimentDrawdownHours: 1.5,
} as const;

/** SIMULATION — the simplified plant and oxygen model. Units: px, sim hours, % O2 saturation. */
export const SIM = {
  /** Oxygen grid: cells of this many px over the sediment area. */
  cellPx: 16,
  /** Integration step (sim hours). Explicit diffusion stays stable for diffusion * step * 4 < 1. */
  stepHours: 0.25,
  /** Fraction of O2 consumed per sim hour (microbial respiration + abiotic oxidation). */
  consumptionPerHour: 1.6,
  /** Extra constant demand (% per hour) removed everywhere, so faint signals vanish fully. */
  baselineDemandPerHour: 0.6,
  /** Diffusion coefficient in cells² per sim hour. Kept small: O2 does not travel far in mud. */
  diffusion: 0.9,
  /** Release is diffusion-driven: it slows as sediment O2 nears the tissue's internal level, so
   * overlapping roots cannot push a pool above this (% saturation). Simplified Fick's-law idea. */
  internalO2Pct: 38,
  /** Release scale: % saturation per sim hour, per tissue point, at full release. */
  releasePerPoint: 45,
  /** Extra release multiplier for the newest tissue (growing root tips and rhizome apices). */
  tipBoost: 1.5,
  tipAgeHours: 10,
  /** Tissue-age release curves: full release until `plateau`, linear fade to zero by `end`.
   * The fade end is chosen so the *emergent* pool duration lands near the Table 1 means. */
  release: {
    rhizome: { rampIn: 0, plateau: 30, end: 70 },
    adventitious: { rampIn: 0, plateau: 40, end: 88 },
    lateral: { rampIn: 10, plateau: 260, end: 520 },
  },
  /** Laterals are fine roots: each point releases less, but there are many of them. */
  lateralReleaseScale: 1.1,
  /** Diel modulation of release (fraction). Kept small so day/night never dominates. */
  dielAmplitude: 0.25,
  /** Spacing between stored tissue points along an organ (px). */
  pointSpacing: 6,
  /** Growth rates (px per sim hour) before any per-level gameplay boost. */
  growthRate: { rhizome: 2.6, adventitious: 2.3, lateral: 0.9 },
  /** Growth comes in pulses: active for `active` of every `period` sim hours (abstraction). */
  pulse: { period: 30, active: 0.7 },
  maxLength: { rhizome: 900, adventitious: [170, 330] as const, lateral: [22, 48] as const },
  /** Rhizome nodes every N px emit adventitious roots after a delay (sim hours). */
  rhizomeNodeSpacing: 130,
  adventitiousDelayHours: 72,
  /** Lateral roots erupt from an adventitious root section this long after it formed. */
  lateralDelayHours: 140,
  lateralsPerCluster: [4, 7] as const,
  /** Display/detection threshold options (% saturation). */
  thresholds: [8, 12, 18] as const,
  /** A pool counts as "present" in an ROI above this (paper: > 1% saturation). */
  roiPresencePct: 1,
} as const;

/** ARCADE — balance only. */
export const ARCADE = {
  basePoints: 100,
  comboStep: 25,
  comboMaxStreak: 13,
  comboWindowSec: 4.5,
  freshBonus: 50,
  freshWindowHours: 14,
  trackedBonus: 40,
  persistentBonus: 60,
  nightBonus: 30,
  roiBonus: 150,
  thresholdMultiplier: [1, 1.15, 1.3] as const,
  /** Re-observation rules (what counts as a *new* observation of an already documented region). */
  moveThresholdPx: 70,
  /** Tip/apex region position follows tissue younger than this (sim hours). */
  tipWindowHours: 30,
  changeFraction: 0.5,
  changeMinPct: 8,
  measurementPeriodHours: 24,
  regionCooldownSec: 1.5,
  hitRadiusPx: 58,
  largeHitRadiusPx: 84,
  detectEverySec: 0.1,
  /** A region gone this long (game sec) is considered vanished. */
  vanishGraceSec: 1,
  scanCooldownSec: 10,
  scanDurationSec: 1.8,
  timelapseWindowHours: 48,
  timelapseSnapshotHours: 1,
  timelapsePlaySec: 3.2,
  maxRois: 3,
  roiEventDeltaPct: 10,
  endlessDataGaps: 6,
  endlessDataGapsGentle: 10,
} as const;

export type Organ = 'rhizome' | 'adventitious' | 'lateral';
