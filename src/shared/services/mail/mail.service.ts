import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { GmailService } from './gmail.service';
import { renderFile } from 'ejs';
import { join } from 'path';

import { User } from '@modules/user/entities/user.entity';
import { MailOptions } from '@shared/interfaces/interfaces';
import { SendGridService } from './sendgrid.service';
import { AuthEndpoints, MailProvider } from '@shared/constants/enum';
import { EMAIL } from '@shared/constants/messages';

@Injectable()
export class EmailService {
    private emailProvider: string;

    constructor(
        @InjectQueue('email') private emailQueue: Queue,
        private gmailService: GmailService,
        private sendGridService: SendGridService,
    ) {
        this.emailProvider = process.env.EMAIL_PROVIDER;
    }

    async sendMail(mailOptions: MailOptions) {
        if (this.emailProvider === MailProvider.GMAIL) {
            await this.gmailService.sendMail(mailOptions);
        } else if (this.emailProvider === MailProvider.SENDGRID) {
            await this.sendGridService.sendMail(mailOptions);
        } else {
            throw new Error('Unsupported email provider');
        }
    }

    async renderTemplate(templateName: string, data: object): Promise<string> {
        const templatePath = join(process.cwd(), 'views', 'email-templates', `${templateName}.ejs`);
        return new Promise<string>((resolve, reject) => {
            renderFile(templatePath, data, (err, str) => {
                if (err) {
                    return reject(err);
                }
                resolve(str);
            });
        });
    }

    async sendOtpEmail(user: User, otp: number, expireAt: number): Promise<void> {
        const name = user.full_name;

        const html = await this.renderTemplate('verification-otp', {
            name,
            otp,
            expireAt,
        });

        const mailOptions = {
            to: user.email,
            subject: EMAIL.VERIFICATION_OTP_SUBJECT,
            html,
        };
        await this.emailQueue.add('sendMail', mailOptions);
    }

    async sendPasswordResetLink(entity: User, uid: string, expireAt: number): Promise<void> {
        const resetLink = `${process.env.CLIENT_URL}${uid}`;
        const name = entity.full_name;
        const html = await this.renderTemplate('update-password-link', {
            name,
            resetLink,
            expireAt,
        });

        const mailOptions = {
            to: entity.email,
            subject: EMAIL.PASSWORD_RESET_SUBJECT,
            html,
        };

        await this.emailQueue.add('sendMail', mailOptions);
    }

    async sendAccountVerificationLink(entity: User, uid: string, expireAt: number): Promise<void> {
        const verificationLink = `${AuthEndpoints.VerifySignup}${uid}`;
        const name = entity.full_name;
        const html = await this.renderTemplate('account-verification-link', {
            name,
            verificationLink,
            expireAt,
        });

        const mailOptions = {
            to: entity.email,
            subject: EMAIL.ACCOUNT_VERIFICATION_SUBJECT,
            html,
        };

        await this.emailQueue.add('sendMail', mailOptions);
    }
}
