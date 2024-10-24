import { Transporter, createTransport } from 'nodemailer';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { MailOptions } from '@shared/interfaces/interfaces';

@Injectable()
export class GmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = createTransport({
            service: process.env.GMAIL_SERVICE,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });
    }

    async sendMail(mailOptions: MailOptions) {
        if (!mailOptions?.from) {
            const fromEmail = process.env.SMTP_FROM;
            Object.assign(mailOptions, { from: `setup project <${fromEmail}>` });
        }

        this.transporter.sendMail(mailOptions, (err: Error | null) => {
            if (err) {
                throw new Error(err.message);
            } else {
                this.handleAttachments(mailOptions.attachments);
            }
        });
    }

    private handleAttachments(attachments?: MailOptions['attachments']) {
        if (attachments) {
            attachments.forEach((element) => {
                if (element.path) {
                    fs.unlinkSync(path.join('public', path.basename(element.path)));
                } else {
                    throw new Error(`Attachment path not found: ${element.filename}`);
                }
            });
        }
    }
}
