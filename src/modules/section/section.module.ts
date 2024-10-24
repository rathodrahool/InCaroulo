// NestJS core and third-party modules
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtService } from '@nestjs/jwt';
import { Twilio } from 'twilio';

// Services and Controllers
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { UserService } from '@modules/user/user.service';
import { AdminService } from '@modules/admin/admin.service';
import { TokenService } from '@modules/token/token.service';
import { RoleService } from '@modules/role/role.service';
import { AuthService } from '@modules/auth/auth.service';
import { OtpService } from '@modules/auth/otp/otp.service';
import { PermissionService } from '@modules/permission/permission.service';
import { EmailService } from '@shared/services/mail/mail.service';
import { GmailService } from '@shared/services/mail/gmail.service';
import { DeviceInformationService } from '@modules/auth/device-information/device.information.service';
import { SendGridService } from '@shared/services/mail/sendgrid.service';

// Entities
import { Section } from './entities/section.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { User } from '@modules/user/entities/user.entity';
import { Admin } from '@modules/admin/entities/admin.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Otp } from '@modules/auth/otp/entities/otp.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';
@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
        TypeOrmModule.forFeature([
            Section,
            RoleSectionPermission,
            User,
            Admin,
            Tokens,
            Role,
            Otp,
            Permission,
            DeviceInformation,
        ]),
    ],
    controllers: [SectionController],
    providers: [
        SectionService,
        UserService,
        AdminService,
        JwtService,
        TokenService,
        RoleService,
        AuthService,
        OtpService,
        EmailService,
        Twilio,
        GmailService,
        SendGridService,
        PermissionService,
        DeviceInformationService,
    ],
})
export class SectionModule {}
