import { Controller, HttpException, HttpStatus, Get } from '@nestjs/common';
import { SummarizationService } from './summarization.service';

@Controller('summarize')
export class SummarizationController {
    constructor(private readonly summarizationService: SummarizationService) {}

    // @Get()
    // async summarize(): Promise<{ summary: string }> {
    //     try {
    //         const summary = await this.summarizationService.summarizeContent();
    //         return { summary };
    //     } catch (error) {
    //         throw new HttpException('Error summarizing content', HttpStatus.INTERNAL_SERVER_ERROR);
    //     }
    // }
}
