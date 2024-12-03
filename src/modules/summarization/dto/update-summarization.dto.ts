import { PartialType } from '@nestjs/swagger';
import { CreateSummarizationDto } from './create-summarization.dto';

export class UpdateSummarizationDto extends PartialType(CreateSummarizationDto) {}
