import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BootScene } from './scenes/BootScene';
import { DiveResultsScene } from './scenes/DiveResultsScene';
import { DiveScene } from './scenes/DiveScene';
import { JournalScene } from './scenes/JournalScene';
import { MysteryScene } from './scenes/MysteryScene';
import { OneDropResultsScene } from './scenes/OneDropResultsScene';
import { OneDropScene } from './scenes/OneDropScene';
import { PauseScene } from './scenes/PauseScene';
import { ReconstructRevealScene } from './scenes/ReconstructRevealScene';
import { ReconstructScene } from './scenes/ReconstructScene';
import { ScaleSelectScene } from './scenes/ScaleSelectScene';
import { TitleScene } from './scenes/TitleScene';
import { installTextScaling } from './ui/textScaling';

installTextScaling(textScale);

const game = new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    TitleScene,
    ScaleSelectScene,
    OneDropScene,
    OneDropResultsScene,
    DiveScene,
    DiveResultsScene,
    ReconstructScene,
    ReconstructRevealScene,
    JournalScene,
    MysteryScene,
    PauseScene,
  ]),
);

game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'Antarctic Expedition. Tap a particle to document the target, tap its question mark badge to document it as uncertain instead. Escape to pause. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
