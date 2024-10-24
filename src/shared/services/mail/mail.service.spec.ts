import { Test, TestingModule } from '@nestjs/testing';
import { GmailService } from './gmail.service';
import { MailOptions } from '@shared/interfaces/interfaces';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('nodemailer');
jest.mock('fs');
jest.mock('path');

describe('GmailService', () => {
    let gmailService: GmailService;
    let mockTransporter: nodemailer.Transporter;

    const mockMailOptions: MailOptions = {
        to: 'mailto:test@example.com',
        subject: 'Test Subject',
        text: 'Test email body',
        attachments: [{ filename: 'file.txt', path: '/tmp/file.txt' }],
    };

    beforeEach(async () => {
        mockTransporter = {
            sendMail: jest.fn(),
        } as unknown as nodemailer.Transporter;

        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

        const module: TestingModule = await Test.createTestingModule({
            providers: [GmailService],
        }).compile();

        gmailService = module.get<GmailService>(GmailService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendMail', () => {
        it('should send mail using transporter with correct mail options', async () => {
            mockTransporter.sendMail = jest.fn().mockImplementation((mailOptions, callback) => callback(null));

            await gmailService.sendMail(mockMailOptions);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(mockMailOptions, expect.any(Function));
            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
        });

        it('should handle error if transporter fails to send mail', async () => {
            const mockError = new Error('Failed to send email');
            mockTransporter.sendMail = jest.fn().mockImplementation((mailOptions, callback) => callback(mockError));

            await expect(gmailService.sendMail(mockMailOptions)).rejects.toThrow(mockError);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(mockMailOptions, expect.any(Function));
        });

        it('should assign from email if not provided in mail options', async () => {
            const mailOptionsWithoutFrom = { ...mockMailOptions, from: undefined };
            const fromEmail = 'mailto:setup@example.com';
            process.env.SMTP_FROM = fromEmail;

            mockTransporter.sendMail = jest.fn().mockImplementation((mailOptions, callback) => callback(null));

            await gmailService.sendMail(mailOptionsWithoutFrom);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({ from: `setup project <${fromEmail}>` }),
                expect.any(Function),
            );
        });
    });

    describe('handleAttachments', () => {
        it('should delete attachment files after sending mail', async () => {
            mockTransporter.sendMail = jest.fn().mockImplementation((mailOptions, callback) => callback(null));

            await gmailService.sendMail(mockMailOptions);

            const filePath = path.join('public', path.basename(mockMailOptions.attachments[0].path));
            expect(fs.unlinkSync).toHaveBeenCalledWith(filePath);
        });

        it('should throw an error if attachment path is missing', async () => {
            const invalidMailOptions = {
                ...mockMailOptions,
                attachments: [{ filename: 'file.txt', path: undefined }],
            };

            mockTransporter.sendMail = jest.fn().mockImplementation((mailOptions, callback) => callback(null));

            await expect(gmailService.sendMail(invalidMailOptions)).rejects.toThrow(
                `Attachment path not found: ${invalidMailOptions.attachments[0].filename}`,
            );
        });
    });
});
