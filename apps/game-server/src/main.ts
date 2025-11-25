import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { GameServerModule } from './game-server.module';
import { ColyseusService } from './colyseus/colyseus.service';

async function bootstrap() {
  const app = await NestFactory.create(GameServerModule, {
    abortOnError: true,
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(ConfigService);
  const colyseusService = app.get(ColyseusService);

  const appName = config.get<string>('gameServer.appName');
  const environment = config.get<string>('gameServer.environment');
  const colyseusPort = config.get<number>('gameServer.colyseus.port');

  // Start Colyseus server
  await colyseusService.listen(colyseusPort);

  logger.log(`🎮 Game Server: ${appName}`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔌 Colyseus Port: ${colyseusPort}`);
  logger.log(`🎯 WebSocket URL: ws://localhost:${colyseusPort}`);
}
bootstrap();
