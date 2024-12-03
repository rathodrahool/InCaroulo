import { Module } from '@nestjs/common';
import { SummarizationService } from './summarization.service';
import { SummarizationController } from './summarization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapedData } from '../scraper/entities/scraper.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ScrapedData])],
    controllers: [SummarizationController],
    providers: [SummarizationService],
})
export class SummarizationModule {}
