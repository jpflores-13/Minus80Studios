import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BootScene } from './scenes/BootScene';
import { LevelScene } from './scenes/LevelScene';
import { BlueprintScene } from './scenes/BlueprintScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ModesScene } from './scenes/ModesScene';
import { PlannerScene } from './scenes/PlannerScene';
import { ResultsScene } from './scenes/ResultsScene';
import { RevealScene } from './scenes/RevealScene';
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
    RevealScene,
    ModesScene,
    PlannerScene,
    BlueprintScene,
  ]),
);

// Screen readers: describe the game canvas; announcements go to #sr-announcer in index.html.
game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'Shortcut game. Use the left and right arrow keys to move along the road and Enter to place things. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
