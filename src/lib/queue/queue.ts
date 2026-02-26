import { randomUUID } from 'crypto';
import { incrementCounter } from '@/lib/observability/metrics';
import { logger } from '@/lib/observability/logger';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface QueueJob<TPayload = unknown, TResult = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  status: JobStatus;
  result?: TResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

type WorkerHandler = (job: QueueJob) => Promise<unknown>;

const jobs = new Map<string, QueueJob>();
const queue: string[] = [];
const workers = new Map<string, WorkerHandler>();
let processing = false;

export function registerWorker(type: string, handler: WorkerHandler) {
  workers.set(type, handler);
}

export async function enqueueJob<TPayload>(
  type: string,
  payload: TPayload
): Promise<QueueJob<TPayload>> {
  const now = new Date().toISOString();
  const job: QueueJob<TPayload> = {
    id: randomUUID(),
    type,
    payload,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(job.id, job);
  queue.push(job.id);
  incrementCounter('queue_jobs_enqueued_total', { type });

  void processQueue();

  return job;
}

export function getJob(jobId: string) {
  return jobs.get(jobId) || null;
}

async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    while (queue.length > 0) {
      const jobId = queue.shift();
      if (!jobId) continue;

      const job = jobs.get(jobId);
      if (!job) continue;

      const worker = workers.get(job.type);
      if (!worker) {
        job.status = 'failed';
        job.updatedAt = new Date().toISOString();
        job.error = `No worker registered for job type ${job.type}`;
        incrementCounter('queue_jobs_failed_total', { type: job.type });
        continue;
      }

      job.status = 'processing';
      job.updatedAt = new Date().toISOString();

      try {
        const result = await worker(job);
        job.status = 'completed';
        job.result = result;
        job.updatedAt = new Date().toISOString();
        incrementCounter('queue_jobs_completed_total', { type: job.type });
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown worker error';
        job.updatedAt = new Date().toISOString();
        incrementCounter('queue_jobs_failed_total', { type: job.type });
        logger.error('Queue worker failed', {
          jobId: job.id,
          type: job.type,
          error: job.error,
        });
      }
    }
  } finally {
    processing = false;
  }
}
