// The single source of truth for every specific claim, number, or finding used anywhere in this
// game. Natural-history background not tied to a specific paper lives inline in organisms.ts /
// wildlife.ts as well-established statements. Everything here must trace to docs/SCIENCE.md.

export interface Citation {
  id: string;
  authors: string;
  year: number;
  title: string;
  venue: string;
  doi: string;
}

export const CITATIONS: Record<string, Citation> = {
  kienle2024: {
    id: 'kienle2024',
    authors: 'Kienle, Bonin, Gomez, Goebel, Donke, Sperou, Guerrero-Vega, Borras-Chavez',
    year: 2024,
    title: 'First paired observations of sexual behavior and calls in wild leopard seals',
    venue: 'Polar Biology 47, 1025-1037',
    doi: '10.1007/s00300-024-03275-4',
  },
  piedade2024: {
    id: 'piedade2024',
    authors:
      'Piedade, Schon, Lood, Fofanov, Wesdorp, Biggs, Wu, Bolhuis, Fischer, Yutin, Dutilh, Brussaard',
    year: 2024,
    title:
      'Seasonal dynamics and diversity of Antarctic marine viruses reveal a novel viral seascape',
    venue: 'Nature Communications 15, 9192',
    doi: '10.1038/s41467-024-53317-y',
  },
  patel2007: {
    id: 'patel2007',
    authors: 'Patel, Noble, Steele, Schwalbach, Hewson, Fuhrman',
    year: 2007,
    title:
      'Virus and prokaryote enumeration from planktonic aquatic environments by epifluorescence microscopy with SYBR Green I',
    venue: 'Nature Protocols 2, 269-276',
    doi: '10.1038/nprot.2007.6',
  },
};

/** Dr. Sarah Kienle's real, citable affiliation. No invented bio, quote, or interview answer. */
export const KIENLE_PROFILE = {
  name: 'Dr. Sarah S. Kienle',
  affiliation: 'Assistant Professor, Natural Resources Science, University of Rhode Island',
  lab: 'Comparative Ecophysiology of Animals Lab (CEAL Lab)',
  links: ['sarahskienle.com'],
  bio: '[Biography and interview pending written approval, per studio policy.]',
};

export const HEMOGLOBIN_NOTE =
  'Icefish (family Channichthyidae) lack hemoglobin entirely, the result of a large deletional ' +
  'event in their globin genes. They survive on dissolved oxygen alone, carried by blood plasma ' +
  'and supported by an oversized heart and vessels, in the cold, oxygen-rich Southern Ocean.';
