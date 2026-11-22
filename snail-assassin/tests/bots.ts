import { ATLAS } from '../src/characters/atlas';
import { BLUESHARK } from '../src/characters/blueshark';
import { CATALYST } from '../src/characters/catalyst';
import { NIGHTSHADE } from '../src/characters/nightshade';
import { OCTOPUS } from '../src/characters/octopus';
import type { CharacterConfig } from '../src/characters/types';
import { TUNING } from '../src/config/tuning';
import type { Fish } from '../src/systems/fish';
import {
  createHunt,
  isCatchable,
  stepHunt,
  type HuntInput,
  type HuntState,
} from '../src/systems/hunt';
import { normalize } from '../src/utils/math';

/**
 * Simple scripted players used to check that each character can win with its
 * intended strategy, and that shortcuts don't work. They are deliberately
 * naive (no prediction), so a human with practice should do at least as well.
 */
export type Bot = (s: HuntState) => HuntInput;

const dist = (s: HuntState, f: Fish) =>
  Math.hypot(f.pos.x - s.snail.pos.x, f.pos.y - s.snail.pos.y);
const live = (s: HuntState) => s.fish.filter((f) => f.mode !== 'captured');
const nearest = (s: HuntState, pool: Fish[]) =>
  pool.reduce((a, b) => (dist(s, a) <= dist(s, b) ? a : b));
const toward = (s: HuntState, f: Fish) =>
  normalize({ x: f.pos.x - s.snail.pos.x, y: f.pos.y - s.snail.pos.y });
const capRadius = (c: CharacterConfig) => {
  const cap = c.abilities.capture;
  return cap.kind === 'engulf' ? cap.radius : 0;
};
const ready = (s: HuntState, slot: 'primary' | 'secondary' | 'capture') =>
  s.venom.cooldowns[slot] <= 0;

export function atlasBot(useOverride = true): Bot {
  return (s) => {
    const catchable = live(s).filter((f) => isCatchable(s, f));
    const target = nearest(s, catchable.length ? catchable : live(s));
    const d = dist(s, target);
    return {
      move: toward(s, target),
      aim: target.pos,
      primary: d < 200 && catchable.length === 0 && target.insulin < 0.3,
      secondary: useOverride && d < 200 && target.insulin > 0.3 && target.override < 0.3,
      capture: d < capRadius(ATLAS) - 5 && catchable.length > 0,
    };
  };
}

export function catalystBot(useLock = true, reelImmediately = false): Bot {
  return (s) => {
    const t = s.tether;
    if (t) {
      const f = s.fish.find((x) => x.id === t.fishId)!;
      const locked = !useLock || f.lock > 0.3;
      return {
        move: toward(s, f),
        aim: f.pos,
        primary: false,
        secondary: useLock && f.lock < 0.3 && ready(s, 'secondary'),
        capture: !t.reeling && (locked || reelImmediately),
      };
    }
    const target = nearest(s, live(s));
    const d = dist(s, target);
    const r = CATALYST.abilities.primary.kind === 'strike' ? CATALYST.abilities.primary.range : 0;
    return {
      move: d > r - 20 ? toward(s, target) : { x: 0, y: 0 },
      aim: target.pos,
      // Only strike when there's enough venom to follow up with Motor Lock.
      primary: d < r - 5 && ready(s, 'primary') && s.venom.reserve >= 30 + (useLock ? 20 : 0),
      secondary: false,
      capture: false,
    };
  };
}

/**
 * Cipher's own mechanic: Camouflage (primary, timed stealth) while approaching, then Pounce
 * (secondary, a strike that restrains on contact — see `instantGrip`), then Draw to Mouth. Set
 * `useCamouflage` to false to prove camouflage isn't required to catch anything (cone snails are
 * slow; it exists to reduce shark grabs, not to enable capture — see hunt.test.ts).
 */
export function octopusBot(useCamouflage = true): Bot {
  return (s) => {
    const t = s.tether;
    if (t) {
      const f = s.fish.find((x) => x.id === t.fishId)!;
      return {
        move: toward(s, f),
        aim: f.pos,
        primary: false,
        secondary: false,
        capture: !t.reeling,
      };
    }
    const target = nearest(s, live(s));
    const d = dist(s, target);
    const pounce = OCTOPUS.abilities.secondary;
    const r = pounce.kind === 'strike' ? pounce.range : 0;
    const inPounceRange = d < r - 5;
    return {
      move: d > r - 20 ? toward(s, target) : { x: 0, y: 0 },
      aim: target.pos,
      // Camouflage only while still closing the distance — pouncing cancels it anyway, so
      // triggering both in the same frame would just waste the venom.
      primary:
        useCamouflage &&
        !inPounceRange &&
        s.camouflage <= 0 &&
        ready(s, 'primary') &&
        s.venom.reserve >= 60,
      secondary: inPounceRange && ready(s, 'secondary') && s.venom.reserve >= 35,
      capture: false,
    };
  };
}

/**
 * Glaucus's own mechanic: Pursuit (primary, a time-limited chase with no cursor aim) instead of
 * a precise strike, then Burst (secondary) to buy more time when the chase is about to run out,
 * then Swallow Whole. Set `useBurst` to false to prove a bare chase can still fail to catch a
 * squid that gets away before the window closes — see hunt.test.ts.
 */
export function blueSharkBot(useBurst = true): Bot {
  return (s) => {
    const t = s.tether;
    if (t) {
      const f = s.fish.find((x) => x.id === t.fishId)!;
      return {
        move: toward(s, f),
        aim: f.pos,
        primary: false,
        secondary: false,
        capture: !t.reeling,
      };
    }
    if (s.pursuit) {
      const f = s.fish.find((x) => x.id === s.pursuit!.fishId);
      const timeLeft = s.pursuit.until - s.time;
      return {
        move: f ? toward(s, f) : { x: 0, y: 0 },
        aim: f ? f.pos : s.snail.pos,
        primary: false,
        secondary: useBurst && timeLeft < 1 && ready(s, 'secondary'),
        capture: false,
      };
    }
    const pursue = BLUESHARK.abilities.primary;
    const r = pursue.kind === 'pursuit' ? pursue.range : 0;
    const target = nearest(s, live(s));
    const d = dist(s, target);
    return {
      move: d > r - 20 ? toward(s, target) : { x: 0, y: 0 },
      aim: target.pos,
      primary: d < r - 10 && ready(s, 'primary') && s.venom.reserve >= 30,
      secondary: false,
      capture: false,
    };
  };
}

export function nightshadeBot(useGhost = true, useTide = true): Bot {
  return (s) => {
    const catchable = live(s).filter((f) => isCatchable(s, f));
    const target = nearest(s, catchable.length ? catchable : live(s));
    const d = dist(s, target);
    return {
      move: toward(s, target),
      aim: target.pos,
      primary: useGhost && d < 190 && target.responsiveness > 0.5,
      secondary:
        useTide && d < 150 && (target.responsiveness < 0.6 || !useGhost) && target.insulin < 0.3,
      capture: d < capRadius(NIGHTSHADE) - 5 && catchable.length > 0,
    };
  };
}

export function play(character: CharacterConfig, seed: number, bot: Bot, dt = 1 / 60): HuntState {
  const s = createHunt(character, seed);
  while (s.outcome === 'playing') stepHunt(s, bot(s), dt);
  return s;
}

export const SEEDS = [11, 22, 33, 44, 55, 66, 77, 88];
export const objective = () => TUNING.hunt.objectiveCaptures;
