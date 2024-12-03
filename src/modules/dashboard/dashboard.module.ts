import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapedData } from '../scraper/entities/scraper.entity';
import { ScraperService } from '../scraper/scraper.service';
import { SummarizationService } from '../summarization/summarization.service';

@Module({
    imports: [TypeOrmModule.forFeature([ScrapedData])],
    controllers: [DashboardController],
    providers: [DashboardService, ScraperService, SummarizationService],
})
export class DashboardModule {}
