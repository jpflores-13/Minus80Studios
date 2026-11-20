import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { LevelScene } from './scenes/LevelScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ResultsScene } from './scenes/ResultsScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SplashScene } from './scenes/SplashScene';
import { TitleScene } from './scenes/TitleScene';
import { installTextScaling } from './ui/textScaling';

installTextScaling(textScale);

const game = new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    SplashScene,
    TitleScene,
    SettingsScene,
    LevelSelectScene,
    LevelScene,
    ResultsScene,
    EndingScene,
  ]),
);

// Screen readers: describe the game canvas; announcements go to #sr-announcer in index.html.
game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'Downstream game. Use Tab or the arrow keys to move between places and equipment spots, and Enter to use them. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
