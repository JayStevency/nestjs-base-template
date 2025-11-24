import { initTelemetry } from '@app/telemetry';

// Initialize OpenTelemetry BEFORE importing any other modules
// This ensures all HTTP requests are traced
const SERVICE_NAME = 'api-gateway';
const SERVICE_VERSION = process.env.npm_package_version || '0.0.1';
initTelemetry(SERVICE_NAME, SERVICE_VERSION);

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setUpSwagger } from './core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: true,
    bufferLogs: true,
  });

  // Use Pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  const config: ConfigService = app.get(ConfigService);
  const version = config.get<string>('version');
  const appName = config.get<string>('appName');
  const environment = config.get<string>('environment');
  const appPort = config.get<number>('gatewayPort');
  const telemetryEnabled = config.get<boolean>('telemetry.enabled');

  // Extract prefix from app name (e.g., "nestjs-base-template" -> "api")
  const prefix = 'api';

  // Setup global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Setup route prefix and Swagger based on environment
  const routePrefix = environment === 'dev' ? `dev-${prefix}` : prefix;
  app.setGlobalPrefix(routePrefix);
  setUpSwagger(app, appName, routePrefix, version);

  await app.listen(appPort);

  const lokiEnabled = process.env.LOKI_ENABLED === 'true';
  const docsUrl = `http://localhost:${appPort}/${routePrefix}/docs`;
  logger.log(`🚀 API Gateway: ${appName}`);
  logger.log(`📦 Version: ${version}`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔌 Port: ${appPort}`);
  logger.log(`📚 Swagger Docs: ${docsUrl}`);
  logger.log(`📡 OpenTelemetry: ${telemetryEnabled ? 'enabled' : 'disabled'}`);
  logger.log(`📊 Loki: ${lokiEnabled ? 'enabled' : 'disabled'}`);
}
bootstrap();
