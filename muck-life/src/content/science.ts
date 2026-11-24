// The single source of truth for every scientific claim shown in MUCK LIFE. Each item traces to
// docs/SCIENCE.md and docs/SCIENTIFIC_REVIEW.md. `basis` says what kind of claim it is:
//   'measured'   — a result reported in Stein & Cardon (2026)
//   'paper'      — background or interpretation stated in that paper (incl. its citations)
//   'speculation'— explicitly framed as speculation/hypothesis by the authors
//   'background' — well-established general science, not specific to the study
//   'game'       — a fictional game mechanic or simplification

export type Basis = 'measured' | 'paper' | 'speculation' | 'background' | 'game';

export const BASIS_LABEL: Record<Basis, string> = {
  measured: 'MEASURED IN THE STUDY',
  paper: 'FROM THE PAPER',
  speculation: 'AUTHORS’ HYPOTHESIS',
  background: 'GENERAL BACKGROUND',
  game: 'GAME SIMPLIFICATION',
};

export interface Citation {
  id: string;
  text: string;
  url: string;
  note?: string;
}

export const PRIMARY: Citation = {
  id: 'stein2026',
  text:
    'Stein, I. R., & Cardon, Z. G. (2026). Belowground growth is the primary driver of radial ' +
    'oxygen loss from Typha angustifolia to sediment. New Phytologist, 252(5), 1832–1842.',
  url: 'https://doi.org/10.1111/nph.71593',
  note: 'Open access under CC BY 4.0. Published online 3 October 2026.',
};

export const MBL_ARTICLE: Citation = {
  id: 'mbl2026',
  text:
    'Ledoux, C. (2026, November 19). Stayin’ Alive in Marsh Muck: The Tiny “Snorkels” ' +
    'Cattails Grow Manipulate Soil Chemistry. Marine Biological Laboratory News.',
  url: 'https://www.mbl.edu/news/stayin-alive-marsh-muck-tiny-snorkels-cattails-grow-manipulate-soil-chemistry',
};

export const SECONDARY: Citation[] = [
  {
    id: 'larsen2011',
    text:
      'Larsen, M., Borisov, S. M., Grunwald, B., Klimant, I., & Glud, R. N. (2011). A simple and ' +
      'inexpensive high resolution color ratiometric planar optode imaging approach: application ' +
      'to oxygen and pH sensing. Limnology and Oceanography: Methods, 9, 348–360.',
    url: 'https://doi.org/10.4319/lom.2011.9.348',
    note: 'The optode method the study followed (cited in Stein & Cardon 2026).',
  },
  {
    id: 'armstrong1980',
    text: 'Armstrong, W. (1980). Aeration in higher plants. Advances in Botanical Research, 7, 225–332.',
    url: 'https://doi.org/10.1016/S0065-2296(08)60089-0',
    note: 'Origin of the term radial oxygen loss (cited in Stein & Cardon 2026).',
  },
  {
    id: 'seago1999',
    text:
      'Seago, J. L., Jr., Peterson, C. A., Enstone, D. E., & Scholey, C. A. (1999). Development ' +
      'of the endodermis and hypodermis of Typha glauca Godr. and Typha angustifolia L. roots. ' +
      'Canadian Journal of Botany, 77, 122–134.',
    url: 'https://doi.org/10.1139/b98-173',
    note: 'Casparian strip in adventitious vs lateral roots (cited in Stein & Cardon 2026).',
  },
];

export const ALL_CITATIONS: Citation[] = [PRIMARY, MBL_ARTICLE, ...SECONDARY];

// ---------------------------------------------------------------------------------------------
// The scientific discovery ending
// ---------------------------------------------------------------------------------------------

export interface Discovery {
  title: string;
  body: string;
  basis: Basis;
  art: 'aerenchyma' | 'rol' | 'growth' | 'roots' | 'night' | 'chemistry' | 'questions';
}

export const ENDING_OPENER =
  'You thought you were chasing oxygen. But the whole time, you were following growth.';

