import { Module } from '@nestjs/common';
import { DropdownService } from './dropdown.service';
import { DropdownController } from './dropdown.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from '@shared/entities/country.entity';
import { UserService } from '@modules/user/user.service';
import { User } from '@modules/user/entities/user.entity';
import { OtpService } from '@modules/auth/otp/otp.service';
import { EmailService } from '@shared/services/mail/mail.service';
import { Otp } from '@modules/auth/otp/entities/otp.entity';
import { Twilio } from 'twilio';
import { BullModule } from '@nestjs/bull';
import { GmailService } from '@shared/services/mail/gmail.service';
import { SendGridService } from '@shared/services/mail/sendgrid.service';
import { AdminService } from '@modules/admin/admin.service';
import { Admin } from '@modules/admin/entities/admin.entity';
import { RoleService } from '@modules/role/role.service';
import { AuthService } from '@modules/auth/auth.service';
import { TokenService } from '@modules/token/token.service';
import { Role } from '@modules/role/entities/role.entity';
import { SectionService } from '@modules/section/section.service';
import { Section } from '@modules/section/entities/section.entity';
import { PermissionService } from '@modules/permission/permission.service';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';
import { DeviceInformationService } from '@modules/auth/device-information/device.information.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
        TypeOrmModule.forFeature([
            Country,
            User,
            Otp,
            Admin,
            Role,
            Section,
            RoleSectionPermission,
            Tokens,
            Permission,
            DeviceInformation,
        ]),
    ],
    controllers: [DropdownController],
    providers: [
        DropdownService,
        UserService,
        OtpService,
        EmailService,
        Twilio,
        GmailService,
        SendGridService,
        AdminService,
        RoleService,
        AuthService,
        TokenService,
        SectionService,
        PermissionService,
        JwtService,
        DeviceInformationService,
    ],
})
export class DropdownModule {}
