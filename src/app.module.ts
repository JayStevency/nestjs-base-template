import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configurations } from './core';
import { PrismaModule } from './prisma';
import { HealthModule } from './health';

const lokiEnabled = process.env.LOKI_ENABLED === 'true';
const lokiHost = process.env.LOKI_HOST || 'http://localhost:3100';

const getPinoTransport = () => {
  const targets = [];

  // Always add pretty print for local/dev
  if (process.env.NODE_ENV !== 'prod') {
    targets.push({
      target: 'pino-pretty',
      options: { colorize: true },
      level: 'debug',
    });
  }

  // Add Loki transport if enabled
  if (lokiEnabled) {
    targets.push({
      target: 'pino-loki',
      options: {
        batching: true,
        interval: 5,
        host: lokiHost,
        labels: {
          app: 'nestjs-base-template',
          env: process.env.NODE_ENV || 'local',
        },
      },
      level: 'info',
    });
  }

  return targets.length > 0 ? { targets } : undefined;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurations],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'prod' ? 'debug' : 'info',
        transport: getPinoTransport(),
      },
    }),
    PrismaModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
