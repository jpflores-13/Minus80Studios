// Object pooling: objects are made once and reused, so a busy wave doesn't make the garbage
// collector stutter on phones. spawn() hands out a dead object (or makes one, up to a limit),
// free() returns it. live() is safe to loop over while freeing.

export class Pool<T extends { alive: boolean }> {
  private readonly items: T[] = [];
  private active: T[] = [];
  private dirty = false;

  constructor(
    private readonly make: () => T,
    private readonly limit: number,
  ) {}

  spawn(): T | null {
    let item = this.items.find((i) => !i.alive);
    if (!item) {
      if (this.items.length >= this.limit) return null;
      item = this.make();
      this.items.push(item);
    }
    item.alive = true;
    this.active.push(item);
    return item;
  }

  free(item: T): void {
    if (!item.alive) return;
    item.alive = false;
    this.dirty = true;
  }

  live(): readonly T[] {
    if (this.dirty) {
      this.active = this.active.filter((i) => i.alive);
      this.dirty = false;
    }
    return this.active;
  }

  /** Total objects ever made (for tests: reuse means this stays small). */
  get size(): number {
    return this.items.length;
  }

  clear(): void {
    for (const i of this.items) i.alive = false;
    this.active = [];
  }
}
