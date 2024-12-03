import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapedData } from './entities/scraper.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ScrapedData])],
    providers: [ScraperService],
    controllers: [ScraperController],
})
export class ScraperModule {}
