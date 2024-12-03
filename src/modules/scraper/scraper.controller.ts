// scraper.controller.ts
import { Controller, Post, Body, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
@UseInterceptors(ClassSerializerInterceptor)
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Post('scrape')
    async scrapeUrls(@Body() payload: { urls: string[] }): Promise<Record<string, string>> {
        // Explicitly destructure urls from the payload
        const { urls } = payload;

        // Validate that urls is an array
        if (!Array.isArray(urls)) {
            throw new Error('URLs must be provided as an array');
        }

        return await this.scraperService.scrapeTextFromUrls(urls);
    }
}