export const DISCOVERIES: Discovery[] = [
  {
    title: 'Plants can breathe beneath the mud',
    body:
      'Waterlogged marsh mud holds almost no oxygen. Cattails survive with aerenchyma: air-filled ' +
      'tissue running from leaves to rhizomes and roots, like built-in snorkels. In narrow-leaf ' +
      'cattail, it can make up roughly a third of a root’s volume and about three-quarters ' +
      'of a leaf’s.',
    basis: 'paper',
    art: 'aerenchyma',
  },
  {
    title: 'Roots change their surroundings',
    body:
      'Some of that oxygen leaks out of roots into the sediment: radial oxygen loss. What an ' +
      'optode sees is the resulting oxygen *concentration* in the mud, which is release minus ' +
      'what microbes and chemical reactions use up. You were documenting those pools. You never ' +
      'took any oxygen away.',
    basis: 'paper',
    art: 'rol',
  },
  {
    title: 'Growth matters',
    body:
      'When a new root or rhizome pushed into oxygen-free sediment, oxygen there jumped from zero ' +
      'to about 25–35% of air saturation. Stein & Cardon found belowground growth and ' +
      'development were the dominant drivers of oxygen loss to the sediment.',
    basis: 'measured',
    art: 'growth',
  },
  {
    title: 'Not all roots behave alike',
    body:
      'Pools around new rhizomes and adventitious roots faded from each spot within days ' +
      '(about 78 and 95 hours on average) as the tissue matured. Lateral roots that later burst ' +
      'out of those roots made broad plumes that lasted for weeks (about 502 hours on average).',
    basis: 'measured',
    art: 'roots',
  },
  {
    title: 'Oxygenation persists at night',
    body:
      'With the lights off and photosynthesis stopped, pools around growing tissue were still ' +
      'there, and even crept up through the night. Day–night swings were small: about 3% ' +
      'saturation on average (up to c. 5%), versus 25–35% from growth. How cattails keep ' +
      'oxygen flowing in the dark is still unclear.',
    basis: 'measured',
    art: 'night',
  },
  {
    title: 'Soil chemistry is complicated',
    body:
      'Oxygen in otherwise oxygen-free mud lets different microbial processes and chemical ' +
      'reactions run: from decomposition of organic carbon, to consumption of methane, to ' +
      'changes in metals. These processes matter for wetland biogeochemistry and carbon cycling, ' +
      'in both directions.',
    basis: 'paper',
    art: 'chemistry',
  },
  {
    title: 'Important questions remain',
    body:
      'The study did not measure greenhouse gas emissions, so it does not show that cattails ' +
      'raise or lower methane. It followed four lab-grown plants, one after another. The authors ' +
      'suggest the seasonal timing of root and rhizome growth should become a priority for ' +
      'understanding wetland biogeochemistry.',
    basis: 'paper',
    art: 'questions',
  },
];

/** Values for the measured-vs-simulated comparison graphic. */
export const COMPARISON = {
  growthLow: 25,
  growthHigh: 35,
  dielMean: 3,
  dielUpper: 5,
  source: 'Stein & Cardon 2026 (abstract and results)',
} as const;

export const METHODS_EXPLAINER: string[] = [
  'Four narrow-leaf cattail plants and their sediment were collected from a marsh on the Parker River, which feeds the Plum Island estuary in Massachusetts. Plants were studied one after another in the lab between May 2024 and April 2026.',
  'Each plant grew in a rhizobox: a thin, clear-sided, watertight box (about 39 × 20 × 4 cm) packed with live marsh mud. Leaves grew up into a growth light (on 05:00–19:00); the roots stayed in the dark.',
  'A hand-made planar optode, a sensor film about 26 × 13 cm, covered part of one clear wall. Its dye responds to oxygen. Lit with blue LED light, it glows in a way a camera can record, and calibrated image maths turns that into % oxygen saturation.',
  'A camera photographed the optode every 3 to 5 minutes for days at a time, while a leaf gas-exchange system measured photosynthesis and stomatal opening on one leaf every minute.',
  'Small regions of interest (ROIs) placed next to roots and rhizomes tracked how long each oxygen pool lasted at that spot.',
];

// ---------------------------------------------------------------------------------------------
// Scientists. Only verified, published information. No invented bios, quotes, or endorsements.
// ---------------------------------------------------------------------------------------------

export interface ScientistProfile {
  name: string;
  role: string;
  facts: string[];
  source: string;
}

