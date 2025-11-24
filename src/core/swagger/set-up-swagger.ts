import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const setUpSwagger = (
  app: INestApplication,
  name: string,
  prefix: string,
  version: string,
): void => {
  const options = new DocumentBuilder()
    .setTitle(`${name} API Document`)
    .setDescription('API Documentation')
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  });
};
