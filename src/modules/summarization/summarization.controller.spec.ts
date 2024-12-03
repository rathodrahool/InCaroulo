import { Test, TestingModule } from '@nestjs/testing';
import { SummarizationController } from './summarization.controller';
import { SummarizationService } from './summarization.service';

describe('SummarizationController', () => {
    let controller: SummarizationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SummarizationController],
            providers: [SummarizationService],
        }).compile();

        controller = module.get<SummarizationController>(SummarizationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
