// Six scientific mysteries, each resolved by a calibrated-uncertainty judgment call rather than
// a right/wrong quiz answer. Mystery 1 must stay honestly unresolved: the real paper it is based
// on never directly observed leopard seal copulation. See docs/SCIENTIFIC_MYSTERIES.md.

export type Interpretation = 'supported' | 'insufficient' | 'notSupported';

export interface Mystery {
  id: string;
  title: string;
  question: string;
  requiredEvidence: string[];
  correctInterpretation: Interpretation;
  explanation: Record<Interpretation, string>;
}

export const MYSTERIES: Mystery[] = [
  {
    id: 'leopard-seal-courtship',
    title: 'Do leopard seals mate the way this pair behaved?',
    question:
      'A male and female leopard seal were observed courting for about two hours, with calls ' +
      'continuing for roughly eight more hours. Does this confirm how leopard seals mate?',
    requiredEvidence: ['leopardSeal'],
    correctInterpretation: 'insufficient',
    explanation: {
      supported:
        'Not quite. The real 2024 study that this is based on recorded courtship behavior and ' +
        'calls in detail, but the researchers never directly observed copulation — only a male ' +
        'later found with an injury consistent with an attempted mating. Calling this "confirmed" ' +
        'overstates what was actually seen.',
      insufficient:
        'That matches the real study. It documented courtship behavior and calling for the ' +
        'first time, but copulation itself was never directly observed — only indirect evidence ' +
        'afterward. The honest finding is "courtship happens; mating itself remains unconfirmed."',
      notSupported:
        'The courtship and calling were genuinely documented, so dismissing the observation ' +
        'entirely goes too far the other way. The careful read is: real behavior, confirmed; ' +
        'actual mating, still unconfirmed.',
    },
  },
  {
    id: 'novel-viral-seascape',
    title: 'Is the Southern Ocean full of undiscovered viruses?',
    question:
      'A full-season survey found that most of the viral diversity sampled had never been seen ' +
      'before. Is that strong evidence of a largely uncharacterized viral community?',
    requiredEvidence: ['virusParticle'],
    correctInterpretation: 'supported',
    explanation: {
      supported:
        'Right. The 2024 study sampled a full Antarctic season at a time-series site and found ' +
        'roughly three-quarters of the viral diversity was previously uncharacterized — direct, ' +
        'repeated sampling across months is strong evidence for that conclusion.',
      insufficient:
        'The evidence here is actually fairly strong: a full-season time series, not a single ' +
        'snapshot. It is reasonable to call this well supported, with the caveat that it ' +
        'describes one site and one season.',
      notSupported:
        'The sampling was repeated across a full season at a dedicated site, which is good ' +
        'evidence, not weak evidence. "Not supported" undersells what was actually measured.',
    },
  },
  {
    id: 'icefish-no-hemoglobin',
    title: 'Can a fish survive without hemoglobin?',
    question:
      'Icefish appear to lack the molecule most fish use to carry oxygen in their blood. Is this real?',
    requiredEvidence: ['icefish'],
    correctInterpretation: 'supported',
    explanation: {
      supported:
        'Correct. Icefish lost their hemoglobin genes entirely through a large deletional ' +
        'event, and survive on oxygen dissolved directly in blood plasma, helped by an ' +
        'oversized heart and the cold, oxygen-rich water they live in.',
      insufficient:
        'This one is actually well established, not borderline: the genetic deletion and the ' +
        'resulting physiology have been documented and confirmed by multiple lines of evidence.',
      notSupported:
        'This is a real, well-documented finding, not a misconception — icefish genuinely lack ' +
        'functional hemoglobin genes.',
    },
  },
  {
    id: 'krill-swarm-defense',
    title: 'Why do krill swarm in such enormous numbers?',
    question:
      'Antarctic krill form some of the largest animal swarms on Earth. Is swarming mainly ' +
      'understood as a predator-avoidance and feeding strategy?',
    requiredEvidence: ['krillSwarm'],
    correctInterpretation: 'supported',
    explanation: {
      supported:
        'That matches the broader, well-established understanding: dense swarming makes any ' +
        'one individual harder to target and lets krill feed efficiently on phytoplankton blooms.',
      insufficient:
        'The predator-avoidance and feeding explanation is the standard, well-supported account ' +
        'in the broader literature, not an open question.',
      notSupported:
        'Swarming behavior in krill is genuinely tied to both defense and feeding; this is not a ' +
        'claim to dismiss.',
    },
  },
  {
    id: 'diatom-bloom-timing',
    title: 'What triggers the spring plankton bloom?',
    question:
      'Is the return of sunlight in spring the main trigger for Southern Ocean diatom blooms?',
    requiredEvidence: ['diatom'],
    correctInterpretation: 'supported',
    explanation: {
      supported:
        'Yes — returning light after the Antarctic winter is the standard trigger described in ' +
        'the broader literature for the spring diatom bloom, which in turn feeds krill.',
      insufficient:
        'Light availability after the polar winter is well established as the primary trigger, ' +
        'not an unresolved question.',
      notSupported:
        'This is the mainstream, well-supported explanation for bloom timing, not a claim to ' +
        'reject.',
    },
  },
  {
    id: 'counting-vs-structure',
    title: 'Can you identify what a microbe is just by counting it?',
    question:
      'Fluorescence microscopy can count how many virus- and bacteria-sized particles are in a ' +
      'sample. Does counting alone tell you what those particles actually are?',
    requiredEvidence: ['labeledBacterium'],
    correctInterpretation: 'notSupported',
    explanation: {
      supported:
        'Not quite — counting particles with a fluorescent stain tells you how many are there, ' +
        'but not their shape or identity. Resolving structure is a separate step, typically done ' +
        'with electron microscopy.',
      insufficient:
        'It is more clear-cut than "insufficient": counting and identifying structure are ' +
        'different techniques entirely, not a matter of needing slightly more counting data.',
      notSupported:
        'Right. Counting (by fluorescence) and resolving structure (by electron microscopy) are ' +
        'genuinely separate techniques answering separate questions — "how many" is not the same ' +
        'as "what is it."',
    },
  },
];
