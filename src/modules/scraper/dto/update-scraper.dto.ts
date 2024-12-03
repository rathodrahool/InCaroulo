import { PartialType } from '@nestjs/swagger';
import { CreateScraperDto } from './create-scraper.dto';

export class UpdateScraperDto extends PartialType(CreateScraperDto) {}
