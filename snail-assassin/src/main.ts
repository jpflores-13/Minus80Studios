import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { DiscoveryScene } from './scenes/DiscoveryScene';
import { HuntScene } from './scenes/HuntScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultsScene } from './scenes/ResultsScene';
import { SelectScene } from './scenes/SelectScene';
import { SplashScene } from './scenes/SplashScene';
import { TitleScene } from './scenes/TitleScene';

// Boot → Splash → Title → Select → Hunt (+Pause) → Results → Discovery.
new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    SplashScene,
    TitleScene,
    SelectScene,
    HuntScene,
    PauseScene,
    ResultsScene,
    DiscoveryScene,
  ]),
);
