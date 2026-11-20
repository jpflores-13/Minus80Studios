import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { IntroScene } from './scenes/IntroScene';
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
    BattleScene,
    PauseScene,
    ResultsScene,
    EndingScene,
  ]),
);

game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'Dr. Anti-CRISPR game. Drag or use the arrow keys to move; you fire automatically. E uses the cloud, Space calls reinforcements, Escape pauses. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
