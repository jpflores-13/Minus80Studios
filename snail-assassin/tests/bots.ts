import { ATLAS } from '../src/characters/atlas';
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

/** Same strike/lock/reel shape as catalystBot, since Cipher's abilities reuse those kinds. */
export function octopusBot(useBite = true, reelImmediately = false): Bot {
  return (s) => {
    const t = s.tether;
    if (t) {
      const f = s.fish.find((x) => x.id === t.fishId)!;
      const bitten = !useBite || f.lock > 0.3;
      return {
        move: toward(s, f),
        aim: f.pos,
        primary: false,
        secondary: useBite && f.lock < 0.3 && ready(s, 'secondary'),
        capture: !t.reeling && (bitten || reelImmediately),
      };
    }
    const target = nearest(s, live(s));
    const d = dist(s, target);
    const r = OCTOPUS.abilities.primary.kind === 'strike' ? OCTOPUS.abilities.primary.range : 0;
    return {
      move: d > r - 20 ? toward(s, target) : { x: 0, y: 0 },
      aim: target.pos,
      // Only pounce when there's enough venom to follow up with the paralytic bite.
      primary: d < r - 5 && ready(s, 'primary') && s.venom.reserve >= 30 + (useBite ? 20 : 0),
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
