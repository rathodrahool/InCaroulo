import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Response } from 'express';
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { HttpStatus } from '@nestjs/common';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create.section.dto';
import { Section } from './entities/section.entity';
import { UpdateSectionDto } from './dto/update.section.dto';
import { LIMIT, OFFSET } from '@root/src/shared/constants/constant';
import { FindAllQuery } from '@root/src/shared/interfaces/interfaces';

describe('SectionController', () => {
    let controller: SectionController;
    let sectionService: SectionService;
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SectionController],
            providers: [
                {
                    provide: SectionService,
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                        findAllSection: jest.fn(),
                        findOneSection: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<SectionController>(SectionController);
        sectionService = module.get<SectionService>(SectionService);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('create', () => {
        it('should create section successfully', async () => {
            const createSectionDto = new CreateSectionDto();
            sectionService.createSection = jest.fn().mockResolvedValue(undefined);

            await controller.create(createSectionDto, mockResponse as Response);

            expect(sectionService.createSection).toHaveBeenCalledWith(createSectionDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_CREATED('Section'),
            });
        });
    });

    describe('findOne', () => {
        it('should return a specific section by id', async () => {
            const mockResult = { id: '1', section_name: 'Section 1' } as Section;

            (sectionService.findOneSection as jest.Mock).mockResolvedValue(mockResult);

            await controller.findOne('1', mockResponse as Response);

            expect(sectionService.findOneSection).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_FOUND('Section'),
                data: mockResult,
            });
        });
    });
    describe('findAll', () => {
        it('should return all section with default pagination', async () => {
            const mockResult = {
                total: 1,
                limit: LIMIT,
                offset: OFFSET,
                data: [new Section()],
            };

            (sectionService.findAllSection as jest.Mock).mockResolvedValue(mockResult);
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: undefined,
                order: { created_at: 'ASC' },
            };

            await controller.findAll(query, mockResponse as Response);

            expect(sectionService.findAllSection).toHaveBeenCalledWith(+LIMIT, +OFFSET, undefined, {
                created_at: 'ASC',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: LIMIT,
                offset: OFFSET,
                message: SUCCESS.RECORD_FOUND('Sections'),
                data: mockResult.data,
            });
        });

        it('should return paginated sections when limit and offset are provided', async () => {
            const mockResult = {
                total: 5,
                limit: 2,
                offset: 0,
                data: [new Section(), new Section(), new Section(), new Section(), new Section()],
            };
            const query: FindAllQuery = {
                limit: 2,
                offset: 0,
                search: undefined,
                order: { created_at: 'ASC' },
            };

            sectionService.findAllSection = jest.fn().mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(sectionService.findAllSection).toHaveBeenCalledWith(query.limit, query.offset, undefined, {
                created_at: 'ASC',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: query.limit,
                offset: query.offset,
                message: SUCCESS.RECORD_FOUND('Sections'),
                data: mockResult.data,
            });
        });

        it('should return sections based on search query', async () => {
            const mockResult = {
                total: 1,
                limit: +LIMIT,
                offset: +OFFSET,
                data: [new Section(), new Section()],
            };
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: 'admin',
                order: { created_at: 'ASC' },
            };

            (sectionService.findAllSection as jest.Mock).mockResolvedValue(mockResult);
            await controller.findAll(query, mockResponse as Response);

            expect(sectionService.findAllSection).toHaveBeenCalledWith(query.limit, query.offset, query.search, {
                created_at: 'ASC',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: SUCCESS.RECORD_FOUND('Sections'),
                data: mockResult.data,
            });
        });

        it('should return sections sorted by order', async () => {
            const mockResult = {
                total: 3,
                limit: LIMIT,
                offset: OFFSET,
                data: [new Section(), new Section(), new Section()],
            };
            const order = { section_name: 'DESC' };
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: undefined,
                order: { section_name: 'DESC' },
            };

            (sectionService.findAllSection as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(sectionService.findAllSection).toHaveBeenCalledWith(+LIMIT, +OFFSET, undefined, order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: LIMIT,
                offset: OFFSET,
                message: SUCCESS.RECORD_FOUND('Sections'),
                data: mockResult.data,
            });
        });

        it('should return no results when no sections match the query', async () => {
            const mockResult = {
                total: 0,
                limit: LIMIT,
                offset: OFFSET,
                data: [],
            };
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: 'nonexistent',
                order: { created_at: 'ASC' },
            };
            (sectionService.findAllSection as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(sectionService.findAllSection).toHaveBeenCalledWith(+LIMIT, +OFFSET, 'nonexistent', {
                created_at: 'ASC',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: LIMIT,
                offset: OFFSET,
                message: ERROR.NO_RESULT_FOUND,
                data: mockResult.data,
            });
        });

        it('should handle unexpected errors from the service gracefully', async () => {
            (sectionService.findAllSection as jest.Mock).mockRejectedValue(new Error('Unexpected Error'));
            const query: FindAllQuery = {
                limit: undefined,
                offset: undefined,
                search: undefined,
                order: undefined,
            };
            await expect(controller.findAll(query, mockResponse as Response)).rejects.toThrow('Unexpected Error');
        });
    });
    describe('update', () => {
        it('should update a section successfully', async () => {
            const updateSectionDto: UpdateSectionDto = {
                section_name: 'Updated Section',
            };

            sectionService.updateSection = jest.fn().mockResolvedValue(true);

            await controller.update('1', updateSectionDto, mockResponse as Response);

            expect(sectionService.updateSection).toHaveBeenCalledWith('1', updateSectionDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_UPDATED('Section'),
            });
        });

        it('should return not found when the section does not exist', async () => {
            sectionService.updateSection = jest.fn().mockResolvedValue(false);

            await controller.update('1', {}, mockResponse as Response);

            expect(sectionService.updateSection).toHaveBeenCalledWith('1', {});
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_NOT_FOUND('Section'),
            });
        });
    });

    describe('remove', () => {
        it('should delete a section successfully', async () => {
            sectionService.deleteSection = jest.fn().mockResolvedValue(true);

            await controller.remove('1', mockResponse as Response);

            expect(sectionService.deleteSection).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_DELETED('Section'),
            });
        });
    });
});
