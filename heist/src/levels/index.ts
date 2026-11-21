import { job1 } from './job1';
import { job2 } from './job2';
import { job3 } from './job3';
import { job4 } from './job4';
import { job5 } from './job5';
import { job6 } from './job6';
// job7 exists (src/levels/job7.ts) but isn't registered yet: a scripted BFS-bot playthrough
// couldn't find a win for any crew member, even using the Folder, so it needs another balance
// pass (likely fewer guards or a less aggressive one-way lock on both arms at once) before it's
// playable. Don't add it back to JOBS until that's confirmed.
import type { JobConfig } from './types';

export const JOBS: JobConfig[] = [job1, job2, job3, job4, job5, job6];

export function getJob(id: string): JobConfig {
  return JOBS.find((j) => j.id === id) ?? job1;
}