export const SCIENTISTS: ScientistProfile[] = [
  {
    name: 'Ilana R. Stein',
    role: 'Postdoctoral researcher, Ecosystems Center, Marine Biological Laboratory (Woods Hole, MA)',
    facts: [
      'First and corresponding author of the 2026 New Phytologist study.',
      'Conceptualized and carried out the experiment with Zoe Cardon; analyzed the data and wrote the manuscript (with input from Cardon), per the paper’s author contributions.',
      'Works in Zoe Cardon’s lab at MBL (MBL News, 2026).',
    ],
    source: 'Stein & Cardon 2026; MBL News, 19 Nov 2026',
  },
  {
    name: 'Zoe G. Cardon',
    role: 'Researcher, Ecosystems Center, Marine Biological Laboratory (Woods Hole, MA)',
    facts: [
      'Co-author of the 2026 New Phytologist study.',
      'Conceptualized and carried out the experiment with Ilana Stein; acquired the funding, provided equipment, and built the planar optode rhizobox system, per the paper’s author contributions.',
      'The work was funded by a Simons Foundation grant to Cardon (no. 1247132).',
    ],
    source: 'Stein & Cardon 2026; MBL News, 19 Nov 2026',
  },
  {
    name: 'Suzanne Thomas',
    role: 'Senior research assistant, Marine Biological Laboratory',
    facts: [
      'Made the large oxygen-sensitive optodes used in the study by hand (paper acknowledgements; MBL News).',
    ],
    source: 'Stein & Cardon 2026 (Acknowledgements); MBL News, 19 Nov 2026',
  },
];

export const PROFILE_PENDING =
  '[Biographies, photos, and personal statements pending written approval, per studio policy.]';

export const NOT_AFFILIATED =
  'MUCK LIFE is inspired by this research. It was not developed in collaboration with, or ' +
  'endorsed by, the researchers or the Marine Biological Laboratory.';

export const FIELD_SITE =
  'Plants came from a long-term research site associated with the Plum Island Ecosystems Long ' +
  'Term Ecological Research program (PIE LTER, NSF OCE 2224608).';

// ---------------------------------------------------------------------------------------------
// Explore the Science
// ---------------------------------------------------------------------------------------------

export interface Topic {
  id: string;
  title: string;
  paragraphs: { text: string; basis: Basis }[];
}

