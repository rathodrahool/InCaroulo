import { Injectable } from '@nestjs/common';
import { ScraperService } from '../scraper/scraper.service';
import { SummarizationService } from '../summarization/summarization.service';
import { ProcessDataDto } from './dto/process-data-dto';

@Injectable()
export class DashboardService {
    constructor(
        private readonly scraperService: ScraperService,
        private readonly summarizationService: SummarizationService,
    ) {}

    async process(data: ProcessDataDto) {
        return await this.summarizationService.summarizeContent(data);
    }
}
