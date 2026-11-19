import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { LevelScene } from './scenes/LevelScene';
import { ResultsScene } from './scenes/ResultsScene';
import { TitleScene } from './scenes/TitleScene';

// Scenes run in list order; BootScene starts first and hands off to Title.
new Phaser.Game(
  createGameConfig('game-container', [BootScene, TitleScene, LevelScene, ResultsScene]),
);