export const TOPICS: Topic[] = [
  {
    id: 'wetlands',
    title: 'Wetland ecosystems',
    paragraphs: [
      {
        text: 'Wetlands are places where water saturates the soil for much of the time: marshes, swamps, bogs. In saturated soil, water fills the spaces between grains, and oxygen moves through water far more slowly than through air.',
        basis: 'background',
      },
      {
        text: 'Microbes use up what little oxygen arrives, so wetland sediment just below the surface is typically oxygen-free (anoxic). In the study’s rhizoboxes, sediment without roots or rhizomes was anoxic.',
        basis: 'measured',
      },
    ],
  },
  {
    id: 'cattail',
    title: 'Cattail biology',
    paragraphs: [
      {
        text: 'Narrow-leaf cattail, Typha angustifolia, is a widespread emergent wetland plant that forms dense stands in brackish and freshwater marshes. It is of interest to land managers both as a potential invader and for cleaning up wastewater and metal contamination, abilities that rely on oxygenating marsh mud.',
        basis: 'paper',
      },
      {
        text: 'The familiar brown “cattail” is the flower spike. The lab plants in this study were kept vegetative (no flowering shoots).',
        basis: 'paper',
      },
    ],
  },
  {
    id: 'aerenchyma',
    title: 'Aerenchyma',
    paragraphs: [
      {
        text: 'Most wetland plants have aerenchyma: air-filled tissue in leaves, stems and roots that lets oxygen reach growing root tips despite oxygen-free soil.',
        basis: 'paper',
      },
      {
        text: 'Narrow-leaf cattail is especially well equipped: tissue porosity up to about 32% in roots and about 74% in leaves, with low resistance to air flow (values the paper cites from earlier studies).',
        basis: 'paper',
      },
    ],
  },
  {
    id: 'rhizomes',
    title: 'Rhizomes',
    paragraphs: [
      {
        text: 'A rhizome is an underground stem, not a root. Cattail rhizomes extend sideways through the sediment and end in new aboveground shoots (ramets) of 5–10 leaves up to 3 m tall. This is how a cattail stand spreads into new ground.',
        basis: 'paper',
      },
      {
        text: 'A growing rhizome apex carried an oxygen pool with it. At any one spot, the pool disappeared after about 78 hours on average (78 ± 28 h, three plants).',
        basis: 'measured',
      },
    ],
  },
  {
    id: 'adventitious',
    title: 'Adventitious roots',
    paragraphs: [
      {
        text: 'Adventitious roots grow from the rhizome (a stem), and they are the plant’s main way of exploring new sediment. In the study, new groups of them often erupted from a rhizome 3–7 days after the rhizome was established.',
        basis: 'measured',
      },
      {
        text: 'Their oxygen pool appeared with the growing tip and vanished from each patch of mud about 95 hours after the new tissue formed (95 ± 17 h, four plants).',
        basis: 'measured',
      },
    ],
  },
  {
    id: 'lateral',
    title: 'Lateral roots',
    paragraphs: [
      {
        text: 'Lateral roots are short, fine roots that branch out of adventitious roots, maximizing nutrient uptake. They start in the centre of the parent root and push outward, perforating its barrier to oxygen loss as they go.',
        basis: 'paper',
      },
      {
        text: 'Lateral-root plumes often appeared days after the parent root’s own pool had faded, covered more sediment, and lasted far longer: 502 ± 170 h on average, one plant’s for about 888 h.',
        basis: 'measured',
      },
    ],
  },
  {
    id: 'rol',
    title: 'Radial oxygen loss',
    paragraphs: [
      {
        text: 'Radial oxygen loss (ROL) is oxygen diffusing out of roots into the surrounding soil. Oxygen inside a plant is internal transport; oxygen released is ROL; oxygen measured in the mud is what remains after microbes and chemical reactions consume some of it.',
        basis: 'paper',
      },
      {
        text: 'ROL has often been seen to rise in the daytime, which is why the day–night cycle was a natural suspect.',
        basis: 'paper',
      },
    ],
  },
  {
    id: 'rhizosphere',
    title: 'Rhizosphere oxygen',
    paragraphs: [
      {
        text: 'The rhizosphere is the thin zone of soil influenced by roots. Here, pools around new roots and rhizomes regularly reached 25–30% of air saturation (up to about 35%), in sediment that was otherwise at zero.',
        basis: 'measured',
      },
      {
        text: 'When the researchers flushed a whole rhizobox with oxygen-free water, oxygen reappeared around roots and rhizomes within minutes and recovered in about an hour.',
        basis: 'measured',
      },
    ],
  },
  {
    id: 'maturation',
    title: 'Root maturation',
    paragraphs: [
      {
        text: 'Many wetland plants build a barrier to oxygen loss in older root tissue, which helps get oxygen to the growing tip. Typha adventitious roots develop a suberized, double-layered Casparian strip; T. angustifolia lateral roots do not.',
        basis: 'paper',
      },
      {
        text: 'The authors speculate that this barrier, together with the mud’s steady demand for oxygen, explains why pools faded behind growing tips. It is a hypothesis, not a measurement.',
        basis: 'speculation',
      },
    ],
  },
  {
    id: 'phenology',
    title: 'Plant phenology',
    paragraphs: [
      {
        text: 'Phenology is the timing of life-cycle events. Because growth drove oxygen loss, when roots and rhizomes grow matters. Earlier data and models suggest cattail rhizome biomass grows most in mid-to-late summer, so oxygenation may be particularly intense then.',
        basis: 'speculation',
      },
    ],
  },
  {
    id: 'optode',
    title: 'Planar optode imaging',
    paragraphs: [
      {
        text: 'A planar optode is a sensor film containing an oxygen-sensitive dye and a reference dye. Under blue light the film luminesces; oxygen dims the sensitive dye’s signal. A camera records colour channels, and a calibrated ratio turns each pixel into % oxygen saturation.',
        basis: 'paper',
      },
      {
        text: 'In the paper’s processed images, darker meant more oxygen. MUCK LIFE uses bright colours for more oxygen instead, purely to make it readable. The colours are an imaging representation. Oxygen does not glow in mud.',
        basis: 'game',
      },
    ],
  },
  {
    id: 'microbes',
    title: 'Microbial oxygen consumption',
    paragraphs: [
      {
        text: 'Sediment is hungry for oxygen. When the researchers injected oxygenated water into root-free mud, oxygen peaked near 50% saturation and was back to zero in about 1.5 hours, roughly 3 mg of O₂ per litre per hour of demand at the optode face.',
        basis: 'measured',
      },
      {
        text: 'Microbes near roots likely consume even more, fed by carbon that roots release. Microbes are neither heroes nor villains here; they are the chemistry.',
        basis: 'paper',
      },
    ],
  },
  {
    id: 'redox',
    title: 'Sediment redox chemistry',
    paragraphs: [
      {
        text: 'Without oxygen, microbes use other substances to respire, such as nitrate, iron and manganese minerals, and sulfate, and some produce methane. A little oxygen opens up aerobic processes instead: aerobic decomposition, nitrification, methane oxidation, and changes in metals.',
        basis: 'background',
      },
      {
        text: 'Root oxygen creates oxygenated microsites in otherwise oxygen-free sediment, changing which of these processes can run where.',
        basis: 'paper',
      },
    ],
  },
  {
    id: 'carbon',
    title: 'Wetland carbon cycling',
    paragraphs: [
      {
        text: 'Wetland mud stores a great deal of carbon partly because decomposition is slow without oxygen. Root oxygen could speed up aerobic decomposition (less carbon stored) and also let microbes consume methane before it escapes. Both directions are possible.',
        basis: 'paper',
      },
      {
        text: 'This study did not measure greenhouse gases. MUCK LIFE does not calculate methane or carbon emissions, and its simulation is not a predictive model of wetland carbon.',
        basis: 'game',
      },
    ],
  },
  {
    id: 'uncertainty',
    title: 'Scientific methods & uncertainty',
    paragraphs: [
      {
        text: 'Four individual plants were studied one after another in a lab, not in the field. One produced no new rhizome, and in one, day–night pulsing was undetectable. One lateral-root series was cut off, so its true duration was longer than the 144 h recorded.',
        basis: 'measured',
      },
      {
        text: 'How cattails keep oxygen flowing at night is unclear. The authors suggest incomplete stomatal closure and/or leakage through the leaf cuticle may let air keep diffusing in.',
        basis: 'speculation',
      },
    ],
  },
];

