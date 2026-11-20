import { job1 } from './job1';
import { job2 } from './job2';
import { job3 } from './job3';
import { job4 } from './job4';
import type { JobConfig } from './types';

export const JOBS: JobConfig[] = [job1, job2, job3, job4];

export function getJob(id: string): JobConfig {
  return JOBS.find((j) => j.id === id) ?? job1;
}
