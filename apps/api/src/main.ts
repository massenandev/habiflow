import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpErrorFilter } from "./presentation/http-error.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? "*" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpErrorFilter());

  const config = new DocumentBuilder()
    .setTitle("Habiflow API")
    .setDescription("REST API for Habiflow habits, completions, streaks, and history.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .addTag("auth")
    .addTag("health")
    .addTag("habits")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
