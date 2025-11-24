import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { setUpSwagger } from './core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: true,
  });

  const config: ConfigService = app.get(ConfigService);
  const version = config.get<string>('version');
  const appName = config.get<string>('appName');
  const environment = config.get<string>('environment');
  const appPort = config.get<number>('port');

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
  console.log(`🚀 App Name: ${appName}`);
  console.log(`📦 Version: ${version}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔌 Port: ${appPort}`);
  console.log(`📚 Swagger Docs: ${docsUrl}`);
}
bootstrap();