export const SIMPLIFICATIONS: string[] = [
  'The glowing regions are an imaging colour scale, not visible oxygen clouds. Oxygen does not glow.',
  'You document oxygen. Nothing in the game captures or removes it from the mud.',
  'The model greatly simplifies oxygen transport, diffusion, and consumption, on a coarse grid.',
  'Root and rhizome growth rates are sped up for play, and time is compressed: a day passes in seconds.',
  'Oxygen-field intensities are tuned to resemble the study’s ranges, but they are not experimentally calibrated.',
  'Day–night effects are a small, simplified curve shaped after the paper’s description.',
  'Root maturation uses simple age-based rules. Real tissue develops barriers gradually and variably.',
  'Delays (lateral eruption, roots from rhizome nodes) are shortened, and growth pulses are a game abstraction.',
  'Imaging artefacts, scoring, combos, and the chemistry overlay’s microbe icons are illustrative.',
  'The paper did not directly measure greenhouse gas emissions, and neither does the game.',
  'The simulation is not a validated or predictive model of wetland carbon cycling.',
  'The original results come from four laboratory-grown Typha angustifolia plants, studied sequentially.',
  'Results may differ for other plants, other wetlands, other seasons, and field conditions.',
];

// ---------------------------------------------------------------------------------------------
// Chemistry overlay copy (Level 6)
// ---------------------------------------------------------------------------------------------

export const CHEMISTRY_LEGEND = {
  oxic: 'OXYGENATED MICROSITE: aerobic microbes can respire O₂ here (e.g. aerobic decomposition, methane oxidation)',
  anoxic:
    'OXYGEN-FREE MUD: anaerobic processes run here (e.g. iron and sulfate reduction, methane production)',
  note: 'Conceptual sketch only. No chemistry or emissions are calculated.',
};

export const ENDING_CLOSE = [
  'The game ends here. The discovery doesn’t.',
  'A Minus 80 Studios production.',
  'Play the discovery.',
];
