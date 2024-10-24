// NestJS core and third-party modules
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtService } from '@nestjs/jwt';
import { Twilio } from 'twilio';

// Services and Controllers
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { SectionService } from '@modules/section/section.service';
import { PermissionService } from '@modules/permission/permission.service';
import { UserService } from '@modules/user/user.service';
import { AdminService } from '@modules/admin/admin.service';
import { TokenService } from '@modules/token/token.service';
import { AuthService } from '@modules/auth/auth.service';
import { OtpService } from '@modules/auth/otp/otp.service';
import { DeviceInformationService } from '@modules/auth/device-information/device.information.service';

// Entities
import { Role } from './entities/role.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { Section } from '@modules/section/entities/section.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import { User } from '@modules/user/entities/user.entity';
import { Admin } from '@modules/admin/entities/admin.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { Otp } from '@modules/auth/otp/entities/otp.entity';

// External services
import { EmailService } from '@shared/services/mail/mail.service';
import { GmailService } from '@shared/services/mail/gmail.service';
import { SendGridService } from '@shared/services/mail/sendgrid.service';
import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
        TypeOrmModule.forFeature([
            Role,
            Section,
            Permission,
            RoleSectionPermission,
            User,
            Admin,
            Tokens,
            Otp,
            DeviceInformation,
        ]),
    ],
    controllers: [RoleController],
    providers: [
        RoleService,
        SectionService,
        PermissionService,
        UserService,
        AdminService,
        JwtService,
        TokenService,
        AuthService,
        OtpService,
        EmailService,
        Twilio,
        GmailService,
        SendGridService,
        DeviceInformationService,
    ],
})
export class RoleModule {}
