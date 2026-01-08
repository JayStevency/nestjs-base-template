import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullmqService } from './bullmq.service';
import { BULLMQ_MODULE_OPTIONS } from './bullmq.constants';
import { BullMqModuleOptions, BullMqModuleAsyncOptions } from './bullmq.interface';
import { ConfigProps } from '@app/core';

@Global()
@Module({})
export class BullmqModule {
  static forRoot(options: BullMqModuleOptions): DynamicModule {
    return {
      module: BullmqModule,
      providers: [
        {
          provide: BULLMQ_MODULE_OPTIONS,
          useValue: options,
        },
        BullmqService,
      ],
      exports: [BullmqService],
    };
  }

  static forRootAsync(options: BullMqModuleAsyncOptions): DynamicModule {
    return {
      module: BullmqModule,
      imports: options.imports || [],
      providers: [
        {
          provide: BULLMQ_MODULE_OPTIONS,
          inject: options.inject || [],
          useFactory: options.useFactory,
        },
        BullmqService,
      ],
      exports: [BullmqService],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: BullmqModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: BULLMQ_MODULE_OPTIONS,
          inject: [ConfigService],
          useFactory: (configService: ConfigService<ConfigProps>): BullMqModuleOptions => {
            const redis = configService.get('redis');
            if (!redis) {
              throw new Error('Redis configuration is required for BullMQ. Set REDIS_HOST and REDIS_PORT in your environment.');
            }
            return {
              connection: {
                host: redis.host,
                port: redis.port,
              },
              defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 1000,
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
              },
            };
          },
        },
        BullmqService,
      ],
      exports: [BullmqService],
    };
  }
}
