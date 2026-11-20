// Player-facing text for the ending. The section headings and closing lines come from the game
// brief. The explanatory text is left as placeholders on purpose: it is to be written with the
// contributing scientist and checked by a reviewer, then pasted in here. The game shows whatever
// is in this file, so no code changes are needed to fill it in.

export interface EndingPage {
  title: string;
  body: string[];
}

export const ENDING_LINES = ['You saved the strand.', 'But this battle isn’t entirely fictional.'];

export const CLOSING_LINE = 'The game ends here. The discovery doesn’t.';

const PLACEHOLDER = '[To be written with the contributing scientist and reviewed before release.]';

export const ENDING_PAGES: EndingPage[] = [
  { title: 'The Science Behind the Game', body: [PLACEHOLDER] },
  {
    title: 'Meet the Scientist',
    body: [
      'Original game concept contributed by a researcher at the Broad Institute.',
      '[Name, biography and interview pending approval.]',
    ],
  },
  { title: 'What We Simplified', body: [PLACEHOLDER] },
  {
    title: 'Explore the Research',
    body: [
      'Journal of the American Chemical Society (2026). doi:10.1021/jacs.5c19089',
      'Proceedings of the National Academy of Sciences (2025). doi:10.1073/pnas.2426960122',
      '[Scientific reviewer placeholder]',
    ],
  },
];
