/**
 * Shared gameplay tuning (the game's `params.yaml`).
 *
 * Every constant here is a GAMEPLAY BALANCING PARAMETER chosen for feel. None
 * of them is a calibrated biological measurement. Character-specific numbers
 * (ability costs, radii) live in src/characters/*.ts.
 *
 * The object is deliberately mutable so the dev-only debug panel can tune it live.
 * Units: pixels, seconds, and dimensionless 0–1 state variables.
 */
export const TUNING = {
  hunt: {
    objectiveCaptures: 3,
    timeLimitSeconds: 180,
    fishCount: 15,
    schools: 3,
  },
  snail: {
    acceleration: 140,
    deceleration: 220,
  },
  fish: {
    baseSpeedMin: 50,
    baseSpeedMax: 70,
    /** Multiplier on swim speed while fleeing. */
    fleeSpeedMultiplier: 2.2,
    /** How quickly fish change velocity (px/s²). */
    agility: 160,
    /** Random heading drift while roaming (radians/s). */
    wanderRate: 1.2,
    /** Schooling neighbourhood (px) and steering weights. */
    schoolRadius: 140,
    cohesionWeight: 0.6,
    separationRadius: 22,
    separationWeight: 1.4,
    edgeMargin: 60,
  },
  metabolic: {
    /** Glucose state g ∈ [0,1]: dg/dt = −drop·I·g + recovery·(1−g)·(1−O). */
    dropRate: 0.4,
    recoveryRate: 0.24,
    /** Exposure decay time constants (s) for insulin-like (I) and override (O) effects. */
    insulinTau: 5,
    overrideTau: 9,
    /** Exposure uptake per second at the centre of a full-strength cloud. */
    uptakeRate: 0.7,
    /** Swim performance = minPerformance + (1 − minPerformance)·g². */
    minPerformance: 0.15,
    /** Fish count as "impaired" (visual state) below this glucose. */
    impairedBelow: 0.65,
  },
  neural: {
    /** Neural impairment n ∈ [0,1]: dn/dt = −recovery·(1 − L)·n, where L is the motor-lock effect. */
    recoveryRate: 0.6,
    lockTau: 6,
    /** Fish cannot swim while n is above this. */
    immobileAbove: 0.45,
  },
  escape: {
    /** Fish can notice the snail within this distance (px). */
    detectionRadius: 150,
    /** Awareness a ∈ [0,1]: da/dt = gain·stimulus·responsiveness·alertness − decay·a. */
    gain: 1.6,
    decay: 0.35,
    /** Moving snails are more noticeable than still ones. */
    stillStimulus: 0.35,
    alertAbove: 0.3,
    fleeAbove: 0.6,
    calmBelow: 0.25,
    /** Escape responsiveness r ∈ [minResponsiveness, 1] recovers toward 1 at this rate (per s). */
    responsivenessRecovery: 0.08,
    minResponsiveness: 0.15,
    /** Strikes startle nearby fish: awareness jumps to this (× responsiveness) within startleRadius. */
    startleRadius: 120,
    missStartle: 0.8,
    hitStartle: 0.65,
  },
  capture: {
    /** Fish are catchable when vulnerability ≥ this. */
    vulnerabilityThreshold: 0.7,
  },
  venom: {
    max: 100,
    regenPerSecond: 2.5,
    refundPerCapture: 20,
  },
  current: {
    /** Gentle reef current (px/s): horizontal bands that slowly shift over time. */
    strength: 14,
    bandWavelength: 180,
    timeFrequency: 0.15,
  },
  marineSnow: {
    count: 60,
  },
};

export type Tuning = typeof TUNING;
