// NestJS core and third-party modules
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtService } from '@nestjs/jwt';
import { Twilio } from 'twilio';

// Services and Controllers
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { UserService } from '@modules/user/user.service';
import { AdminService } from '@modules/admin/admin.service';
import { TokenService } from '@modules/token/token.service';
import { AuthService } from '@modules/auth/auth.service';
import { OtpService } from '@modules/auth/otp/otp.service';
import { RoleService } from '@modules/role/role.service';
import { SectionService } from '@modules/section/section.service';

// Entities
import { Permission } from './entities/permission.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { User } from '@modules/user/entities/user.entity';
import { Admin } from '@modules/admin/entities/admin.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { Otp } from '@modules/auth/otp/entities/otp.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Section } from '@modules/section/entities/section.entity';

// External services
import { EmailService } from '@shared/services/mail/mail.service';
import { GmailService } from '@shared/services/mail/gmail.service';
import { SendGridService } from '@shared/services/mail/sendgrid.service';

import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';
import { DeviceInformationService } from '@modules/auth/device-information/device.information.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
        TypeOrmModule.forFeature([
            Permission,
            RoleSectionPermission,
            User,
            Admin,
            Tokens,
            Otp,
            Role,
            Section,
            DeviceInformation,
        ]),
    ],
    controllers: [PermissionController],
    providers: [
        PermissionService,
        UserService,
        AdminService,
        TokenService,
        JwtService,
        AuthService,
        OtpService,
        EmailService,
        Twilio,
        RoleService,
        GmailService,
        SendGridService,
        SectionService,
        DeviceInformationService,
    ],
})
export class PermissionModule {}
