import { makeGenericWorker, genericWorkerName } from '../content/characters';
import type { ColonyConfig, Site } from '../systems/colony';
import { createRng } from '../utils/rng';
import type { Vec2 } from '../utils/math';

let nextSiteId = 0;

export function site(kind: Site['kind'], pos: Vec2): Omit<Site, 'level'> {
  return { id: `site-${nextSiteId++}`, kind, pos };
}

/** Fill out a roster with generic workers in addition to any named ones already listed. */
export function withGenericWorkers(
  named: ColonyConfig['workers'],
  count: number,
  seed: number,
  center: Vec2,
): ColonyConfig['workers'] {
  const rng = createRng(seed);
  const generic = Array.from({ length: count }, (_, i) => ({
    name: genericWorkerName(i),
    traits: makeGenericWorker(i, rng, center),
  }));
  return [...named, ...generic];
}
