import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SummarizationService } from './summarization.service';

@Controller('summarize')
export class SummarizationController {
    constructor(private readonly summarizationService: SummarizationService) {}

    @Post()
    async summarize(@Body('content') content: string): Promise<{ summary: string }> {
        if (!content) {
            throw new HttpException('Content is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const summary = await this.summarizationService.summarizeContent(content);
            return { summary };
        } catch (error) {
            throw new HttpException('Error summarizing content', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
