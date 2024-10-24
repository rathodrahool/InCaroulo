import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RoleService } from '@modules/role/role.service';
import { Role } from '@modules/role/entities/role.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { OtpService } from '@modules/auth/otp/otp.service';
import { Otp } from '@modules/auth/otp/entities/otp.entity';
import { Twilio } from 'twilio';
import { EmailService } from '@shared/services/mail/mail.service';
import { GmailService } from '@shared/services/mail/gmail.service';
import { BullModule } from '@nestjs/bull';
import { SendGridService } from '@shared/services/mail/sendgrid.service';
import { TokenService } from '@modules/token/token.service';
import { SectionService } from '@modules/section/section.service';
import { PermissionService } from '@modules/permission/permission.service';
import { Section } from '@modules/section/entities/section.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import { DeviceInformationService } from '@modules/auth/device-information/device.information.service';
import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';
import { DeviceInformationMiddleware } from '@middlewares/header.middleware';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
        TypeOrmModule.forFeature([
            User,
            Role,
            RoleSectionPermission,
            Tokens,
            Otp,
            Section,
            Permission,
            DeviceInformation,
        ]),
    ],
    controllers: [UserController],
    providers: [
        DeviceInformationService,
        UserService,
        RoleService,
        OtpService,
        Twilio,
        EmailService,
        GmailService,
        SendGridService,
        TokenService,
        SectionService,
        PermissionService,
    ],
    exports: [UserService, TypeOrmModule],
})
export class UserModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'users/profile', method: RequestMethod.GET });

        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'users/profile', method: RequestMethod.PATCH });

        consumer.apply(DeviceInformationMiddleware).forRoutes({ path: 'users/profile', method: RequestMethod.DELETE });

        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'users/profile/change-phone', method: RequestMethod.GET });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'users/profile/change-phone/verify-otp', method: RequestMethod.PATCH });

        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'users/profile/change-email', method: RequestMethod.GET });
        consumer
            .apply(DeviceInformationMiddleware)
            .forRoutes({ path: 'users/profile/change-email/verify-otp', method: RequestMethod.PATCH });
    }
}
