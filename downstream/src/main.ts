import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PlayScene } from './scenes/PlayScene';
import { TitleScene } from './scenes/TitleScene';

// Scenes run in list order; BootScene starts first and hands off to Title.
new Phaser.Game(createGameConfig('game-container', [BootScene, TitleScene, PlayScene]));
