import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './mail.service';
import { Job } from 'bull';
import { MailOptions } from '@shared/interfaces/interfaces';
import { EmailProcessor } from './email.processor.service';

describe('EmailProcessor', () => {
    let emailProcessor: EmailProcessor;
    let emailService: EmailService;

    const mockEmailService = {
        sendMail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailProcessor,
                {
                    provide: EmailService,
                    useValue: mockEmailService,
                },
            ],
        }).compile();

        emailProcessor = module.get<EmailProcessor>(EmailProcessor);
        emailService = module.get<EmailService>(EmailService);
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test to avoid side effects
    });

    describe('handleSendMail', () => {
        const mailOptions: MailOptions = {
            to: 'mailto:test@example.com',
            subject: 'Test Subject',
            text: 'Test email body',
        };

        let mockJob: Job<MailOptions>;

        beforeEach(() => {
            mockJob = {
                data: mailOptions,
            } as Job<MailOptions>;
        });

        it('should call emailService.sendMail with the correct data on successful execution', async () => {
            mockEmailService.sendMail.mockResolvedValueOnce(null); // Mock successful email send

            await emailProcessor.handleSendMail(mockJob);

            expect(emailService.sendMail).toHaveBeenCalledWith(mailOptions);
            expect(emailService.sendMail).toHaveBeenCalledTimes(1);
        });

        it('should handle error if emailService.sendMail throws an error', async () => {
            const mockError = new Error('Failed to send email');
            mockEmailService.sendMail.mockRejectedValueOnce(mockError); // Mock email sending failure

            await expect(emailProcessor.handleSendMail(mockJob)).rejects.toThrow(mockError);

            expect(emailService.sendMail).toHaveBeenCalledWith(mailOptions);
            expect(emailService.sendMail).toHaveBeenCalledTimes(1);
        });
    });
});
