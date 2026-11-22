import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { LevelScene } from './scenes/LevelScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
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
    LevelSelectScene,
    LevelScene,
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
    'Ridgerunner. Move with the arrow keys, WASD, or drag. Follow the water, or cross overland to reach a new watershed. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
