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
  /** Holds detailTitle + detail so the whole panel can be scaled down together — see
   * showEntry()'s comment for why. */
  private detailPanel?: Phaser.GameObjects.Container;
  /** Vertical room available to the detail panel before it would run into the "Esc to go back"
   * hint at the bottom of the screen — measured once, not guessed, since entries vary a lot in
   * length (a seal with a cited study and a researcher bio vs. a one-line natural-history note). */
  private detailAvailableHeight = 0;

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

    const panelTop = 150;
    this.detailAvailableHeight = height - 50 - panelTop;
    this.detailPanel = this.add.container(width / 2 + 60, panelTop);
    this.detailTitle = this.add.text(0, 0, 'Select an entry', {
      ...TEXT_STYLES.hud,
      color: PALETTE.textGold,
    });
    this.detail = this.add.text(0, 0, '', {
      ...TEXT_STYLES.body,
      wordWrap: { width: width / 2 - 120 },
    });
    this.detailPanel.add([this.detailTitle, this.detail]);

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
      this.fitDetailPanel();
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
    this.fitDetailPanel();
  }

  /** Entries vary wildly in length — leopardSeal's cited study and researcher credit is many
   * times longer than weddellSeal's two-sentence note. Stack the body under the measured title
   * height (not a guessed gap), then, as a last resort, scale the whole panel down uniformly if
   * it's still taller than the room available above the "Esc to go back" hint, rather than let
   * it run past the bottom of the screen. */
  private fitDetailPanel(): void {
    if (!this.detailTitle || !this.detail || !this.detailPanel) return;
    this.detailPanel.setScale(1);
    this.detail.setY(this.detailTitle.height + 16);
    const totalHeight = this.detailTitle.height + 16 + this.detail.height;
    if (totalHeight > this.detailAvailableHeight) {
      this.detailPanel.setScale(this.detailAvailableHeight / totalHeight);
    }
  }
}
