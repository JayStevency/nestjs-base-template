import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ColyseusModule } from './colyseus/colyseus.module';
import { gameServerConfig } from './config/game-server.config';

const lokiEnabled = process.env.LOKI_ENABLED === 'true';
const lokiHost = process.env.LOKI_HOST || 'http://localhost:3100';

const getPinoTransport = () => {
  const targets = [];

  if (process.env.NODE_ENV !== 'prod') {
    targets.push({
      target: 'pino-pretty',
      options: { colorize: true },
      level: 'debug',
    });
  }

  if (lokiEnabled) {
    targets.push({
      target: 'pino-loki',
      options: {
        batching: true,
        interval: 5,
        host: lokiHost,
        labels: {
          app: 'game-server',
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
      load: [gameServerConfig],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'prod' ? 'debug' : 'info',
        transport: getPinoTransport(),
      },
    }),
    ColyseusModule,
  ],
})
export class GameServerModule {}
