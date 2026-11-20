import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { JobScene } from './scenes/JobScene';
import { PauseScene } from './scenes/PauseScene';
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
    IntroScene,
    TitleScene,
    SettingsScene,
    JobScene,
    HudScene,
    PauseScene,
    ResultsScene,
    EndingScene,
  ]),
);

game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'Heist. WASD or arrows to move, Shift to run, Space to use the Folder, Escape to pause. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
