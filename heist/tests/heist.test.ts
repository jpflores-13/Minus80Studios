import { describe, expect, it } from 'vitest';
import { CREW } from '../src/content/crew';
import { JOBS } from '../src/levels';
import type { JobConfig } from '../src/levels/types';
import {
  centre,
  lineOfSight,
  parseBuilding,
  pathIndexAt,
  solid,
  tileAt,
  TILE,
} from '../src/systems/building';
import {
  active,
  canDeploy,
  createFolds,
  deploy,
  links,
  release,
  stepFolds,
} from '../src/systems/folder';
import {
  createMission,
  findPath,
  NO_INPUT,
  score,
  stepMission,
  type Mission,
} from '../src/systems/mission';

const DT = 1 / 60;
const job = JOBS[0]!;
const spec = CREW.ghost.folder;
const run = (m: Mission, seconds: number, input = NO_INPUT) => {
  const ev = [];
  for (let t = 0; t < seconds && m.status === 'playing'; t += DT)
    ev.push(...stepMission(m, input, DT));
  return ev;
};
const stand = (m: Mission, tx: number, ty: number) => {
  const c = centre({ tx, ty });
  m.player.x = c.x;
  m.player.y = c.y;
};
const quiet = (m: Mission) => {
  m.guards = [];
  m.cameras = [];
  return m;
};

describe('the building and its pathway', () => {
  const b = parseBuilding(job.map);

  it('reads the service corridor as one ordered line', () => {
    expect(b.path.length).toBeGreaterThan(40);
    for (let i = 1; i < b.path.length; i++) {
      const a = b.path[i - 1]!;
      const c = b.path[i]!;
      expect(Math.abs(a.tx - c.tx) + Math.abs(a.ty - c.ty)).toBe(1);
    }
  });

  it('finds the anchors on it', () => {
    expect(b.anchors).toHaveLength(2);
    expect(b.anchors[0]).toBeLessThan(b.anchors[1]!);
  });

  it('reads one-way anchors with the right facing', () => {
    // a single corridor line '=>=<=' so both one-way tiles sit on the same traced path
    const oneWay = parseBuilding(['#########', '#P......#', '#.=>=<=.#', '#########']);
    expect(oneWay.oneWayAnchors).toHaveLength(2);
    const byFacing = (f: 1 | -1) => oneWay.oneWayAnchors.find((a) => a.facing === f);
    expect(byFacing(1)).toBeDefined();
    expect(byFacing(-1)).toBeDefined();
  });
});

