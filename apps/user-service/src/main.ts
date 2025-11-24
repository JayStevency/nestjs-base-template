import { initTelemetry } from '@app/telemetry';

// Initialize OpenTelemetry BEFORE importing any other modules
// This ensures all RabbitMQ messages are traced
const SERVICE_NAME = 'user-service';
const SERVICE_VERSION = process.env.npm_package_version || '0.0.1';
initTelemetry(SERVICE_NAME, SERVICE_VERSION);

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { UserServiceModule } from './user-service.module';
import { RabbitmqService } from '@app/rabbitmq';
import { QUEUES } from '@app/shared';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule, {
    bufferLogs: true,
  });

  // Use Pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  const rmqService = app.get<RabbitmqService>(RabbitmqService);

  app.connectMicroservice<MicroserviceOptions>(
    rmqService.getOptions(QUEUES.USER_QUEUE),
  );

  await app.startAllMicroservices();

  const lokiEnabled = process.env.LOKI_ENABLED === 'true';
  const otelEnabled = process.env.OTEL_ENABLED === 'true';

  logger.log(`🚀 ${SERVICE_NAME} is running`);
  logger.log(`📦 Version: ${SERVICE_VERSION}`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📡 OpenTelemetry: ${otelEnabled ? 'enabled' : 'disabled'}`);
  logger.log(`📊 Loki: ${lokiEnabled ? 'enabled' : 'disabled'}`);
  logger.log(`🐰 RabbitMQ Queue: ${QUEUES.USER_QUEUE}`);
}

bootstrap();
