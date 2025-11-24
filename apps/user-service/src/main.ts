import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { UserServiceModule } from './user-service.module';
import { RabbitmqService } from '@app/rabbitmq';
import { QUEUES } from '@app/shared';
import { ConfigProps } from '@app/core';

const SERVICE_NAME = 'user-service';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule, {
    bufferLogs: true,
  });

  // Use Pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get<ConfigService<ConfigProps>>(ConfigService);
  const version = configService.get('version');
  const environment = configService.get('environment');
  const telemetry = configService.get('telemetry');
  const loki = configService.get('loki');

  const rmqService = app.get<RabbitmqService>(RabbitmqService);

  app.connectMicroservice<MicroserviceOptions>(
    rmqService.getOptions(QUEUES.USER_QUEUE),
  );

  await app.startAllMicroservices();

  logger.log(`🚀 ${SERVICE_NAME} is running`);
  logger.log(`📦 Version: ${version}`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`📡 OpenTelemetry: ${telemetry?.enabled ? 'enabled' : 'disabled'}`);
  logger.log(`📊 Loki: ${loki?.enabled ? 'enabled' : 'disabled'}`);
  logger.log(`🐰 RabbitMQ Queue: ${QUEUES.USER_QUEUE}`);
}

bootstrap();
