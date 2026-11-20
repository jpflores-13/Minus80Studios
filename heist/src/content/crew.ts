// The crew. Each is a different set of Folder settings plus a fictional special. These are game
// parameters, not real molecular variants.

export type CrewId = 'ghost' | 'flash' | 'anchor' | 'phantom' | 'architect';

export interface FolderSpec {
  /** Corridor positions per second each end reels in. */
  speed: number;
  /** Seconds a fold lasts before it lets go. */
  lifetime: number;
  /** Seconds before the Folder can be deployed again. */
  cooldown: number;
  /** Deployments per job. */
  charges: number;
  /** Chance a directional lock lets an end slip past (used from Job 2). */
  bypass: number;
  /** Folders that can be active at once. */
  devices: number;
}

export interface CrewMember {
  id: CrewId;
  name: string;
  line: string;
  look: { jacket: number; hat: number; accent: number };
  folder: FolderSpec;
  moveSpeed: number;
  special: string;
}

export const CREW: Record<CrewId, CrewMember> = {
  ghost: {
    id: 'ghost',
    name: 'GHOST',
    line: 'Nobody saw anything.',
    look: { jacket: 0x1c1f24, hat: 0xc56553, accent: 0xedc77d },
    folder: { speed: 4.5, lifetime: 14, cooldown: 3, charges: 4, bypass: 0.1, devices: 1 },
    moveSpeed: 140,
    special: 'Slip past cameras for a moment',
  },
  flash: {
    id: 'flash',
    name: 'FLASH',
    line: 'In and out. Preferably out.',
    look: { jacket: 0xedc77d, hat: 0xe08a3a, accent: 0x14232b },
    folder: { speed: 8, lifetime: 8, cooldown: 3, charges: 4, bypass: 0.1, devices: 1 },
    moveSpeed: 160,
    special: 'A short burst of speed',
  },
  anchor: {
    id: 'anchor',
    name: 'ANCHOR',
    line: 'Good things take time.',
    look: { jacket: 0x5a6a3a, hat: 0x3a4a2a, accent: 0xedc77d },
    folder: { speed: 3, lifetime: 24, cooldown: 4, charges: 3, bypass: 0.05, devices: 1 },
    moveSpeed: 130,
    special: 'Hold an active fold steady',
  },
  phantom: {
    id: 'phantom',
    name: 'PHANTOM',
    line: 'Every system has a weakness.',
    look: { jacket: 0x5a3a7a, hat: 0x5a3a7a, accent: 0x65e3bd },
    folder: { speed: 4.5, lifetime: 14, cooldown: 3, charges: 4, bypass: 0.35, devices: 1 },
    moveSpeed: 140,
    special: 'Switch off a camera for a while',
  },
  architect: {
    id: 'architect',
    name: 'ARCHITECT',
    line: 'Technically, this shouldn’t work.',
    look: { jacket: 0x2f5a8a, hat: 0x2f5a8a, accent: 0xedc77d },
    folder: { speed: 4, lifetime: 14, cooldown: 3, charges: 5, bypass: 0.1, devices: 2 },
    moveSpeed: 135,
    special: 'Run two folds at once',
  },
};