describe('the Folder', () => {
  const b = parseBuilding(job.map);
  const mid = Math.floor((b.anchors[0]! + b.anchors[1]!) / 2);

  it('its two ends move independently, and the order of the corridor never changes', () => {
    const f = createFolds(b.path.length, [], spec, 3);
    deploy(f, mid);
    const lefts: number[] = [];
    const rights: number[] = [];
    for (let t = 0; t < 3; t += DT) {
      stepFolds(f, DT);
      const fold = active(f)[0]!;
      lefts.push(fold.left);
      rights.push(fold.right);
      expect(fold.left).toBeLessThanOrEqual(fold.right);
    }
    // the two ends don't move in lockstep
    expect(lefts.map((l) => mid - l)).not.toEqual(rights.map((r) => r - mid));
    expect(b.path).toEqual(parseBuilding(job.map).path);
  });

  it('anchors stop each end, and the fold then links the two anchors', () => {
    const f = createFolds(b.path.length, b.anchors, spec, 1);
    deploy(f, mid);
    for (let t = 0; t < 12; t += DT) stepFolds(f, DT);
    expect(links(f)).toEqual([[b.anchors[0], b.anchors[1]]]);
  });

  it('when one end is held, the other keeps going', () => {
    const f = createFolds(b.path.length, [mid - 2], spec, 1);
    deploy(f, mid);
    for (let t = 0; t < 4; t += DT) stepFolds(f, DT);
    const fold = active(f)[0]!;
    expect(fold.left).toBe(mid - 2);
    expect(fold.right).toBeGreaterThan(mid + 5);
  });

  it('lets go after its lifetime, then needs to cool down', () => {
    const f = createFolds(b.path.length, b.anchors, spec, 1);
    deploy(f, mid);
    let released = 0;
    for (let t = 0; t < spec.lifetime + 1; t += DT) released += stepFolds(f, DT).released;
    expect(released).toBe(1);
    expect(active(f)).toHaveLength(0);
    expect(canDeploy(f, mid)).toBe(false);
  });

  it('can be released early, and charges run out', () => {
    const f = createFolds(b.path.length, b.anchors, { ...spec, charges: 1, cooldown: 0 }, 1);
    expect(deploy(f, mid)).toBe(true);
    release(f);
    expect(active(f)).toHaveLength(0);
    expect(deploy(f, mid)).toBe(false);
  });

  it('two devices (Architect) can run at once, but not on top of each other', () => {
    const f = createFolds(b.path.length, b.anchors, CREW.architect.folder, 1);
    expect(deploy(f, 10)).toBe(true);
    expect(deploy(f, 10)).toBe(false);
    expect(deploy(f, 30)).toBe(true);
    expect(active(f)).toHaveLength(2);
  });

  it('a one-way anchor holds the locked direction but lets the other one through', () => {
    const noBypass = { ...spec, bypass: 0 };
    // facing: 1 (the '>' tile) holds an end moving left, same as the engine's own convention
    const f = createFolds(b.path.length, [], noBypass, 1, [{ bin: mid - 2, facing: 1 }]);
    deploy(f, mid);
    for (let t = 0; t < 4; t += DT) stepFolds(f, DT);
    const fold = active(f)[0]!;
    expect(fold.left).toBe(mid - 2);
    // the right end moves away from the lock, so nothing holds it
    expect(fold.right).toBeGreaterThan(mid + 5);
  });

  it('a crew member with a higher bypass skill slips a one-way lock more often', () => {
    const run5 = (bypass: number) => {
      let stops = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const f = createFolds(b.path.length, [], { ...spec, bypass }, seed, [
          { bin: mid - 2, facing: 1 },
        ]);
        deploy(f, mid);
        for (let t = 0; t < 4; t += DT) stepFolds(f, DT);
        if (active(f)[0]!.left === mid - 2) stops++;
      }
      return stops;
    };
    expect(run5(0)).toBeGreaterThan(run5(0.9));
  });

  it('the same seed gives the same fold', () => {
    const go = () => {
      const f = createFolds(b.path.length, [], spec, 9);
      deploy(f, mid);
      for (let t = 0; t < 2; t += DT) stepFolds(f, DT);
      return [active(f)[0]!.left, active(f)[0]!.right];
    };
    expect(go()).toEqual(go());
  });
});

describe('moving through folds', () => {
  it('stepping onto one end carries you out of the other, and you stay there when it unfolds', () => {
    const m = quiet(createMission(job));
    const [a, b] = m.b.anchors as [number, number];
    const mid = Math.floor((a + b) / 2);
    const spotMid = m.b.path[mid]!;
    stand(m, spotMid.tx, spotMid.ty);
    stepMission(m, { ...NO_INPUT, fold: true }, DT);
    run(m, 12);
    expect(links(m.folds)).toEqual([[a, b]]);
    const near = m.b.path[a + 1]!;
    stand(m, near.tx, near.ty);
    run(m, DT * 2);
    const end = m.b.path[a]!;
    stand(m, end.tx, end.ty);
    const ev = run(m, DT * 2);
    expect(ev.some((e) => e.type === 'crossed' && e.who === 'player')).toBe(true);
    const there = { x: m.player.x, y: m.player.y };
    expect(pathIndexAt(m.b, Math.floor(there.x / TILE), Math.floor(there.y / TILE))).toBe(b);
    run(m, 20); // the fold expires
    expect(links(m.folds)).toHaveLength(0);
    expect(m.player.x).toBeCloseTo(there.x);
    expect(m.player.y).toBeCloseTo(there.y);
  });

  it('standing still on a doorway does not bounce you back and forth', () => {
    const m = quiet(createMission(job));
    const [a] = m.b.anchors as [number, number];
    const mid = Math.floor((m.b.anchors[0]! + m.b.anchors[1]!) / 2);
    stand(m, m.b.path[mid]!.tx, m.b.path[mid]!.ty);
    stepMission(m, { ...NO_INPUT, fold: true }, DT);
    run(m, 12);
    stand(m, m.b.path[a]!.tx, m.b.path[a]!.ty);
    const ev = run(m, 2);
    expect(ev.filter((e) => e.type === 'crossed')).toHaveLength(1);
  });

  it('you can only deploy in the corridor', () => {
    const m = quiet(createMission(job));
    const ev = stepMission(m, { ...NO_INPUT, fold: true }, DT);
    expect(ev).toContainEqual({ type: 'deployFailed', why: 'not-corridor' });
  });

  it('guards plan routes through open folds', () => {
    const m = createMission(job);
    const [a, b] = m.b.anchors as [number, number];
    const mid = Math.floor((a + b) / 2);
    stand(m, m.b.path[mid]!.tx, m.b.path[mid]!.ty);
    m.guards = [];
    stepMission(m, { ...NO_INPUT, fold: true }, DT);
    run(m, 12);
    const from = m.b.path[a + 1]!;
    const to = m.b.path[b - 1]!;
    const withFold = findPath(m, from, to).length;
    release(m.folds);
    const without = findPath(m, from, to).length;
    expect(withFold).toBeLessThan(without / 3);
  });
});

