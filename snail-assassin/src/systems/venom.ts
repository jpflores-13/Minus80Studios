import { clamp } from '../utils/math';

export type AbilitySlot = 'primary' | 'secondary' | 'capture';

export interface VenomState {
  reserve: number;
  max: number;
  regenPerSecond: number;
  cooldowns: Record<AbilitySlot, number>;
  spent: number;
}

export type UseResult = 'ok' | 'cooldown' | 'no-venom';

export function createVenom(max: number, regenPerSecond: number): VenomState {
  return {
    reserve: max,
    max,
    regenPerSecond,
    cooldowns: { primary: 0, secondary: 0, capture: 0 },
    spent: 0,
  };
}

export function stepVenom(v: VenomState, dt: number): void {
  v.reserve = clamp(v.reserve + v.regenPerSecond * dt, 0, v.max);
  for (const slot of Object.keys(v.cooldowns) as AbilitySlot[]) {
    v.cooldowns[slot] = Math.max(0, v.cooldowns[slot] - dt);
  }
}

/** Spend venom and start a cooldown, if possible. */
export function tryUse(
  v: VenomState,
  slot: AbilitySlot,
  cost: number,
  cooldown: number,
): UseResult {
  if (v.cooldowns[slot] > 0) return 'cooldown';
  if (v.reserve < cost) return 'no-venom';
  v.reserve -= cost;
  v.spent += cost;
  v.cooldowns[slot] = cooldown;
  return 'ok';
}

export function refund(v: VenomState, amount: number): void {
  v.reserve = clamp(v.reserve + amount, 0, v.max);
}
