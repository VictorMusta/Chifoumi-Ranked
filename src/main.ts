import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));

  // CORS (utile pour le front local)
  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Renfo API')
    .setDescription("API d'authentification — Register & Login")
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 6969, '0.0.0.0');
  console.log(
    `🚀 Application running on: http://localhost:${process.env.PORT ?? 6969}`,
  );
  console.log(
    `📖 Swagger UI: http://localhost:${process.env.PORT ?? 6969}/api/docs`,
  );
}
bootstrap();
