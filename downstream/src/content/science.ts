// Text and links for the "Did You Know?" ending.
// Everything here must match docs/SCIENCE.md (a test checks the links).
// No researcher names until they've given permission.

export interface Link {
  label: string;
  url: string;
  note?: string;
}

export const REVEAL = {
  title: 'DID YOU KNOW?',
  lead: 'The GPS bottles you used in Downstream! were inspired by a real research project.',
  text:
    'Researchers at NC State University and North Carolina Sea Grant released GPS-tracked plastic bottles into creeks ' +
    'in Raleigh, North Carolina, to learn where litter travels and where it piles up. Some bottles travelled almost ' +
    '25 miles in a few weeks, and the team found that rainfall makes a big difference to how much litter reaches the ' +
    'water and how far it goes.',
  illustrationNote:
    'Original illustration. Research photos will be added with the team’s permission.',
};

export const TEAM = {
  title: 'MEET THE RESEARCH',
  text:
    'The project is led by NC State University and North Carolina Sea Grant, working with local partners including ' +
    'the City of Raleigh and Wake County. Alongside the bottle tracking, the team installed trash traps in Marsh Creek, ' +
    'samples the water for microplastics, and maps litter hot spots street by street, with the goal of a community ' +
    'toolkit for keeping watersheds clean.',
  note: 'Researcher profiles will appear here with their permission.',
};

export const LINKS: { explore: Link; story: Link; tracker: Link; help: Link } = {
  explore: {
    label: 'EXPLORE THE REAL RESEARCH',
    url: 'https://ncseagrant.ncsu.edu/reducing-litter-in-urban-waterways/',
  },
  story: {
    label: 'READ THE PBS STORY',
    url: 'https://www.pbsnc.org/blogs/science/tracking-trash-to-discover-the-path-of-plastic/',
  },
  tracker: {
    label: 'FOLLOW THE REAL BOTTLES',
    url: 'https://experience.arcgis.com/experience/278d52348842440ea00805a4cb0d470d',
    note: 'Map shared by NC Sea Grant. It may show live or past positions; check the map for dates.',
  },
  help: { label: 'JOIN A LOCAL CLEANUP', url: 'https://raleighcleanup.org/' },
};

export const RESPONSIBLE =
  'Found one of the real bottles? Scan its QR code, report where it is, and leave it where you found it. ' +
  'Please never put bottles or other litter into a waterway yourself.';

export const DID_YOU_KNOW = REVEAL.title;

// Short one-liners for the results screen, each a condensed restatement of a fact already
// checked and cited in full in REVEAL/TEAM above, not a new claim.
export const QUICK_FACTS = [
  'The real GPS-tracked bottles this game is inspired by travelled almost 25 miles down Raleigh creeks in just a few weeks.',
  'Researchers found that rainfall makes a big difference to how much real litter reaches the water, and how far it travels once it does.',
  'The real research team installs trash traps, samples the water for microplastics, and maps litter hot spots street by street.',
];

export function randomQuickFact(seed: number): string {
  return QUICK_FACTS[Math.abs(seed) % QUICK_FACTS.length] ?? QUICK_FACTS[0]!;
}

export const DISCLAIMER =
  'Inspired by real environmental research. Water flow, transport rates, equipment capacities, and intervention ' +
  'effectiveness have been simplified for gameplay.';
