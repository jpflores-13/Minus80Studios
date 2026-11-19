import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { LevelScene } from './scenes/LevelScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ResultsScene } from './scenes/ResultsScene';
import { SplashScene } from './scenes/SplashScene';
import { TitleScene } from './scenes/TitleScene';

new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    SplashScene,
    TitleScene,
    LevelSelectScene,
    LevelScene,
    ResultsScene,
    EndingScene,
  ]),
);
