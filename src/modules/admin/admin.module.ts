// NestJS Modules and Libraries
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Internal Modules
import { UserModule } from '@modules/user/user.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { OtpService } from '@modules/auth/otp/otp.service';
import { AuthService } from '@modules/auth/auth.service';
import { RoleService } from '@modules/role/role.service';
import { TokenService } from '@modules/token/token.service';
import { SectionService } from '@modules/section/section.service';
import { PermissionService } from '@modules/permission/permission.service';

// Entities
import { Admin } from './entities/admin.entity';
import { Otp } from '@modules/auth/otp/entities/otp.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { Section } from '@modules/section/entities/section.entity';
import { Permission } from '@modules/permission/entities/permission.entity';

// External Services
import { Twilio } from 'twilio';
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
        UserModule,
        PassportModule,

        TypeOrmModule.forFeature([Admin, Otp, Role, Tokens, Section, Permission, DeviceInformation]),
    ],
    controllers: [AdminController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        AdminService,
        OtpService,
        AuthService,
        JwtService,
        RoleService,
        Twilio,
        EmailService,
        GmailService,
        SendGridService,
        TokenService,
        SectionService,
        DeviceInformationService,
        PermissionService,
    ],
    exports: [AdminService],
})
export class AdminModule {}
