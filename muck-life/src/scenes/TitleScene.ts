import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { CAMPAIGN_LENGTH, CAMPAIGN_META } from '../levels/campaign';
import { rushConfig } from '../levels/rush';
import { Aboveground, drawSediment, Heatmap, RootRenderer } from '../render/marsh';
import { drawLogo } from '../render/logo';
import { Session } from '../systems/session';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** Title: a live, slowly growing root system behind the menu. */
export class TitleScene extends Phaser.Scene {
  private demo!: Session;
  private above!: Aboveground;
  private heat!: Heatmap;
  private roots!: RootRenderer;
  private renderTimer = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    const p = progress();
    if (!p.reducedMotion) this.cameras.main.fadeIn(300);
    this.demo = new Session({ ...rushConfig('zen', 77), warmupHours: 90 });
    this.above = new Aboveground(this, { flowerSpikes: true, reducedMotion: p.reducedMotion });
    drawSediment(this, 4);
    this.heat = new Heatmap(this, this.demo.field, 'heat-title');
    this.roots = new RootRenderer(this);
    const veil = this.add.graphics().setDepth(15);
    veil.fillStyle(PALETTE.ink, 0.55);
    veil.fillRoundedRect(width / 2 - 330, 228, 660, 452, 18);

    new Button(this, 92, 30, 150, 34, '-80 STUDIOS', () => (window.location.href = '../'));
    drawLogo(this, width / 2, 120, 0.9).setDepth(20);
    addCenteredText(this, 206, 'It’s a dirty job. Somebody’s gotta oxygenate it.', {
      ...TEXT_STYLES.body,
      fontStyle: 'italic',
      stroke: '#14110e',
      strokeThickness: 5,
    }).setDepth(20);

    const cleared = p.campaignCleared;
    const campaignLabel = () =>
      cleared === 0
        ? 'PLAY THE CAMPAIGN'
        : cleared >= CAMPAIGN_LENGTH
          ? 'REPLAY THE CAMPAIGN'
          : `CONTINUE · LEVEL ${cleared + 1}: ${CAMPAIGN_META[cleared]!.name.toUpperCase()}`;
    const menu = new Menu(
      this,
      [
        {
          label: campaignLabel,
          help: 'Seven short levels, about 9 minutes, ending in the real discovery.',
          action: () =>
            this.scene.start('LevelIntro', { index: cleared >= CAMPAIGN_LENGTH ? 0 : cleared }),
        },
        {
          label: () => 'LEVEL SELECT',
          help: 'Replay any level you have reached.',
          action: () => this.scene.start('LevelSelect'),
        },
        {
          label: () => 'O₂ RUSH',
          help: 'Endless arcade oxygen imaging. Four modes.',
          action: () => this.scene.start('RushSelect'),
        },
        {
          label: () => 'EXPLORE THE SCIENCE',
          help: 'Cattails, aerenchyma, optodes, and the discovery itself. Always free to read.',
          action: () => this.scene.start('Explore'),
        },
        {
          label: () => 'MEET THE SCIENTISTS',
          help: 'The people and experiments behind the game.',
          action: () => this.scene.start('Scientists'),
        },
        { label: () => 'SETTINGS & ACCESSIBILITY', action: () => this.scene.start('Settings') },
        {
          label: () => 'MORE',
          help: 'Records, credits, the opening, and the discovery ending.',
          action: () => this.scene.start('More'),
        },
      ],
      width / 2,
      262,
      600,
      54,
    );
    void menu;
    addCenteredText(
      this,
      height - 14,
      'A Minus 80 Studios game · Inspired by Stein & Cardon (2026), New Phytologist',
      {
        ...TEXT_STYLES.hint,
        fontSize: '13px',
      },
    ).setDepth(20);
    sound.playSong('title');
  }

  override update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.demo.update(dt * 0.6);
    this.above.draw(dt, this.demo.light, this.demo.plant.ramets, this.demo.simHour);
    this.renderTimer -= dt;
    if (this.renderTimer <= 0) {
      this.renderTimer = 0.1;
      this.heat.draw(progress().colormap, 'combined', this.demo.imaging);
      this.roots.draw(this.demo.plant, this.demo.simHour, 0.9);
    }
  }
}
