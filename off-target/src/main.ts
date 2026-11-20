import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { HeroSelectScene } from './scenes/HeroSelectScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { MachinesScene } from './scenes/MachinesScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultsScene } from './scenes/ResultsScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SplashScene } from './scenes/SplashScene';
import { StageScene } from './scenes/StageScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { TitleScene } from './scenes/TitleScene';
import { installTextScaling } from './ui/textScaling';

installTextScaling(textScale);

const game = new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    SplashScene,
    TitleScene,
    SettingsScene,
    IntroScene,
    MachinesScene,
    StageSelectScene,
    HeroSelectScene,
    StageScene,
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
    'Off Target game. Arrow keys move, Space jumps, E uses your power, Escape pauses. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
