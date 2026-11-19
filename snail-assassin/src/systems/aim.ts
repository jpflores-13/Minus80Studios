import type { Vec2 } from '../utils/math';
import type { Fish } from './fish';
import type { HuntState } from './hunt';
import type { AbilitySlot } from './venom';

// On touch screens there's no mouse cursor, so abilities aim at the last spot the
// player tapped. If they haven't tapped recently, aim at the nearest fish instead.

export const TAP_MEMORY_SECONDS = 3;
const TAP_TO_FISH_RADIUS = 80;

export interface Tap {
  pos: Vec2;
  time: number;
}

export function touchAim(state: HuntState, slot: AbilitySlot, tap: Tap | null): Vec2 {
  const ability = state.character.abilities[slot];
  const snail = state.snail.pos;
  const live = state.fish.filter((f) => f.mode !== 'captured' && !f.tethered);
  const recentTap = tap && state.time - tap.time <= TAP_MEMORY_SECONDS ? tap : null;

  if (ability.kind === 'strike') {
    const inRange = live.filter((f) => dist(f.pos, snail) <= ability.range);
    // Snap a tap to the closest fish near it, so you don't need pixel-perfect taps.
    const nearTap = recentTap
      ? closest(
          inRange.filter((f) => dist(f.pos, recentTap.pos) <= TAP_TO_FISH_RADIUS),
          recentTap.pos,
        )
      : null;
    const target = nearTap ?? closest(inRange, snail);
    if (target) return { ...target.pos };
    return recentTap ? { ...recentTap.pos } : ahead(state);
  }

  if (ability.kind === 'cloud') {
    if (recentTap) return { ...recentTap.pos };
    const target = closest(live, snail);
    return target ? { ...target.pos } : ahead(state);
  }

  return { ...snail };
}

function closest(fish: Fish[], to: Vec2): Fish | null {
  let best: Fish | null = null;
  for (const f of fish) if (!best || dist(f.pos, to) < dist(best.pos, to)) best = f;
  return best;
}

function ahead(state: HuntState): Vec2 {
  const { pos, heading } = state.snail;
  return { x: pos.x + Math.cos(heading) * 120, y: pos.y + Math.sin(heading) * 120 };
}

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
