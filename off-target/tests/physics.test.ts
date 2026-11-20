import { describe, expect, it } from 'vitest';
import { PHYSICS } from '../src/config/tuning';
import { createBody, stepBody, type MoveInput, type StepOptions } from '../src/systems/physics';
import { parseMap, TILE } from '../src/systems/tilemap';

const NONE: MoveInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  jumpPressed: false,
};
const OPTS: StepOptions = {
  speedFactor: 1,
  airJumps: 0,
  isSolid: (t) => t === 'solid',
  platforms: [],
};
const DT = 1 / 120;

const room = (rows: string[]) => parseMap(rows);
const FLAT = room([
  '##########',
  '#........#',
  '#........#',
  '#........#',
  '#........#',
  '##########',
]);

function run(
  map = FLAT,
  frames: number,
  input: Partial<MoveInput> = {},
  opts: Partial<StepOptions> = {},
  body = createBody(2 * TILE, 3 * TILE),
) {
  const events: string[] = [];
  for (let i = 0; i < frames; i++)
    events.push(
      ...stepBody(
        body,
        { ...NONE, ...input, jumpPressed: i === 0 && !!input.jumpPressed },
        map,
        PHYSICS,
        DT,
        { ...OPTS, ...opts },
      ),
    );
  return { body, events };
}

describe('running and falling', () => {
  it('falls onto the floor and stands on it', () => {
    const { body } = run(FLAT, 120);
    expect(body.onGround).toBe(true);
    expect(body.y + body.h).toBeCloseTo(5 * TILE);
  });

  it('runs right at its top speed and stops at a wall', () => {
    const { body } = run(FLAT, 240, { right: true });
    expect(body.x + body.w).toBeCloseTo(9 * TILE);
    expect(body.vx).toBe(0);
  });

  it('a speed factor (sprint, goo) changes top speed', () => {
    const fast = run(FLAT, 30, { right: true }, { speedFactor: 1.5 }).body;
    const slow = run(FLAT, 30, { right: true }, { speedFactor: 0.5 }).body;
    expect(fast.x).toBeGreaterThan(slow.x);
  });
});

describe('jumping', () => {
  const tall = room(
    ['#', ...Array(12).fill('#........#'), '##########'].map((r) => r.padEnd(10, '#')),
  );

  it('a full jump rises about three tiles', () => {
    const body = createBody(4 * TILE, 11 * TILE);
    run(tall, 60, {}, {}, body);
    const floor = body.y;
    let peak = floor;
    for (let i = 0; i < 90; i++) {
      stepBody(body, { ...NONE, jump: true, jumpPressed: i === 0 }, tall, PHYSICS, DT, OPTS);
      peak = Math.min(peak, body.y);
    }
    expect((floor - peak) / TILE).toBeGreaterThan(2.5);
    expect((floor - peak) / TILE).toBeLessThan(3.2);
  });

  it('letting go early makes a shorter hop', () => {
    const measure = (hold: number) => {
      const body = createBody(4 * TILE, 11 * TILE);
      run(tall, 60, {}, {}, body);
      const floor = body.y;
      let peak = floor;
      for (let i = 0; i < 90; i++) {
        stepBody(body, { ...NONE, jump: i < hold, jumpPressed: i === 0 }, tall, PHYSICS, DT, OPTS);
        peak = Math.min(peak, body.y);
      }
      return floor - peak;
    };
    expect(measure(5)).toBeLessThan(measure(60) * 0.7);
  });

  it('can still jump just after running off a ledge (coyote time)', () => {
    const body = createBody(4 * TILE, 11 * TILE);
    run(tall, 60, {}, {}, body);
    body.onGround = false;
    body.sinceGround = 0;
    const ev = stepBody(
      body,
      { ...NONE, jump: true, jumpPressed: true },
      tall,
      PHYSICS,
      PHYSICS.coyoteTime / 2,
      OPTS,
    );
    expect(ev).toContain('jumped');
  });

  it('double jump only works with an air jump available', () => {
    const body = createBody(4 * TILE, 11 * TILE);
    run(tall, 60, {}, {}, body);
    run(tall, 20, { jump: true, jumpPressed: true }, { airJumps: 0 }, body);
    expect(
      stepBody(body, { ...NONE, jump: true, jumpPressed: true }, tall, PHYSICS, DT, OPTS),
    ).not.toContain('airJumped');
    const b2 = createBody(4 * TILE, 11 * TILE);
    run(tall, 60, {}, { airJumps: 1 }, b2);
    run(tall, 20, { jump: true, jumpPressed: true }, { airJumps: 1 }, b2);
    expect(
      stepBody(b2, { ...NONE, jump: true, jumpPressed: true }, tall, PHYSICS, DT, {
        ...OPTS,
        airJumps: 1,
      }),
    ).toContain('airJumped');
  });
});

describe('ledges, ladders and bouncers', () => {
  const ledge = room([
    '##########',
    '#........#',
    '#........#',
    '#..====..#',
    '#........#',
    '#........#',
    '##########',
  ]);

  it('a ledge holds you from above but lets you jump up through it', () => {
    const body = createBody(4 * TILE, 1 * TILE);
    run(ledge, 120, {}, {}, body);
    expect(body.y + body.h).toBeCloseTo(3 * TILE); // landed on the ledge
    const below = createBody(4 * TILE, 5 * TILE - 14);
    run(ledge, 120, {}, {}, below);
    run(ledge, 50, { jump: true, jumpPressed: true }, {}, below);
    expect(below.y).toBeLessThan(3 * TILE); // went up through it
  });

  it('down + jump drops through a ledge', () => {
    const body = createBody(4 * TILE, 1 * TILE);
    run(ledge, 120, {}, {}, body);
    run(ledge, 60, { down: true, jumpPressed: true, jump: true }, {}, body);
    expect(body.y + body.h).toBeGreaterThan(3 * TILE + 4);
  });

  const ladder = room([
    '##########',
    '#...#....#',
    '#..H#....#',
    '#..H#....#',
    '#..H#....#',
    '#..H.....#',
    '##########',
  ]);
  it('climbs a ladder and stands on top of it', () => {
    const body = createBody(3 * TILE + 3, 5 * TILE);
    run(ladder, 200, { up: true }, {}, body);
    expect(body.y + body.h).toBeLessThanOrEqual(2 * TILE + 0.5);
    run(ladder, 30, {}, {}, body);
    expect(body.onGround).toBe(true);
  });

  const bouncy = room([
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#...V....#',
    '##########',
  ]);
  it('a vesicle bounces you high', () => {
    const body = createBody(4 * TILE + 3, 2 * TILE);
    const { events } = run(
      bouncy,
      60,
      {},
      { isSolid: (t) => t === 'solid' || t === 'bouncer' },
      body,
    );
    expect(events).toContain('bounced');
  });
});
