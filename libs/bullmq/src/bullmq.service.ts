import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue, Worker, Job, JobsOptions, Processor } from 'bullmq';
import { BULLMQ_MODULE_OPTIONS } from './bullmq.constants';
import { BullMqModuleOptions } from './bullmq.interface';

@Injectable()
export class BullmqService implements OnModuleDestroy {
  private readonly logger = new Logger(BullmqService.name);
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor(
    @Inject(BULLMQ_MODULE_OPTIONS)
    private readonly options: BullMqModuleOptions,
  ) {}

  async onModuleDestroy() {
    await this.closeAll();
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.options.connection,
        defaultJobOptions: this.options.defaultJobOptions,
      });
      this.queues.set(name, queue);
      this.logger.log(`Queue "${name}" created`);
    }
    return this.queues.get(name)!;
  }

  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, {
      ...this.options.defaultJobOptions,
      ...options,
    });
    this.logger.debug(`Job "${jobName}" added to queue "${queueName}" with id ${job.id}`);
    return job;
  }

  async addBulk<T>(
    queueName: string,
    jobs: Array<{ name: string; data: T; options?: JobsOptions }>,
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    const bulkJobs = jobs.map((job) => ({
      name: job.name,
      data: job.data,
      opts: { ...this.options.defaultJobOptions, ...job.options },
    }));
    return queue.addBulk(bulkJobs);
  }

  createWorker<T = any, R = any>(
    queueName: string,
    processor: Processor<T, R>,
    options?: { concurrency?: number },
  ): Worker<T, R> {
    if (this.workers.has(queueName)) {
      this.logger.warn(`Worker for queue "${queueName}" already exists, returning existing worker`);
      return this.workers.get(queueName) as Worker<T, R>;
    }

    const worker = new Worker<T, R>(queueName, processor, {
      connection: this.options.connection,
      concurrency: options?.concurrency ?? 1,
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed in queue "${queueName}"`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed in queue "${queueName}": ${err.message}`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker for queue "${queueName}" created`);
    return worker;
  }

  async getJob<T>(queueName: string, jobId: string): Promise<Job<T> | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId) as Promise<Job<T> | undefined>;
  }

  async getJobs<T>(
    queueName: string,
    types: ('active' | 'completed' | 'delayed' | 'failed' | 'paused' | 'waiting')[],
    start?: number,
    end?: number,
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    return queue.getJobs(types, start, end) as Promise<Job<T>[]>;
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.debug(`Job ${jobId} removed from queue "${queueName}"`);
    }
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Queue "${queueName}" paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Queue "${queueName}" resumed`);
  }

  async drainQueue(queueName: string, delayed = false): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain(delayed);
    this.logger.log(`Queue "${queueName}" drained`);
  }

  async obliterateQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.obliterate();
    this.queues.delete(queueName);
    this.logger.log(`Queue "${queueName}" obliterated`);
  }

  async closeAll(): Promise<void> {
    for (const [name, worker] of this.workers) {
      await worker.close();
      this.logger.log(`Worker for queue "${name}" closed`);
    }
    this.workers.clear();

    for (const [name, queue] of this.queues) {
      await queue.close();
      this.logger.log(`Queue "${name}" closed`);
    }
    this.queues.clear();
  }
}
