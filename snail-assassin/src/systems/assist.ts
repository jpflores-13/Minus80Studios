import { touchAim } from './aim';
import { isCatchable, type HuntInput, type HuntState } from './hunt';

// Assist mode, for one-handed or single-switch play: abilities aim themselves at the
// nearest sensible target, and the capture ability (plus Catalyst's Motor Lock) fires on
// its own at the right moment. The player only moves and chooses when to use Q and E.
export function applyAssist(state: HuntState, input: HuntInput): HuntInput {
  const out: HuntInput = { ...input };
  if (input.primary) out.aim = touchAim(state, 'primary', null);
  else if (input.secondary) out.aim = touchAim(state, 'secondary', null);

  const { venom, character } = state;
  const capture = character.abilities.capture;
  const secondary = character.abilities.secondary;
  const ready = (slot: 'secondary' | 'capture') => venom.cooldowns[slot] <= 0;

  if (capture.kind === 'engulf' && ready('capture')) {
    const s = state.snail.pos;
    const inReach = state.fish.some(
      (f) => isCatchable(state, f) && Math.hypot(f.pos.x - s.x, f.pos.y - s.y) <= capture.radius,
    );
    if (inReach) out.capture = true;
  }

  if (capture.kind === 'reel' && state.tether && !state.tether.reeling) {
    const fish = state.fish.find((f) => f.id === state.tether?.fishId);
    const canLock =
      secondary.kind === 'lock' && ready('secondary') && venom.reserve >= secondary.cost;
    if (fish && fish.lock < 0.3 && canLock) out.secondary = true;
    else if (ready('capture')) out.capture = true;
  }

  return out;
}
