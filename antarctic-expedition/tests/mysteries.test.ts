import { describe, expect, it } from 'vitest';
import { MYSTERIES } from '../src/content/mysteries';
import { interpret, isUnlocked } from '../src/systems/mysteries';

describe('mysteries', () => {
  it('has exactly six mysteries, each with a full set of interpretation explanations', () => {
    expect(MYSTERIES.length).toBe(6);
    for (const m of MYSTERIES) {
      expect(m.explanation.supported).toBeTruthy();
      expect(m.explanation.insufficient).toBeTruthy();
      expect(m.explanation.notSupported).toBeTruthy();
    }
  });

  it('is locked until all required evidence is discovered', () => {
    const leopard = MYSTERIES.find((m) => m.id === 'leopard-seal-courtship')!;
    expect(isUnlocked(leopard, {})).toBe(false);
    expect(isUnlocked(leopard, { leopardSeal: { discovered: true, bestQuality: 2 } })).toBe(true);
  });

  it('the leopard seal mystery stays honestly unresolved: "supported" is never the right call', () => {
    const leopard = MYSTERIES.find((m) => m.id === 'leopard-seal-courtship')!;
    expect(leopard.correctInterpretation).toBe('insufficient');
    const outcome = interpret(leopard, 'supported');
    expect(outcome.calibrated).toBe(false);
    expect(outcome.explanation.toLowerCase()).toContain('never directly observed');
  });

  it('a correct interpretation is reported as calibrated, not scored pass/fail only', () => {
    const leopard = MYSTERIES.find((m) => m.id === 'leopard-seal-courtship')!;
    const outcome = interpret(leopard, 'insufficient');
    expect(outcome.calibrated).toBe(true);
  });
});
