import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/settings';
import { BootScene } from './scenes/BootScene';
import { DiscoveryScene } from './scenes/DiscoveryScene';
import { HuntScene } from './scenes/HuntScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultsScene } from './scenes/ResultsScene';
import { SelectScene } from './scenes/SelectScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SplashScene } from './scenes/SplashScene';
import { TitleScene } from './scenes/TitleScene';
import { installTextScaling } from './ui/textScaling';

installTextScaling(textScale);

// Boot → Splash → Title (+Settings) → Select → Hunt (+Pause) → Results → Discovery.
const game = new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    SplashScene,
    TitleScene,
    SettingsScene,
    SelectScene,
    HuntScene,
    PauseScene,
    ResultsScene,
    DiscoveryScene,
  ]),
);

// Screen readers: describe the game canvas; announcements go to #sr-announcer in index.html.
game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'Snail Assassin game. Use the arrow keys and Enter in menus. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
