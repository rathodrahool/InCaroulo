// NestJS core modules
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
// import { APP_GUARD } from '@nestjs/core';

// Configuration files
import configuration from '@config/env/env.configuration';
import { validationSchema } from '@config/env/env.validation';
import { DatabaseModule } from '@config/database/database.configuration';

// Application modules
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminModule } from '@modules/admin/admin.module';
import { RoleModule } from '@modules/role/role.module';
import { PermissionModule } from '@modules/permission/permission.module';
import { SectionModule } from '@modules/section/section.module';

// Middleware
import { SetIpMiddleware } from '@middlewares/setip.middlewere';

// Guards
//import { TokenGuard } from './guards/token.guard';

// Email services
import { EmailProcessor } from '@shared/services/mail/email.processor.service';
import { SendGridService } from '@shared/services/mail/sendgrid.service';
import { GmailService } from '@shared/services/mail/gmail.service';
import { EmailService } from '@shared/services/mail/mail.service';

// Common constants and enums
import { THROTTLER_TTL, THROTTLER_LIMIT } from '@shared/constants/constant';
import { join } from 'path';

import { DropdownModule } from '@modules/dropdown/dropdown.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ConfigModule.forRoot({
            envFilePath: `.env.${process.env.NODE_ENV}`,
            load: [configuration],
            validationSchema: validationSchema,
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot([
            { name: 'low', ttl: THROTTLER_TTL, limit: THROTTLER_LIMIT },
            { name: 'medium', ttl: THROTTLER_TTL, limit: THROTTLER_LIMIT },
            { name: 'high', ttl: THROTTLER_TTL, limit: THROTTLER_LIMIT },
        ]),

        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get('redis.host'),
                    port: configService.get('redis.port'),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'email',
        }),
        DatabaseModule,
        UserModule,
        AuthModule,
        AdminModule,
        RoleModule,
        SectionModule,
        PermissionModule,
        DropdownModule,
    ],
    controllers: [],
    providers: [
        EmailService,
        GmailService,
        SendGridService,
        EmailProcessor,
        // static token apply globally
        // {
        //     provide: APP_GUARD,
        //     useClass: TokenGuard,
        // },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(SetIpMiddleware).forRoutes('*');
    }
}
