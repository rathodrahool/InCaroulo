import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from './mail.service';
import { MailOptions } from '@shared/interfaces/interfaces';

@Processor('email')
export class EmailProcessor {
    constructor(private readonly emailService: EmailService) {}

    @Process('sendMail')
    async handleSendMail(job: Job<MailOptions>) {
        await this.emailService.sendMail(job.data);
    }
}
