import type { PollutionSource, Slot } from './types';

/** Shorthand builders so level files stay readable. Trap/boom `pos` is derived from the network. */
export const bin = (src: PollutionSource, dx = 0, dy = 70): Slot => ({
  id: `bin-${src.id}`,
  kind: 'bin',
  pos: { x: src.pos.x + dx, y: src.pos.y + dy },
  sourceId: src.id,
});

export const filter = (src: PollutionSource, dx = 60, dy = 40): Slot => ({
  id: `filter-${src.id}`,
  kind: 'filter',
  pos: { x: src.pos.x + dx, y: src.pos.y + dy },
  sourceId: src.id,
});

export const trap = (
  id: string,
  segmentId: string,
  s: number,
  coverage = 0.8,
  offset = 0,
): Slot => ({
  id: `trap-${id}`,
  kind: 'trap',
  pos: { x: 0, y: 0 },
  segmentId,
  s,
  coverage,
  offset,
});

export const boom = (id: string, segmentId: string, s: number): Slot => ({
  id: `boom-${id}`,
  kind: 'boom',
  pos: { x: 0, y: 0 },
  segmentId,
  s,
});
