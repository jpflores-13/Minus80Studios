import Phaser from 'phaser';
import { sound } from '../audio/Sound';
import { PALETTE } from '../config/gameConfig';
import { saveProgress } from '../config/progress';
import { SCALE_ORDER, SCALES } from '../content/organisms';
import { KIENLE_PROFILE } from '../content/science';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/**
 * The campaign's closing beat: a zoom from the visible world down through every scale the
 * expedition visited, then a researcher credit and an invitation to keep exploring.
 */
export class CampaignEndingScene extends Phaser.Scene {
  constructor() {
    super('CampaignEnding');
  }

  create(): void {
    saveProgress({ seenEnding: true });
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.ink).fadeIn(400);

    addCenteredText(this, 70, 'SEVEN EXPEDITIONS COMPLETE', {
      ...TEXT_STYLES.title,
      color: PALETTE.textGold,
    });
    addCenteredText(
      this,
      110,
      'From a leopard seal’s call to a single frozen molecule — one connected ocean, at every scale.',
      { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: width - 200 } },
    );

    const g = this.add.graphics();
    const stepW = (width - 160) / SCALE_ORDER.length;
    SCALE_ORDER.forEach((id, i) => {
      const x = 80 + stepW * i + stepW / 2;
      const r = 50 - i * 6;
      g.fillStyle(PALETTE.marine, 0.5);
      g.fillCircle(x, 220, Math.max(10, r));
      g.lineStyle(2, PALETTE.glacier, 0.7);
      g.strokeCircle(x, 220, Math.max(10, r));
      this.add
        .text(x, 220 + Math.max(10, r) + 18, SCALES[id].name, {
          ...TEXT_STYLES.small,
          color: PALETTE.textDim,
          align: 'center',
          wordWrap: { width: stepW - 10 },
        })
        .setOrigin(0.5, 0);
    });

    addCenteredText(this, 340, 'RESEARCHER CREDIT', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textAmber,
    });
    addCenteredText(
      this,
      374,
      `${KIENLE_PROFILE.name} — ${KIENLE_PROFILE.affiliation}\n${KIENLE_PROFILE.lab} · ${KIENLE_PROFILE.links.join(', ')}\n${KIENLE_PROFILE.bio}`,
      { ...TEXT_STYLES.body, align: 'center', wordWrap: { width: width - 240 } },
    );

    addCenteredText(
      this,
      470,
      'This game simplifies real research into playable mechanics. Open the Discovery Journal ' +
        'and Scientific Mysteries to see the sources behind what you found, and what real ' +
        'scientists still do not know.',
      { ...TEXT_STYLES.hint, align: 'center', wordWrap: { width: width - 260 } },
    );

    new Menu(
      this,
      [
        { label: () => 'DISCOVERY JOURNAL', action: () => this.scene.start('Journal') },
        { label: () => 'SCIENTIFIC MYSTERIES', action: () => this.scene.start('Mystery') },
        { label: () => 'TITLE', action: () => this.scene.start('Title') },
      ],
      width / 2,
      height - 90,
      460,
      54,
      () => this.scene.start('Title'),
    );
    sound.playSong('title');
  }
}
