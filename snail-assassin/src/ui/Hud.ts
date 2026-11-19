import Phaser from 'phaser';
import type { CharacterConfig } from '../characters/types';
import { TUNING } from '../config/tuning';
import type { HuntState } from '../systems/hunt';
import type { AbilitySlot } from '../systems/venom';
import { TEXT_STYLES } from './text';

const SLOTS: { slot: AbilitySlot; key: string }[] = [
  { slot: 'primary', key: 'Q' },
  { slot: 'secondary', key: 'E' },
  { slot: 'capture', key: 'SPACE' },
];

type Tutorial = { primary: boolean; secondary: boolean; capture: boolean } | null;

// Hunt HUD: objective, timer, venom, ability status and the first-hunt checklist.
export class Hud {
  private readonly objective: Phaser.GameObjects.Text;
  private readonly timer: Phaser.GameObjects.Text;
  private readonly venomBar: Phaser.GameObjects.Rectangle;
  private readonly venomLabel: Phaser.GameObjects.Text;
  private readonly abilityTexts: Phaser.GameObjects.Text[] = [];
  private readonly checklist: Phaser.GameObjects.Text;
  private readonly toast: Phaser.GameObjects.Text;
  private toastUntil = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly character: CharacterConfig,
  ) {
    const { width, height } = scene.scale;
    const depth = 100;
    this.objective = scene.add.text(20, 16, '', TEXT_STYLES.hud).setDepth(depth);
    this.timer = scene.add
      .text(width - 20, 16, '', TEXT_STYLES.hud)
      .setOrigin(1, 0)
      .setDepth(depth);
    this.checklist = scene.add
      .text(20, 52, '', { ...TEXT_STYLES.small, lineSpacing: 4 })
      .setDepth(depth)
      .setBackgroundColor('#06192bcc')
      .setPadding(10, 6, 10, 6);

    const barY = height - 112;
    scene.add
      .rectangle(width / 2 - 200, barY, 400, 14, 0x000000, 0.45)
      .setOrigin(0, 0.5)
      .setDepth(depth);
    this.venomBar = scene.add
      .rectangle(width / 2 - 200, barY, 400, 14, character.palette.accent, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(depth);
    this.venomLabel = scene.add
      .text(width / 2 - 200, barY - 28, '', TEXT_STYLES.small)
      .setDepth(depth);

    SLOTS.forEach((_, i) => {
      this.abilityTexts.push(
        scene.add
          .text(width / 2 + (i - 1) * 230, height - 84, '', {
            ...TEXT_STYLES.small,
            align: 'center',
          })
          .setDepth(depth)
          .setBackgroundColor('#06192bcc')
          .setPadding(10, 6, 10, 6)
          .setOrigin(0.5, 0)
          .setFixedSize(220, 0),
      );
    });
    this.toast = scene.add
      .text(width / 2, height - 150, '', TEXT_STYLES.body)
      .setOrigin(0.5)
      .setDepth(depth);
  }

  update(state: HuntState, tutorial: Tutorial): void {
    const target = TUNING.hunt.objectiveCaptures;
    const pips =
      '●'.repeat(Math.min(state.captured, target)) +
      '○'.repeat(Math.max(0, target - state.captured));
    this.objective.setText(
      `${this.character.name}   OBJECTIVE  Capture ${target} fish   ${pips}  ${state.captured}/${target}`,
    );
    const left = Math.max(0, TUNING.hunt.timeLimitSeconds - state.time);
    this.timer.setText(
      `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`,
    );

    const v = state.venom;
    this.venomBar.width = 400 * (v.reserve / v.max);
    this.venomLabel.setText(`VENOM ${Math.floor(v.reserve)}/${v.max}`);

    SLOTS.forEach(({ slot, key }, i) => {
      const a = this.character.abilities[slot];
      const cd = v.cooldowns[slot];
      const needsTarget = (a.kind === 'lock' || a.kind === 'reel') && !state.tether;
      const reeling = a.kind === 'reel' && state.tether?.reeling;
      const status =
        cd > 0
          ? `${cd.toFixed(1)}s`
          : v.reserve < a.cost
            ? 'LOW VENOM'
            : needsTarget
              ? 'NEEDS A STRIKE'
              : reeling
                ? 'REELING…'
                : 'READY';
      const t = this.abilityTexts[i];
      t?.setText(`[${key}] ${a.label}\n${a.cost > 0 ? `${a.cost} venom` : 'free'}\n${status}`);
      t?.setAlpha(status === 'READY' ? 1 : 0.55);
    });

    if (tutorial) {
      const step = (done: boolean, s: AbilitySlot, verb: string) =>
        `${done ? '☑' : '☐'} ${verb} [${SLOTS.find((x) => x.slot === s)?.key}] ${this.character.abilities[s].label}`;
      this.checklist
        .setText(
          [
            'TUTORIAL',
            step(tutorial.primary, 'primary', 'Use'),
            step(tutorial.secondary, 'secondary', 'Follow with'),
            step(tutorial.capture, 'capture', 'Capture with'),
          ].join('\n'),
        )
        .setVisible(true);
    } else this.checklist.setVisible(false);

    if (this.scene.time.now > this.toastUntil) this.toast.setText('');
  }

  say(message: string, ms = 1800): void {
    this.toast.setText(message);
    this.toastUntil = this.scene.time.now + ms;
  }
}
