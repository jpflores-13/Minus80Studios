import { TILE, tileAt, type Tile, type TileMap } from './tilemap';

// Platforming physics: a box that runs, jumps, climbs ladders and stands on things.
// Pure functions on plain data, so they can be tested without a game running.

export interface Body {
  x: number; // left edge, px
  y: number; // top edge, px
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  onLadder: boolean;
  /** Seconds since last on the ground (for "coyote time": a jump just after running off a ledge). */
  sinceGround: number;
  /** Seconds since jump was pressed (for "jump buffering": a jump pressed just before landing). */
  sinceJumpPress: number;
  airJumpsLeft: number;
  facing: 1 | -1;
  /** Index of the moving platform being stood on, if any. */
  riding: number | null;
}

export interface MoveInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  /** Jump held this frame. */
  jump: boolean;
  /** Jump went down this frame. */
  jumpPressed: boolean;
}

export interface Physics {
  gravity: number;
  maxFall: number;
  runSpeed: number;
  groundAccel: number;
  airAccel: number;
  groundFriction: number;
  jumpSpeed: number;
  /** Releasing jump early multiplies upward speed by this, for short hops. */
  jumpCut: number;
  coyoteTime: number;
  jumpBuffer: number;
  climbSpeed: number;
  bounceSpeed: number;
}

/** A platform that moves; you can stand on its top and it carries you. */
export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
}

export interface StepOptions {
  /** Multiplies run speed (sprint, crowded goo). */
  speedFactor: number;
  /** Extra jumps allowed in the air (double jump). */
  airJumps: number;
  /** Tiles that are solid right now (gates open and close, doors unlock). */
  isSolid: (tile: Tile) => boolean;
  platforms: Platform[];
}

export type PhysicsEvent = 'jumped' | 'airJumped' | 'landed' | 'bounced';

export function createBody(x: number, y: number): Body {
  return {
    x,
    y,
    w: 10,
    h: 14,
    vx: 0,
    vy: 0,
    onGround: false,
    onLadder: false,
    sinceGround: 0,
    sinceJumpPress: 99,
    airJumpsLeft: 0,
    facing: 1,
    riding: null,
  };
}

function overlapsTile(b: Body, map: TileMap, kind: Tile): boolean {
  const x0 = Math.floor(b.x / TILE);
  const x1 = Math.floor((b.x + b.w - 0.01) / TILE);
  const y0 = Math.floor(b.y / TILE);
  const y1 = Math.floor((b.y + b.h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) if (tileAt(map, tx, ty) === kind) return true;
  return false;
}

export function touches(b: Body, map: TileMap, kind: Tile): boolean {
  return overlapsTile(b, map, kind);
}

/** True when the box stands on top of a tile of this kind. */
export function standingOn(b: Body, map: TileMap, kind: Tile): boolean {
  if (!b.onGround) return false;
  const ty = Math.floor((b.y + b.h + 1) / TILE);
  const x0 = Math.floor(b.x / TILE);
  const x1 = Math.floor((b.x + b.w - 0.01) / TILE);
  for (let tx = x0; tx <= x1; tx++) if (tileAt(map, tx, ty) === kind) return true;
  return false;
}

export function stepBody(
  b: Body,
  input: MoveInput,
  map: TileMap,
  p: Physics,
  dt: number,
  o: StepOptions,
): PhysicsEvent[] {
  const events: PhysicsEvent[] = [];
  const wasOnGround = b.onGround;

  // ride a moving platform
  if (b.riding !== null) {
    const pl = o.platforms[b.riding];
    if (pl) {
      b.x += pl.dx;
      b.y += pl.dy;
    }
  }

  b.sinceJumpPress = input.jumpPressed ? 0 : b.sinceJumpPress + dt;
  b.sinceGround = b.onGround ? 0 : b.sinceGround + dt;
  if (b.onGround) b.airJumpsLeft = o.airJumps;

  // ladders: up or down while touching one grabs it
  const onLadderTile = overlapsTile(b, map, 'ladder');
  if (!onLadderTile) b.onLadder = false;
  else if ((input.up || (input.down && !b.onGround)) && !b.onLadder) b.onLadder = true;
  else if (input.down && b.onGround && ladderBelow(b, map)) b.onLadder = true;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) b.facing = dir as 1 | -1;
  const top = p.runSpeed * o.speedFactor;

  if (b.onLadder) {
    b.vx = dir * p.climbSpeed * 0.8;
    b.vy = ((input.down ? 1 : 0) - (input.up ? 1 : 0)) * p.climbSpeed;
    // centre gently on the ladder so climbing feels sticky
    const centre = Math.floor((b.x + b.w / 2) / TILE) * TILE + TILE / 2;
    if (dir === 0) b.x += (centre - (b.x + b.w / 2)) * Math.min(1, dt * 12);
    if (input.jumpPressed) {
      b.onLadder = false;
      b.vy = -p.jumpSpeed * 0.85;
      events.push('jumped');
    }
  } else {
    const accel = b.onGround ? p.groundAccel : p.airAccel;
    if (dir !== 0) b.vx = approach(b.vx, dir * top, accel * dt);
    else if (b.onGround) b.vx = approach(b.vx, 0, p.groundFriction * dt);
    else b.vx = approach(b.vx, 0, p.airAccel * 0.3 * dt);
    if (Math.abs(b.vx) > top) b.vx = approach(b.vx, Math.sign(b.vx) * top, p.groundAccel * dt);

    // jumping, with coyote time and a jump buffer
    const canGroundJump = b.onGround || b.sinceGround < p.coyoteTime;
    if (b.sinceJumpPress < p.jumpBuffer && canGroundJump && !(input.down && dropThrough(b, map))) {
      b.vy = -p.jumpSpeed;
      b.onGround = false;
      b.sinceGround = p.coyoteTime;
      b.sinceJumpPress = 99;
      b.riding = null;
      events.push('jumped');
    } else if (input.jumpPressed && !canGroundJump && b.airJumpsLeft > 0) {
      b.vy = -p.jumpSpeed * 0.9;
      b.airJumpsLeft--;
      b.sinceJumpPress = 99;
      events.push('airJumped');
    }
    if (!input.jump && b.vy < 0) b.vy *= p.jumpCut ** (dt * 60);
    b.vy = Math.min(p.maxFall, b.vy + p.gravity * dt);
  }

  // move and collide, one axis at a time
  const dropping = input.down && input.jumpPressed;
  b.x += b.vx * dt;
  resolveX(b, map, o);
  const prevBottom = b.y + b.h;
  b.y += b.vy * dt;
  b.onGround = false;
  b.riding = null;
  resolveY(b, map, o, prevBottom, dropping || (b.onLadder && input.down));

  if (b.onGround && !wasOnGround && b.vy >= 0) events.push('landed');
  if (b.onGround && standingOn(b, map, 'bouncer')) {
    b.vy = -p.bounceSpeed;
    b.onGround = false;
    events.push('bounced');
  }
  return events;
}

