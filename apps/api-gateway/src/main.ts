import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setUpSwagger } from './core';
import { ConfigProps } from '@app/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: true,
    bufferLogs: true,
  });

  // Use Pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get<ConfigService<ConfigProps>>(ConfigService);
  const version = configService.get('version');
  const appName = configService.get('appName');
  const environment = configService.get('environment');
  const appPort = configService.get('gatewayPort');
  const telemetry = configService.get('telemetry');
  const loki = configService.get('loki');

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

  const docsUrl = `http://localhost:${appPort}/${routePrefix}/docs`;
  logger.log(`🚀 API Gateway: ${appName}`);
  logger.log(`📦 Version: ${version}`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔌 Port: ${appPort}`);
  logger.log(`📚 Swagger Docs: ${docsUrl}`);
  logger.log(`📡 OpenTelemetry: ${telemetry?.enabled ? 'enabled' : 'disabled'}`);
  logger.log(`📊 Loki: ${loki?.enabled ? 'enabled' : 'disabled'}`);
}
bootstrap();
