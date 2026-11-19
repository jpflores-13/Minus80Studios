import { describe, expect, it } from 'vitest';
import { ATLAS } from '../src/characters/atlas';
import { CATALYST } from '../src/characters/catalyst';
import { touchAim } from '../src/systems/aim';
import { createHunt } from '../src/systems/hunt';

describe('touch aiming', () => {
  it('a strike snaps to the fish nearest the tap', () => {
    const s = createHunt(CATALYST, 1);
    const fish = s.fish[0]!;
    fish.pos = { x: s.snail.pos.x + 100, y: s.snail.pos.y };
    const aim = touchAim(s, 'primary', {
      pos: { x: fish.pos.x + 30, y: fish.pos.y + 20 },
      time: s.time,
    });
    expect(aim).toEqual(fish.pos);
  });

  it('a strike with no recent tap targets the nearest fish in range', () => {
    const s = createHunt(CATALYST, 1);
    const fish = s.fish[3]!;
    fish.pos = { x: s.snail.pos.x + 60, y: s.snail.pos.y };
    expect(touchAim(s, 'primary', null)).toEqual(fish.pos);
  });

  it('a cloud goes where you tapped, and old taps are forgotten', () => {
    const s = createHunt(ATLAS, 1);
    const tap = { pos: { x: 400, y: 300 }, time: 0 };
    expect(touchAim(s, 'primary', tap)).toEqual(tap.pos);
    s.time = 10;
    expect(touchAim(s, 'primary', tap)).not.toEqual(tap.pos);
  });
});
