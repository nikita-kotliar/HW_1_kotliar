import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

try {
  process.loadEnvFile();
} catch {
  // .env is optional, defaults are used when it is missing
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Cinema API')
    .setDescription('Films, halls, showings and bookings (in-memory storage)')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Server: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/docs`);
}
void bootstrap();
