import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapedData } from './entities/scraper.entity';

@Injectable()
export class ScraperService {
    constructor(
        @InjectRepository(ScrapedData)
        private scrapedDataRepository: Repository<ScrapedData>,
    ) {}

    // Scrape and store meaningful data from multiple URLs
    async scrapeTextFromUrls(urls: string[]): Promise<Record<string, string>> {
        const result: Record<string, string> = {};
        for (const url of urls) {
            try {
                const scrapedData = await this.scrapeTextFromUrl(url);
                await this.saveScrapedData(url, scrapedData);
                result[url] = scrapedData;
            } catch (error) {
                result[url] = 'Error scraping the URL';
            }
        }

        return result;
    }
    // Scrape meaningful text content from a single URL
    private async scrapeTextFromUrl(url: string): Promise<string> {
        try {
            console.log('this is working');
            const response = await axios.get(url);
            console.log(response);
            const $ = cheerio.load(response.data);
            let scrapedText = '';
            const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span'];
            textTags.forEach((tag) => {
                $(tag).each((_, element) => {
                    const text = $(element).text().trim();
                    if (text) {
                        scrapedText += text + '\n';
                    }
                });
            });
            return scrapedText.trim();
        } catch (error) {
            throw new HttpException('Failed to scrape URL', HttpStatus.BAD_REQUEST);
        }
    }

    // Save scraped data into PostgreSQL
    private async saveScrapedData(url: string, content: string): Promise<void> {
        const scrapedData = new ScrapedData();
        scrapedData.url = url;
        scrapedData.content = content;
        await this.scrapedDataRepository.save(scrapedData);
    }
}
