import type Phaser from 'phaser';

// Full screen hides the browser bars on Android, tablets and desktops (iPhone Safari doesn't allow it).
// On phones it also tries to lock the screen sideways.
export function toggleFullscreen(scene: Phaser.Scene): void {
  if (scene.scale.isFullscreen) {
    scene.scale.stopFullscreen();
    return;
  }
  scene.scale.startFullscreen();
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (o: string) => Promise<void>;
  };
  orientation.lock?.('landscape').catch(() => undefined);
}
