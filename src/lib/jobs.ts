import crypto from 'crypto';

type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface JobRecord {
  id: string;
  status: JobStatus;
  startedAt?: number;
  finishedAt?: number;
  result?: any;
  error?: string;
}

const jobStore: Map<string, JobRecord> = (global as any).__JOB_STORE__ || new Map();
(global as any).__JOB_STORE__ = jobStore;

export function createJob<T>(fn: () => Promise<T>): JobRecord {
  const id = crypto.randomUUID();
  const job: JobRecord = { id, status: 'queued' };
  jobStore.set(id, job);

  // Run asynchronously right after returning to caller
  setTimeout(async () => {
    const j = jobStore.get(id);
    if (!j) return;
    j.status = 'running';
    j.startedAt = Date.now();
    try {
      const result = await fn();
      j.status = 'succeeded';
      j.result = result;
    } catch (e: any) {
      j.status = 'failed';
      j.error = e?.message || 'Unknown error';
    } finally {
      j.finishedAt = Date.now();
      jobStore.set(id, j);
    }
  }, 0);

  return job;
}

export function getJob(id: string): JobRecord | undefined {
  return jobStore.get(id);
}


