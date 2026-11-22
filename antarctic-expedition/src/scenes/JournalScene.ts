import Phaser from 'phaser';
import { PALETTE } from '../config/gameConfig';
import { progress } from '../config/progress';
import { CITATIONS } from '../content/science';
import { JOURNAL_ENTRIES, JOURNAL_ORDER } from '../content/journal';
import { Menu } from '../ui/Menu';
import { addCenteredText, TEXT_STYLES } from '../ui/text';

/** The Discovery Journal: every species and specimen documented so far, sorted by scale. */
export class JournalScene extends Phaser.Scene {
  private detail?: Phaser.GameObjects.Text;
  private detailTitle?: Phaser.GameObjects.Text;

  constructor() {
    super('Journal');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.midnight).fadeIn(200);
    const journal = progress().journal;
    const discoveredCount = JOURNAL_ORDER.filter((id) => journal[id]?.discovered).length;

    addCenteredText(this, 60, 'DISCOVERY JOURNAL', TEXT_STYLES.title);
    addCenteredText(
      this,
      96,
      `${discoveredCount} / ${JOURNAL_ORDER.length} documented`,
      TEXT_STYLES.hint,
    );

    this.detailTitle = this.add.text(width / 2 + 60, 150, 'Select an entry', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textGold,
    });
    this.detail = this.add.text(width / 2 + 60, 190, '', {
      ...TEXT_STYLES.body,
      wordWrap: { width: width / 2 - 120 },
    });

    new Menu(
      this,
      JOURNAL_ORDER.map((id) => {
        const entry = JOURNAL_ENTRIES[id]!;
        const discovered = journal[id]?.discovered === true;
        return {
          label: () => (discovered ? entry.name.toUpperCase() : '??? UNDOCUMENTED'),
          action: () => this.showEntry(id, discovered),
        };
      }),
      width / 2 - 260,
      150,
      420,
      46,
      () => this.scene.start('Title'),
    );
    addCenteredText(this, height - 34, 'Esc to go back', TEXT_STYLES.hint);
  }

  private showEntry(id: string, discovered: boolean): void {
    const entry = JOURNAL_ENTRIES[id]!;
    if (!discovered) {
      this.detailTitle?.setText('??? UNDOCUMENTED');
      this.detail?.setText('Document this in DIVE or ONE DROP to unlock its entry.');
      return;
    }
    const citations = entry.citationIds.map((cid) => {
      const c = CITATIONS[cid]!;
      return `${c.authors} (${c.year}). ${c.title}. ${c.venue}. doi:${c.doi}`;
    });
    const lines = [
      `Scale: ${entry.scale}`,
      `Habitat: ${entry.habitat}`,
      `Instrument: ${entry.instrument}`,
      '',
      ...entry.facts,
      '',
      ...(citations.length ? ['Sources:', ...citations, ''] : []),
      ...(entry.researcher
        ? [
            `Researcher: ${entry.researcher.name} — ${entry.researcher.affiliation}`,
            entry.researcher.bio,
            '',
          ]
        : []),
      `Limitations: ${entry.limitations}`,
      '',
      'Open questions:',
      ...entry.openQuestions.map((q) => `• ${q}`),
    ];
    this.detailTitle?.setText(entry.name.toUpperCase());
    this.detail?.setText(lines.join('\n'));
  }
}
