import Phaser from 'phaser';
import { BOSSES, HEROES, type HeroId } from '../content/characters';
import { PALETTE } from '../config/gameConfig';
import { progress, saveProgress } from '../config/progress';
import { getStage } from '../levels';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';
import { unlockedHeroes } from './StageScene';

// Pick a hero before stages that need one. Shows who can stop which machine.
export class HeroSelectScene extends Phaser.Scene {
  constructor() {
    super('HeroSelect');
  }

  create(data: { stageId: string; timeTrial?: boolean }): void {
    const stage = getStage(data.stageId);
    this.cameras.main.setBackgroundColor(PALETTE.night);
    const { width, height } = this.scale;
    addCenteredText(this, 44, `STAGE ${stage.number}: CHOOSE YOUR HERO`, TEXT_STYLES.title);
    const kinds = [...new Set(stage.bosses.map((b) => b.kind))]
      .map((k) => BOSSES[k].name)
      .join(' and ');
    addCenteredText(this, 92, `Coming up: ${kinds}`, {
      ...TEXT_STYLES.hud,
      color: PALETTE.textRed,
    });
    const heroes = unlockedHeroes();
    const pick = (id: HeroId) => {
      saveProgress({ lastHero: id });
      this.scene.start('Stage', { stageId: stage.id, hero: id, timeTrial: !!data.timeTrial });
    };
    heroes.forEach((id, i) => {
      const h = HEROES[id];
      const x = width / 2 + (i - (heroes.length - 1) / 2) * 290;
      this.add.image(x, 200, `${id}-idle`).setScale(7);
      const works = h.works
        .map((w) => `${w.effect === 'freeze' ? 'freezes' : 'stops'} ${BOSSES[w.boss].name}`)
        .join(', ');
      this.add
        .text(x, 300, `${h.title}\n\n${h.ability}\n\n${h.limitation}\n\n${works}`, {
          ...TEXT_STYLES.small,
          align: 'center',
          wordWrap: { width: 260 },
        })
        .setOrigin(0.5, 0);
    });
    new Menu(
      this,
      heroes.map((id) => ({ label: () => `PLAY AS ${HEROES[id].name}`, action: () => pick(id) })),
      width / 2,
      height - 60 - (heroes.length - 1) * 54,
      400,
      54,
      () => this.scene.start('StageSelect'),
    ).focus(Math.max(0, heroes.indexOf(progress().lastHero)), false);
  }
}
