import { QueueOptions, WorkerOptions, JobsOptions } from 'bullmq';

export interface BullMqModuleOptions {
  connection: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions?: JobsOptions;
}

export interface BullMqQueueOptions {
  name: string;
  queueOptions?: Omit<QueueOptions, 'connection'>;
  workerOptions?: Omit<WorkerOptions, 'connection'>;
}

export interface BullMqModuleAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (...args: any[]) => Promise<BullMqModuleOptions> | BullMqModuleOptions;
}
