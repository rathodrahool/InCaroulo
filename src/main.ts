import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
    configureGlobalPrefix,
    configureGlobalFilters,
    configureSecurity,
    configureSwagger,
    configureCors,
    startApplication,
    checkRedis,
} from '@config/project.config';
import { GlobalTrimInterceptor } from './core/intercetor/space.trim.interceptor';

async function bootstrap() {
    await checkRedis();

    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Apply configurations
    configureGlobalPrefix(app);
    configureGlobalFilters(app);
    configureSecurity(app);
    configureSwagger(app);
    configureCors(app);
    app.useGlobalInterceptors(new GlobalTrimInterceptor());

    // Start the application
    await startApplication(app);
}

bootstrap();
