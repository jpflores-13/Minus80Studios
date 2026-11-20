// The crew. All the same species; every number and ability here is fiction for play.

export type CharacterId =
  'diggy' | 'noseferatu' | 'sherlock' | 'molezilla' | 'sniffs' | 'starfather';

export type SpecialEffect =
  /** Faster, and the combo window stretches, for a few seconds. */
  | 'starRush'
  /** Sensory memory lasts much longer, for a few seconds. */
  | 'afterimage'
  /** Evidence from every touch is sharply boosted, for a few seconds. */
  | 'elementary'
  /** Instantly eats everything already identified within reach. */
  | 'feedingFrenzy'
  /** BUBBLE SNIFF has no cooldown and extra range, for a few seconds. */
  | 'bubbleBonanza'
  /** Every bite scores extra, for a few seconds. */
  | 'theOffer';

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  line: string;
  speed: number;
  /** Seconds touch marks stay before fading. */
  memory: number;
  /** Multiplies the evidence each touch gives. */
  acuity: number;
  maxEnergy: number;
  /** Seconds between bites that keep a combo going. */
  comboWindow: number;
  digSpeed: number;
  special: string;
  specialEffect: SpecialEffect;
  /** How much eating fills the special charge meter (it's full at 100). */
  chargePerBite: number;
  /** Seconds the special lasts once used. */
  specialSeconds: number;
  accent: number;
  /** Which stage unlocks this character (0 = from the start). */
  unlockedAfter: number;
}

export const CHARACTERS: Record<CharacterId, Character> = {
  diggy: {
    id: 'diggy',
    name: 'DIGGY STARDUST',
    title: 'The Adventurer',
    line: 'Let’s rock and mole.',
    speed: 1,
    memory: 2.6,
    acuity: 1,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 1,
    special: 'STAR RUSH',
    specialEffect: 'starRush',
    chargePerBite: 18,
    specialSeconds: 5,
    accent: 0xebc478,
    unlockedAfter: 0,
  },
  noseferatu: {
    id: 'noseferatu',
    name: 'NOSEFERATU',
    title: 'The Night Hunter',
    line: 'I vant to eat your worms.',
    speed: 0.95,
    memory: 4.5,
    acuity: 1,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 0.9,
    special: 'AFTERIMAGE',
    specialEffect: 'afterimage',
    chargePerBite: 16,
    specialSeconds: 6,
    accent: 0x8a2a3a,
    unlockedAfter: 2,
  },
  sherlock: {
    id: 'sherlock',
    name: 'SHERLOCK MOLES',
    title: 'The Investigator',
    line: 'Elementary, my dear worm.',
    speed: 0.95,
    memory: 2.6,
    acuity: 1.5,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 1,
    special: 'ELEMENTARY',
    specialEffect: 'elementary',
    chargePerBite: 16,
    specialSeconds: 5,
    accent: 0x8a6a4a,
    unlockedAfter: 2,
  },
  molezilla: {
    id: 'molezilla',
    name: 'MOLEZILLA',
    title: 'The Menace',
    line: 'Is anyone gonna eat that?',
    speed: 0.9,
    memory: 2.4,
    acuity: 0.9,
    maxEnergy: 140,
    comboWindow: 4,
    digSpeed: 1.2,
    special: 'FEEDING FRENZY',
    specialEffect: 'feedingFrenzy',
    chargePerBite: 25,
    specialSeconds: 0,
    accent: 0xd98d98,
    unlockedAfter: 3,
  },
  sniffs: {
    id: 'sniffs',
    name: 'SIR SNIFFS-A-LOT',
    title: 'The Explorer',
    line: 'Something smells delicious.',
    speed: 1,
    memory: 2.6,
    acuity: 1,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 1,
    special: 'BUBBLE BONANZA',
    specialEffect: 'bubbleBonanza',
    chargePerBite: 20,
    specialSeconds: 6,
    accent: 0x5a8fc4,
    unlockedAfter: 4,
  },
  starfather: {
    id: 'starfather',
    name: 'THE STARFATHER',
    title: 'The Veteran',
    line: 'Never leave a worm behind.',
    speed: 0.95,
    memory: 3,
    acuity: 1.2,
    maxEnergy: 110,
    comboWindow: 4,
    digSpeed: 1,
    special: 'AN OFFER YOU CAN’T REFUSE',
    specialEffect: 'theOffer',
    chargePerBite: 14,
    specialSeconds: 6,
    accent: 0xebc478,
    unlockedAfter: 5,
  },
};

export const CHARACTER_ORDER: CharacterId[] = [
  'diggy',
  'noseferatu',
  'sherlock',
  'molezilla',
  'sniffs',
  'starfather',
];