function ladderBelow(b: Body, map: TileMap): boolean {
  const tx = Math.floor((b.x + b.w / 2) / TILE);
  const ty = Math.floor((b.y + b.h + 1) / TILE);
  return tileAt(map, tx, ty) === 'ladder';
}

function dropThrough(b: Body, map: TileMap): boolean {
  const ty = Math.floor((b.y + b.h + 1) / TILE);
  const tx = Math.floor((b.x + b.w / 2) / TILE);
  return tileAt(map, tx, ty) === 'ledge';
}

function resolveX(b: Body, map: TileMap, o: StepOptions): void {
  const y0 = Math.floor(b.y / TILE);
  const y1 = Math.floor((b.y + b.h - 0.01) / TILE);
  if (b.vx > 0) {
    const tx = Math.floor((b.x + b.w) / TILE);
    for (let ty = y0; ty <= y1; ty++)
      if (o.isSolid(tileAt(map, tx, ty))) {
        b.x = tx * TILE - b.w;
        b.vx = 0;
        return;
      }
  } else if (b.vx < 0) {
    const tx = Math.floor(b.x / TILE);
    for (let ty = y0; ty <= y1; ty++)
      if (o.isSolid(tileAt(map, tx, ty))) {
        b.x = (tx + 1) * TILE;
        b.vx = 0;
        return;
      }
  }
}

function resolveY(
  b: Body,
  map: TileMap,
  o: StepOptions,
  prevBottom: number,
  dropping: boolean,
): void {
  const x0 = Math.floor(b.x / TILE);
  const x1 = Math.floor((b.x + b.w - 0.01) / TILE);
  if (b.vy >= 0) {
    const ty = Math.floor((b.y + b.h) / TILE);
    const surface = ty * TILE;
    for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(map, tx, ty);
      // ledges, and the top of a ladder, only hold you from above
      const oneWay =
        (t === 'ledge' || (t === 'ladder' && tileAt(map, tx, ty - 1) !== 'ladder')) &&
        prevBottom <= surface + 0.01 &&
        !dropping &&
        !b.onLadder;
      if (o.isSolid(t) || oneWay) {
        b.y = surface - b.h;
        b.vy = 0;
        b.onGround = true;
        if (t === 'ladder') b.onLadder = false;
        break;
      }
    }
    // moving platforms are one-way from above too
    o.platforms.forEach((pl, i) => {
      if (dropping) return;
      const within = b.x + b.w > pl.x && b.x < pl.x + pl.w;
      const crossing = prevBottom <= pl.y + Math.max(0, pl.dy) + 0.5 && b.y + b.h >= pl.y;
      if (within && crossing && b.vy >= 0) {
        b.y = pl.y - b.h;
        b.vy = 0;
        b.onGround = true;
        b.onLadder = false;
        b.riding = i;
      }
    });
  } else {
    const ty = Math.floor(b.y / TILE);
    for (let tx = x0; tx <= x1; tx++)
      if (o.isSolid(tileAt(map, tx, ty))) {
        b.y = (ty + 1) * TILE;
        b.vy = 0;
        break;
      }
  }
}

function approach(v: number, target: number, step: number): number {
  return v < target ? Math.min(target, v + step) : Math.max(target, v - step);
}

export function overlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
