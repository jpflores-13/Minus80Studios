import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './config/gameConfig';
import { textScale } from './config/progress';
import { BootScene, SplashScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import {
  LevelIntroScene,
  LevelSelectScene,
  MoreScene,
  PauseScene,
  RecordsScene,
  RushSelectScene,
  SettingsScene,
} from './scenes/MenuScenes';
import { OpeningScene } from './scenes/OpeningScene';
import { PlayScene } from './scenes/PlayScene';
import { ResultsScene } from './scenes/ResultsScene';
import {
  CreditsScene,
  ExploreScene,
  LabScene,
  ReferencesScene,
  ScientistsScene,
  SimplifiedScene,
  TopicScene,
} from './scenes/ScienceScenes';
import { TitleScene } from './scenes/TitleScene';
import { installKeyDedupe } from './ui/keys';
import { installTextScaling } from './ui/textScaling';

installTextScaling(textScale);
installKeyDedupe();

const game = new Phaser.Game(
  createGameConfig('game-container', [
    BootScene,
    SplashScene,
    OpeningScene,
    TitleScene,
    LevelSelectScene,
    LevelIntroScene,
    PlayScene,
    ResultsScene,
    RushSelectScene,
    PauseScene,
    SettingsScene,
    MoreScene,
    RecordsScene,
    EndingScene,
    ScientistsScene,
    ExploreScene,
    TopicScene,
    SimplifiedScene,
    ReferencesScene,
    LabScene,
    CreditsScene,
  ]),
);

if (import.meta.env.DEV) (window as unknown as { __game?: Phaser.Game }).__game = game;

game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.setAttribute('role', 'application');
  game.canvas.setAttribute(
    'aria-label',
    'MUCK LIFE. Document oxygen pools around growing cattail roots. Tap a pool, or move the reticle with the arrow keys and press Space; Tab jumps between signals. Escape pauses. Game messages are read aloud.',
  );
  game.canvas.setAttribute('tabindex', '0');
});
