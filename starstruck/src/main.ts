import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { AchievementsScene } from './scenes/AchievementsScene';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { LevelScene } from './scenes/LevelScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { MoreScene } from './scenes/MoreScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultsScene } from './scenes/ResultsScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SplashScene } from './scenes/SplashScene';
import { TitleScene } from './scenes/TitleScene';
import { WormageddonResultsScene } from './scenes/WormageddonResultsScene';
import { installTextScaling } from './ui/textScaling';

installTextScaling(textScale);

const game = new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    SplashScene,
    IntroScene,
    TitleScene,
    SettingsScene,
    MoreScene,
    LevelSelectScene,
    AchievementsScene,
    LevelScene,
    HudScene,
    PauseScene,
    ResultsScene,
    WormageddonResultsScene,
    EndingScene,
  ]),
);

game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'Starstruck. Move with the arrow keys, hold Shift to focus your touch, press Space to bite. What you touch is described aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
