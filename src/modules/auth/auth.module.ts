// NestJS common modules and utilities
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

// Related modules and services
import { UserModule } from '@modules/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp/otp.service';
import { RoleService } from '@modules/role/role.service';
import { TokenService } from '@modules/token/token.service';
import { SectionService } from '@modules/section/section.service';
import { PermissionService } from '@modules/permission/permission.service';

// Entities
import { Otp } from './otp/entities/otp.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { Section } from '@modules/section/entities/section.entity';
import { Permission } from '@modules/permission/entities/permission.entity';

// External services and libraries
import { EmailService } from '@shared/services/mail/mail.service';
import { GmailService } from '@shared/services/mail/gmail.service';
import { SendGridService } from '@shared/services/mail/sendgrid.service';
import { Twilio } from 'twilio';
import { DeviceInformation } from './device-information/entities/device.information.entity';
import { DeviceInformationService } from './device-information/device.information.service';
import { DeviceInformationMiddleware } from '@middlewares/header.middleware';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.secret'),
            }),
            inject: [ConfigService],
        }),
        UserModule,
        PassportModule,
        TypeOrmModule.forFeature([Otp, Tokens, Section, Permission, DeviceInformation]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        OtpService,
        JwtService,
        EmailService,
        GmailService,
        SendGridService,
        TokenService,
        Twilio,
        RoleService,
        TokenService,
        SectionService,
        PermissionService,
        DeviceInformationService,
    ],
    exports: [AuthService],
})
export class AuthModule {
    configure(consumer: MiddlewareConsumer) {
        // consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'auth/signup', method: RequestMethod.POST });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'auth/verify-signup/:uid', method: RequestMethod.GET });
        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'auth/login', method: RequestMethod.POST });
        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'auth/verify-otp', method: RequestMethod.POST });

        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'auth/forgot-password', method: RequestMethod.POST });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'auth/reset-password/:uid', method: RequestMethod.POST });
        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'auth/logout', method: RequestMethod.GET });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'auth/google/login', method: RequestMethod.POST });
        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'auth/apple/login', method: RequestMethod.POST });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'auth/phone/signup', method: RequestMethod.POST });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'auth/phone-signup/verify-otp', method: RequestMethod.POST });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'auth/phone-login/verify-otp', method: RequestMethod.POST });
        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'auth/phone/login', method: RequestMethod.POST });
    }
}
