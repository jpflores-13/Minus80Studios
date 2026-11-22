// Characters are plain data built from a few shared ability kinds:
//   cloud       - area effect dropped at the cursor, drifts with the current
//   engulf      - swallow weakened fish near the snail
//   strike      - aimed harpoon that pins one fish
//   lock        - stops the pinned fish from recovering
//   reel        - pull the pinned fish in
//   camouflage  - Cipher only: a timed stealth window (see docs/SCIENCE.md, Josef et al. 2012)
//   pursuit     - Glaucus only: give chase instead of aiming (see docs/SCIENCE.md, Sciarrotta &
//                 Nelson 1977)
//   burst       - Glaucus only: buy more time on an in-progress chase
export type CloudEffect = 'insulin' | 'override' | 'dampen';

interface AbilityBase {
  label: string;
  /** One-line description for the character-select screen and tutorial. */
  blurb: string;
  cost: number;
  cooldown: number;
}

export interface CloudAbility extends AbilityBase {
  kind: 'cloud';
  effect: CloudEffect;
  /** Max distance from the snail at which the cloud can be placed (px). */
  range: number;
  radius: number;
  lifeSeconds: number;
  potency: number;
}

export interface EngulfAbility extends AbilityBase {
  kind: 'engulf';
  radius: number;
  maxCaptures: number;
  /**
   * Extra vulnerability for fish that are unaware AND have dampened escape
   * responsiveness: bonus·(1 − awareness)·(1 − responsiveness). 0 = ignore stealth.
   */
  unawareBonus: number;
}

export interface StrikeAbility extends AbilityBase {
  kind: 'strike';
  range: number;
  /** How close to the cursor a fish must be to count as aimed at (px). */
  aimTolerance: number;
  /** Extra cooldown added on a miss. */
  missPenalty: number;
  /**
   * Cipher only: the strike also sets the fish's motor-lock immediately, with no separate lock
   * ability needed. Grounded in Bidel et al. 2022, which found Octopus bimaculoides uses
   * synchronous (simultaneous) arm recruitment on hard-shelled, benthic prey like crabs, rather
   * than the sequential grab-then-hold used on soft prey like shrimp — generalised here to cone
   * snails as a comparably shelled, benthic prey type (see docs/SCIENCE.md for that
   * generalisation, and for the paralytic-bite venom this also stands in for).
   */
  instantGrip?: boolean;
}

export interface LockAbility extends AbilityBase {
  kind: 'lock';
  potency: number;
}

export interface ReelAbility extends AbilityBase {
  kind: 'reel';
  reelSpeed: number;
  captureRadius: number;
  /** The tether snaps if the fish is farther than this. */
  tetherLength: number;
}

/**
 * Cipher only: a timed stealth window (see docs/SCIENCE.md, Josef et al. 2012 — Octopus cyanea
 * and O. vulgaris use rapid, visually-driven chromatophore camouflage against predation pressure).
 * While active, the octopus moves more slowly but barely registers as motion to the shark's
 * detection model or to nearby prey's awareness (see `detectionMultiplier`, applied to the same
 * motion signal both already use — src/systems/hunt.ts). Ends the instant Pounce (a `strike`
 * ability) is used, whether it hits or misses.
 */
export interface CamouflageAbility extends AbilityBase {
  kind: 'camouflage';
  durationSeconds: number;
  /** Movement speed multiplier while camouflaged: slower, a real tradeoff for crypsis. */
  speedMultiplier: number;
  /**
   * How much of the octopus's actual motion still counts toward being noticed while camouflaged
   * (0 = motion no longer matters at all, 1 = no stealth benefit). Not full invisibility: some
   * signal still gets through, same as holding still already does for every character.
   */
  detectionMultiplier: number;
}

/**
 * Glaucus only: lock onto the nearest live squid in range and give chase at elevated speed for a
 * limited window, rather than aiming a single precise strike (see docs/SCIENCE.md, Sciarrotta &
 * Nelson 1977 — telemetry on real blue sharks found swimming speed and movement rate are not
 * constant, with measurable, repeated high-activity phases). No aim-tolerance check: a pursuit
 * predator closes on whatever it has already sensed nearby, not a pinpoint target.
 */
export interface PursuitAbility extends AbilityBase {
  kind: 'pursuit';
  /** Max distance to acquire a target when the chase begins. */
  range: number;
  /** Swim-speed multiplier while chasing. */
  chaseSpeedMultiplier: number;
  /** The chase fails if the target isn't caught within this many seconds. */
  durationSeconds: number;
  /** Contact distance that counts as catching the target. */
  grabRadius: number;
  /** Extra cooldown added when no target is found in range. */
  missPenalty: number;
}

/** Glaucus only: a short extra push that buys more time on an in-progress chase. Needs an active
 *  pursuit — denied otherwise, the same way Lock and Reel need a tethered fish. */
export interface BurstAbility extends AbilityBase {
  kind: 'burst';
  /** Extra seconds added to the in-progress chase's deadline. */
  extraSeconds: number;
}

export type AbilityConfig =
  | CloudAbility
  | EngulfAbility
  | StrikeAbility
  | LockAbility
  | ReelAbility
  | CamouflageAbility
  | PursuitAbility
  | BurstAbility;

/** Qualitative 1–5 ratings shown on the selection screen (gameplay, not biology). */
export interface Attributes {
  speed: number;
  range: number;
  burst: number;
  area: number;
  stealth: number;
}

export interface CharacterConfig {
  id: 'catalyst' | 'atlas' | 'nightshade' | 'octopus' | 'blueshark';
  name: string;
  species: string;
  commonName: string;
  /** How the reveal screen names what the player was: "a real cone snail", "a real octopus". */
  animalLabel: string;
  title: string;
  tagline: string;
  personality: string;
  specialization: string;
  /**
   * Which threat AI hunts this character, parameterised from TUNING (predator = the octopus,
   * shark = TUNING.shark, orca = TUNING.orca). 'orca' is a pod (see TUNING.orcaPod,
   * HuntState.pack): several coordinating threats instead of one.
   */
  threat: 'octopus' | 'shark' | 'orca';
  /**
   * What this character hunts: 'fish' places a few schools of reef fish (the three cone snails);
   * 'snail' scatters individual cone snails with no schooling (Cipher); 'squid' scatters
   * individual squid with no schooling (the blue shark). See docs/SCIENCE.md: cone snails are
   * solitary foragers, so Cipher's prey is placed as scattered individuals, not a school; the
   * blue shark's documented squid prey are mostly deep-water, non-schooling species, and 'squid'
   * reuses that same scattered-individual placement as a deliberate simplification (some other
   * squid species do school — see the Open Questions in docs/SCIENCE.md).
   */
  prey: 'fish' | 'snail' | 'squid';
  /**
   * What the shared ability-cost pool is called on screen. 'Venom' for the cone snails and the
   * octopus (both genuinely venomous — see docs/SCIENCE.md). Sharks have no venom at all, so the
   * blue shark uses 'Energy' instead; its ability text was previously copy-pasted from a
   * venomous character's and incorrectly said "waste venom" too — fixed alongside this.
   */
  resourceName: string;
  /** Top swim speed of the player-controlled animal (px/s). */
  speed: number;
  palette: {
    shell: number;
    pattern: number;
    body: number;
    accent: number;
    cloud: number;
    ui: string;
  };
  abilities: { primary: AbilityConfig; secondary: AbilityConfig; capture: AbilityConfig };
  combo: string;
  strengths: string[];
  weaknesses: string[];
  attributes: Attributes;
}
