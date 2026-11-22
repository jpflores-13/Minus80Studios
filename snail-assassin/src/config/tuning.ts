// Gameplay tuning. Balancing values chosen for feel, not biological measurements.
// Character-specific numbers live in src/characters. Kept mutable so the dev panel can tweak them.
export const TUNING = {
  hunt: {
    objectiveCaptures: 3,
    timeLimitSeconds: 180,
    fishCount: 15,
    schools: 3,
    /** Cipher's hunt (prey: 'snail'): individually scattered cone snails, no schools. */
    scatteredPreyCount: 15,
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
  /**
   * Cipher's prey (prey: 'snail' in CharacterConfig): cone snails are confirmed solitary foragers,
   * not schooling animals, so this has no cohesion/separation weight (each one is also placed as
   * its own unique "school" in createHunt, which already zeroes schoolingSteer on its own — the
   * weights below are set to 0 explicitly so that's not left to a side effect). Base speed is
   * much slower than TUNING.fish: cone snails are slow benthic crawlers, not swimming fish.
   */
  snailPrey: {
    baseSpeedMin: 16,
    baseSpeedMax: 26,
    fleeSpeedMultiplier: 1.6,
    agility: 90,
    wanderRate: 0.5,
    schoolRadius: 0,
    cohesionWeight: 0,
    separationRadius: 0,
    separationWeight: 0,
    edgeMargin: 60,
  },
  /**
   * The blue shark's prey (prey: 'squid' in CharacterConfig). Markaida & Sosa-Nishizaki 2010
   * found the blue shark's cephalopod prey off Baja California was dominated by "non-active,
   * gelatinous" meso- to bathypelagic squid, not fast schooling surface squid, so base speed is
   * slow (slower than reef fish, a little faster than the benthic cone snails) and, like
   * snailPrey, no cohesion/separation (placed as scattered individuals in createHunt — see
   * docs/SCIENCE.md's open question on squid schooling before treating "no schooling" as settled
   * for every squid species).
   */
  squidPrey: {
    baseSpeedMin: 20,
    baseSpeedMax: 34,
    fleeSpeedMultiplier: 1.8,
    agility: 100,
    wanderRate: 0.7,
    schoolRadius: 0,
    cohesionWeight: 0,
    separationRadius: 0,
    separationWeight: 0,
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
  predator: {
    // Octopus (threatens the snail characters). Faster than the snail when chasing, so holding
    // still is the way out.
    patrolSpeed: 35,
    chaseSpeed: 62,
    agility: 120,
    sightRadius: 200,
    /** How visible a motionless snail is (0 = invisible, 1 = as visible as a moving one). */
    stillVisibility: 0.08,
    gain: 1.4,
    decay: 0.5,
    chaseAbove: 0.55,
    loseInterestBelow: 0.2,
    grabRadius: 34,
    retreatSeconds: 7,
    /** What a grab costs the snail. */
    stunSeconds: 2.5,
    venomLost: 25,
  },
  shark: {
    // Threatens the octopus character. Same patrol/chase/grab/retreat shape as `predator`
    // (src/systems/predator.ts), tuned differently: faster, and stillVisibility is much higher
    // because the real inspiration (Kalmijn 1971) is an electroreception sense that detects a
    // prey animal's own bioelectric field at close range, not its motion. Holding still still
    // helps here (the game only models detection falling off with distance, not a full
    // electroreception model), just less than it does against the octopus threat.
    patrolSpeed: 42,
    chaseSpeed: 78,
    agility: 140,
    sightRadius: 210,
    stillVisibility: 0.2,
    gain: 1.5,
    decay: 0.45,
    chaseAbove: 0.55,
    loseInterestBelow: 0.2,
    grabRadius: 38,
    retreatSeconds: 6,
    /** What a bite costs the octopus. */
    stunSeconds: 2,
    venomLost: 25,
  },
  orca: {
    // Threatens the blue shark character. Same patrol/chase/grab/retreat shape as `predator` and
    // `shark`, tuned for a bigger, more powerful animal: faster, and a much larger grab radius
    // (see TUNING.orcaPod for the pack-coordination numbers, src/systems/predator.ts for the
    // state machine, and docs/SCIENCE.md for the real orca pack-hunting behaviour this models).
    patrolSpeed: 46,
    chaseSpeed: 86,
    agility: 130,
    sightRadius: 220,
    stillVisibility: 0.1,
    gain: 1.4,
    decay: 0.5,
    chaseAbove: 0.55,
    loseInterestBelow: 0.2,
    grabRadius: 46,
    retreatSeconds: 7,
    /** What a hit costs the shark. */
    stunSeconds: 2.5,
    venomLost: 25,
  },
  /**
   * The orca pod itself (see HuntState.pack, src/systems/predator.ts stepped once per member in
   * src/systems/hunt.ts). `size` is the total pod including the one in HuntState.predator.
   * `alertGain` is a pure gameplay abstraction for how fast a patrolling pod member is "called"
   * toward the player once any packmate is chasing — it doesn't model a specific real signalling
   * mechanism, only the documented fact that real orca pods hunt cooperatively and together
   * (see docs/SCIENCE.md).
   */
  orcaPod: {
    size: 3,
    alertGain: 2.2,
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
