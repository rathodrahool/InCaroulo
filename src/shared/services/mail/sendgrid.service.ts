import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { MailOptions } from '@shared/interfaces/interfaces';

@Injectable()
export class SendGridService {
    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    async sendMail(mailOptions: MailOptions) {
        const msg = {
            to: mailOptions.to,
            from: mailOptions.from,
            subject: mailOptions.subject,
            templateId: 'd-ced5e7f87a2540238871e3816d329b2a',
            dynamic_template_data: mailOptions.dynamicTemplateData,
            attachments: mailOptions.attachments?.map((att) => ({
                filename: att.filename || 'attachment',
                content: att.content?.toString('base64'),
                path: att.path,
                href: att.href,
                type: att.contentType,
            })),
        };

        try {
            await sgMail.send(msg);
            this.handleAttachments(mailOptions.attachments);
        } catch (error) {
            throw new Error(error);
        }
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
