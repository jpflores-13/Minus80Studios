// Player-facing text for the ending. Headings and fixed lines come from the game brief. The
// explanatory text is a placeholder on purpose: it will be written with the contributing scientist
// and checked by a reviewer, then pasted in here. No code changes are needed to fill it in.

export interface EndingPage {
  title: string;
  body: string[];
}

export const OPENING_LINES = [
  'Host detected.',
  'Defense system activated.',
  'They’re coming for your genome.',
  'Time to fight back.',
];

export const ENDING_LINE = 'This battle isn’t entirely fictional.';
export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

const PLACEHOLDER = '[To be written with the contributing scientist and reviewed before release.]';

export const ENDING_PAGES: EndingPage[] = [
  { title: 'The Science Behind the Game', body: [PLACEHOLDER] },
  {
    title: 'What We Simplified',
    body: [
      PLACEHOLDER,
      'Every damage value, timer, upgrade and inhibition time in this game is fictional.',
    ],
  },
  {
    title: 'Meet the Scientist',
    body: [
      'Original game concept contributed by a researcher at the Broad Institute.',
      '[Name, biography and interview pending approval.]',
    ],
  },
  {
    title: 'Explore the Research',
    body: [
      'Journal of the American Chemical Society (2026). doi:10.1021/jacs.5c19089',
      'Proceedings of the National Academy of Sciences (2025). doi:10.1073/pnas.2426960122',
      '[Further references and scientific reviewer: placeholders]',
    ],
  },
  {
    title: 'Credits',
    body: ['A Minus 80 Studios game.', '[Collaborator credits pending approval.]'],
  },
];
