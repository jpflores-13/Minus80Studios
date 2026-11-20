import { job1 } from './job1';
import type { JobConfig } from './types';

export const JOBS: JobConfig[] = [job1];

export function getJob(id: string): JobConfig {
  return JOBS.find((j) => j.id === id) ?? job1;
}