describe('security and the job', () => {
  it('standing in front of the guard raises suspicion, and too much gets you caught', () => {
    const m = createMission(job);
    m.cameras = [];
    const g = m.guards[0]!;
    g.speed = 0;
    g.heading = 0;
    m.player.x = g.x + 3 * TILE;
    m.player.y = g.y;
    const ev = run(m, 3);
    expect(m.everSeen).toBe(true);
    expect(ev.some((e) => e.type === 'lost' && e.reason === 'caught')).toBe(true);
  });

  it('walls block a guard’s view', () => {
    const m = createMission(job);
    m.cameras = [];
    const g = m.guards[0]!;
    g.speed = 0;
    // put the player in the corridor right behind the shop wall
    stand(m, 2, 6);
    g.x = centre({ tx: 4, ty: 6 }).x + 40;
    g.y = centre({ tx: 4, ty: 6 }).y;
    g.heading = Math.PI;
    run(m, 2);
    expect(m.suspicion).toBe(0);
  });

  it('glass display cases block you, not a guard’s view', () => {
    const b = parseBuilding(job.map);
    expect(solid(tileAt(b, 8, 6))).toBe(true);
    const a = centre({ tx: 6, ty: 6 });
    const c = centre({ tx: 11, ty: 6 });
    expect(lineOfSight(b, a.x, a.y, c.x, c.y)).toBe(true);
  });

  it('grabbing the diamond starts the escape clock; reaching the van wins', () => {
    const m = quiet(createMission(job));
    stand(m, m.b.diamond.tx, m.b.diamond.ty);
    const ev = run(m, DT * 2);
    expect(ev).toContainEqual({ type: 'loot', primary: true });
    const left = m.escapeLeft;
    run(m, 1);
    expect(m.escapeLeft).toBeLessThan(left);
    stand(m, m.b.van.tx, m.b.van.ty);
    run(m, DT * 2);
    expect(m.status).toBe('won');
    const sc = score(m);
    expect(sc.total).toBeGreaterThan(1000);
    expect(sc.parts.unseen).toBeGreaterThan(0);
  });

  it('running out of escape time loses', () => {
    const m = quiet(createMission(job));
    stand(m, m.b.diamond.tx, m.b.diamond.ty);
    run(m, job.escapeSeconds + 2);
    expect(m.lostReason).toBe('time');
  });

  it('the corridor really is the long way round (the fold is worth it)', () => {
    const m = quiet(createMission({ ...job } as JobConfig));
    const walk = findPath(m, m.b.path[m.b.anchors[0]!]!, m.b.diamond).length;
    expect(walk).toBeGreaterThan(30);
  });
});

describe('every registered job', () => {
  for (const j of JOBS) {
    it(`${j.id} is structurally sound`, () => {
      const b = parseBuilding(j.map);
      expect(new Set(j.map.map((r) => r.length)).size).toBe(1);
      expect(b.path.length).toBeGreaterThan(0);
      for (const i of b.anchors) expect(i).toBeGreaterThanOrEqual(0);
      for (const a of b.oneWayAnchors) expect(a.bin).toBeGreaterThanOrEqual(0);
      // diamond and van must be reachable on foot alone, with no fold needed
      const m = quiet(createMission(j));
      expect(
        findPath(m, { tx: m.b.start.tx, ty: m.b.start.ty }, m.b.diamond).length,
      ).toBeGreaterThan(1);
      expect(findPath(m, m.b.diamond, { tx: m.b.van.tx, ty: m.b.van.ty }).length).toBeGreaterThan(
        1,
      );
    });
  }

  it('Job 2’s west anchor sits behind its one-way lock, the east one does not', () => {
    const j = JOBS.find((x) => x.id === 'job-2')!;
    const b = parseBuilding(j.map);
    expect(b.oneWayAnchors).toHaveLength(1);
    const [west, east] = b.anchors as [number, number];
    expect(west).toBeLessThan(east);
    expect(b.oneWayAnchors[0]!.bin).toBeGreaterThan(west);
    expect(b.oneWayAnchors[0]!.bin).toBeLessThan(east);
  });
});
