import { Controller, Post, Body } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Post('scrape')
    async scrapeUrls(@Body() urls: string[]): Promise<Record<string, string>> {
        return await this.scraperService.scrapeTextFromUrls(urls);
    }
}
