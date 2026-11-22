import type { JournalEntry } from '../config/progress';
import { type Interpretation, type Mystery } from '../content/mysteries';

/** A mystery unlocks once every piece of its required evidence has been discovered. */
export function isUnlocked(mystery: Mystery, journal: Record<string, JournalEntry>): boolean {
  return mystery.requiredEvidence.every((id) => journal[id]?.discovered === true);
}

export interface MysteryOutcome {
  calibrated: boolean;
  explanation: string;
}

/** Interpreting evidence is never "wrong" to attempt; the feedback is about calibration. */
export function interpret(mystery: Mystery, choice: Interpretation): MysteryOutcome {
  return {
    calibrated: choice === mystery.correctInterpretation,
    explanation: mystery.explanation[choice],
  };
}
