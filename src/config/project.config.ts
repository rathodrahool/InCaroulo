import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as basicAuth from 'express-basic-auth';
import * as session from 'express-session'; // Import express-session
import * as flash from 'connect-flash'; // Import connect-flash
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import Redis from 'ioredis';
import { HttpExceptionFilter } from '@filters/http-exception';
import { join } from 'path';

export function configureGlobalPrefix(app: NestExpressApplication) {
    app.setGlobalPrefix('api/v1');
}

export function configureGlobalFilters(app: NestExpressApplication) {
    app.useGlobalFilters(new HttpExceptionFilter());
}

export function configureSecurity(app: NestExpressApplication) {
    app.use(helmet({ contentSecurityPolicy: false }));
}

export function configureSwagger(app: NestExpressApplication) {
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Node Skeleton')
        .setDescription(
            'A boilerplate project for a Node.js application using NestJS, pre-configured for rapid development with best practices.',
        )
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth',
        )
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // Basic authentication for Swagger
    app.use(
        ['/api-docs', '/api-docs-json'],
        basicAuth({
            users: { admin: process.env.SWAGGER_PASSWORD },
            challenge: true,
        }),
    );
    SwaggerModule.setup('api-docs', app, document);
}

export function configureCors(app: NestExpressApplication) {
    app.enableCors({
        origin: 'https://example.com', // Modify this as needed
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        allowedHeaders: 'Content-Type, Authorization',
    });
}

export async function startApplication(app: NestExpressApplication) {
    const configService = app.get(ConfigService);

    // Set up Handlebars as the view engine
    app.setViewEngine('hbs');

    // Set the base views directory relative to the project root
    app.setBaseViewsDir(join(process.cwd(), 'views', 'UI'));
    app.useStaticAssets(join(process.cwd(), 'public'));

    // Configure session and flash

    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'your-secret-key',
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 60000,
                secure: process.env.NODE_ENV === 'production',
            },
        }),
    );

    // Enable flash messages
    app.use(flash());
    // Enable flash messages
    app.use(flash());

    // Start the app on the configured port
    const port = configService.get('port');
    await app.listen(port);
}

export async function checkRedis() {
    const redis = new Redis();
    try {
        await redis.ping();
    } catch (err) {
        throw new Error('Redis is not available. Please ensure Redis is running.');
    }
}
