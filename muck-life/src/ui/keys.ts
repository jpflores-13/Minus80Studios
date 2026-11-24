import Phaser from 'phaser';

/**
 * Makes each scene's keyboard plugin emit any given key event at most once per event name.
 *
 * With Phaser 4.2.1, when several key events arrive in the same frame, a scene's keyboard plugin
 * re-delivered the same KeyboardEvent objects to 'keydown' listeners (found in testing: 3 events
 * arrived as 11 calls), so pressing keys quickly skipped ending panels and menu items. Every
 * listener still receives each event once.
 */
export function installKeyDedupe(): void {
  const proto = Phaser.Input.Keyboard.KeyboardPlugin.prototype as unknown as {
    emit: (name: string | symbol, ...args: unknown[]) => boolean;
    __seen?: Map<string, WeakSet<object>>;
  };
  const emit = proto.emit;
  proto.emit = function (this: typeof proto, name: string | symbol, ...args: unknown[]) {
    const e = args[0];
    if (typeof name === 'string' && name.startsWith('key') && typeof e === 'object' && e !== null) {
      this.__seen ??= new Map();
      let seen = this.__seen.get(name);
      if (!seen) {
        seen = new WeakSet();
        this.__seen.set(name, seen);
      }
      if (seen.has(e)) return false;
      seen.add(e);
    }
    return emit.call(this, name, ...args);
  };
}
