import { describe, expect, it } from 'vitest';
import { createVenom, refund, stepVenom, tryUse } from '../src/systems/venom';

describe('venom resources', () => {
  it('spends venom and starts a cooldown', () => {
    const v = createVenom(100, 0);
    expect(tryUse(v, 'primary', 30, 3)).toBe('ok');
    expect(v.reserve).toBe(70);
    expect(tryUse(v, 'primary', 30, 3)).toBe('cooldown');
  });

  it('refuses when venom is insufficient', () => {
    const v = createVenom(20, 0);
    expect(tryUse(v, 'secondary', 25, 1)).toBe('no-venom');
    expect(v.reserve).toBe(20);
  });

  it('regenerates and refunds up to the cap, and cooldowns tick down', () => {
    const v = createVenom(100, 10);
    tryUse(v, 'primary', 50, 2);
    stepVenom(v, 1);
    expect(v.reserve).toBe(60);
    expect(v.cooldowns.primary).toBe(1);
    refund(v, 999);
    expect(v.reserve).toBe(100);
  });
});
