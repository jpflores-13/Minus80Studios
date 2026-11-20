// The crew. All the same species; every number and ability here is fiction for play.

export type CharacterId =
  'diggy' | 'noseferatu' | 'sherlock' | 'molezilla' | 'sniffs' | 'starfather';

export interface Character {
  id: CharacterId;
  name: string;
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
  accent: number;
}

export const CHARACTERS: Record<CharacterId, Character> = {
  diggy: {
    id: 'diggy',
    name: 'DIGGY STARDUST',
    line: 'Let’s rock and mole.',
    speed: 1,
    memory: 2.6,
    acuity: 1,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 1,
    special: 'STAR RUSH',
    accent: 0xebc478,
  },
  noseferatu: {
    id: 'noseferatu',
    name: 'NOSEFERATU',
    line: 'I vant to eat your worms.',
    speed: 0.95,
    memory: 4.5,
    acuity: 1,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 0.9,
    special: 'AFTERIMAGE',
    accent: 0x8a2a3a,
  },
  sherlock: {
    id: 'sherlock',
    name: 'SHERLOCK MOLES',
    line: 'Elementary, my dear worm.',
    speed: 0.95,
    memory: 2.6,
    acuity: 1.5,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 1,
    special: 'ELEMENTARY',
    accent: 0x8a6a4a,
  },
  molezilla: {
    id: 'molezilla',
    name: 'MOLEZILLA',
    line: 'Is anyone gonna eat that?',
    speed: 0.9,
    memory: 2.4,
    acuity: 0.9,
    maxEnergy: 140,
    comboWindow: 4,
    digSpeed: 1.2,
    special: 'FEEDING FRENZY',
    accent: 0xd98d98,
  },
  sniffs: {
    id: 'sniffs',
    name: 'SIR SNIFFS-A-LOT',
    line: 'Something smells delicious.',
    speed: 1,
    memory: 2.6,
    acuity: 1,
    maxEnergy: 100,
    comboWindow: 3,
    digSpeed: 1,
    special: 'BUBBLE BONANZA',
    accent: 0x5a8fc4,
  },
  starfather: {
    id: 'starfather',
    name: 'THE STARFATHER',
    line: 'Never leave a worm behind.',
    speed: 0.95,
    memory: 3,
    acuity: 1.2,
    maxEnergy: 110,
    comboWindow: 4,
    digSpeed: 1,
    special: 'AN OFFER YOU CAN’T REFUSE',
    accent: 0xebc478,
  },
};
