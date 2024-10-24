import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, IsNull } from 'typeorm';
import { SectionService } from '@modules/section/section.service';
import { Section } from './entities/section.entity';
import { CreateSectionDto } from './dto/create.section.dto';
import { plainToInstance } from 'class-transformer';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ERROR, SUCCESS } from '@root/src/shared/constants/messages';
import { UpdateSectionDto } from './dto/update.section.dto';

describe('SectionService', () => {
    let service: SectionService;
    const mockSectionRepository = {
        findOneWhere: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        count: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SectionService,
                {
                    provide: getRepositoryToken(Section),
                    useValue: mockSectionRepository,
                },
            ],
        }).compile();

        service = module.get<SectionService>(SectionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const createSectionDto: CreateSectionDto = {
            section_name: 'New Section',
        };

        const savedSection = {
            id: '1',
            section_name: 'New Section',
        };

        it('should create and return a section', async () => {
            mockSectionRepository.save.mockResolvedValue(savedSection);

            const result = await service.create(createSectionDto);

            expect(mockSectionRepository.save).toHaveBeenCalledWith(createSectionDto);
            expect(result).toEqual(expect.objectContaining(savedSection));
        });
    });
    describe('findAll', () => {
        it('should return a list of sections', async () => {
            const mockSections = [new Section(), new Section()];
            mockSectionRepository.find.mockResolvedValue(mockSections);

            const result = await service.findAll();

            expect(mockSectionRepository.find).toHaveBeenCalled();
            expect(result).toEqual([plainToInstance(Section, mockSections)]);
        });
    });

    describe('findAllWithCount', () => {
        it('should return a list of sections with a count', async () => {
            const mockSections = [new Section(), new Section()];
            const mockCount = mockSections.length;
            mockSectionRepository.findAndCount.mockResolvedValue([mockSections, mockCount]);

            const where = {};
            const result = await service.findAllWithCount(where);

            expect(mockSectionRepository.findAndCount).toHaveBeenCalledWith(where);
            expect(result).toEqual([plainToInstance(Section, mockSections), mockCount]);
        });
    });

    describe('findOne', () => {
        it('should return a section by id', async () => {
            const mockSection = new Section();
            mockSection.id = '1';
            mockSectionRepository.findOne.mockResolvedValue(mockSection);

            const result = await service.findOne('1');

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual(plainToInstance(Section, mockSection));
        });
        it('should throw NotFoundException when section is not found', async () => {
            mockSectionRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'non-existent-id' },
            });
        });
    });

    describe('findOneWhere', () => {
        it('should return a section based on conditions', async () => {
            const mockSection = new Section();
            mockSection.id = '1';
            mockSection.section_name = 'Test Section';
            const where = { where: { section_name: 'Test Section' } };
            mockSectionRepository.findOne.mockResolvedValue(mockSection);

            const result = await service.findOneWhere(where);

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith(where);
            expect(result).toEqual(mockSection);
        });
        it('should return undefined when no Section record is found', async () => {
            const where = { where: { id: '2' } };
            mockSectionRepository.findOne.mockResolvedValue(undefined);

            const result = await service.findOneWhere(where);

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith(where);
            expect(result).toBeUndefined();
        });
    });

    describe('count', () => {
        it('should return the count of sections', async () => {
            const mockCount = 5;
            const where = {};
            mockSectionRepository.count.mockResolvedValue(mockCount);

            const result = await service.count(where);

            expect(mockSectionRepository.count).toHaveBeenCalledWith(where);
            expect(result).toEqual(mockCount);
        });

        it('should return 0 when there are no Section', async () => {
            const where = { where: { deleted_at: IsNull() } };
            const expectedCount = 0;

            mockSectionRepository.count.mockResolvedValue(expectedCount);

            const result = await service.count(where);

            expect(mockSectionRepository.count).toHaveBeenCalledWith(where);
            expect(result).toBe(expectedCount);
        });
    });
    describe('update', () => {
        const id = '1';
        const mockSection = new Section();
        const updateSectionDto: UpdateSectionDto = { section_name: 'Updated Section Name' };

        it('should successfully update a section and return the updated record', async () => {
            // Arrange
            const updatedSection = { ...mockSection, section_name: updateSectionDto.section_name };

            mockSectionRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(updatedSection);

            mockSectionRepository.update.mockResolvedValue(undefined);

            const result = await service.update(id, updateSectionDto);

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    section_name: updateSectionDto.section_name,
                    id: expect.not.stringMatching(id),
                },
            });
            expect(mockSectionRepository.update).toHaveBeenCalledWith(id, updateSectionDto);
            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({ where: { id } });
            expect(result).toEqual(updatedSection);
        });

        it('should throw a ConflictException if a section with the same name exists', async () => {
            const existingSection = { id: '2', section_name: 'Updated Section Name' };
            mockSectionRepository.findOne.mockResolvedValue(existingSection);

            await expect(service.update(id, updateSectionDto)).rejects.toThrow(
                new ConflictException(ERROR.ALREADY_EXISTS('Section')),
            );

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    section_name: updateSectionDto.section_name,
                    id: expect.not.stringMatching(id),
                },
            });
            expect(mockSectionRepository.update).not.toHaveBeenCalled();
        });

        it('should throw a NotFoundException if section to update is not found after update', async () => {
            mockSectionRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

            mockSectionRepository.update.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.update(id, updateSectionDto)).rejects.toThrow(
                new NotFoundException(`Section Not Found.`),
            );

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    section_name: updateSectionDto.section_name,
                    id: expect.not.stringMatching(id),
                },
            });
            expect(mockSectionRepository.update).toHaveBeenCalledWith(id, updateSectionDto);
            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({ where: { id } });
        });
    });
    describe('remove', () => {
        it('should soft delete a section by updating the deleted_at field', async () => {
            const id = '1';
            mockSectionRepository.update.mockResolvedValue(undefined);

            await service.remove(id);

            expect(mockSectionRepository.update).toHaveBeenCalledWith(
                { id: id, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
        });
    });
    describe('createSection', () => {
        it('should throw ConflictException if the section already exists', async () => {
            const createSectionDto: CreateSectionDto = { section_name: 'Existing Section' };

            // Mock existing section
            mockSectionRepository.findOne.mockResolvedValue({ id: '1', section_name: 'Existing Section' });

            await expect(service.createSection(createSectionDto)).rejects.toThrow(
                new ConflictException(ERROR.ALREADY_EXISTS('Section')),
            );

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: { section_name: createSectionDto.section_name },
            });
        });

        it('should create a section if it does not already exist', async () => {
            const createSectionDto: CreateSectionDto = { section_name: 'New Section' };
            const newSection = { id: '2', section_name: 'New Section' };

            mockSectionRepository.findOne.mockResolvedValue(null);

            mockSectionRepository.save.mockResolvedValue(newSection);

            const result = await service.createSection(createSectionDto);

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: { section_name: createSectionDto.section_name },
            });
            expect(mockSectionRepository.save).toHaveBeenCalledWith(createSectionDto);
            expect(result).toEqual(newSection);
        });
    });
    describe('findAllSection', () => {
        it('should return paginated sections with search and order applied', async () => {
            const limit = 10;
            const offset = 0;
            const search = 'Test';
            const order: { [key: string]: 'ASC' | 'DESC' } = { section_name: 'ASC' };
            const mockSections = [new Section(), new Section()];
            const mockCount = mockSections.length;
            mockSectionRepository.findAndCount.mockResolvedValue([mockSections, mockCount]);

            const result = await service.findAllSection(limit, offset, search, order);

            expect(mockSectionRepository.findAndCount).toHaveBeenCalledWith({
                where: {
                    section_name: ILike(`%${search}%`),
                },
                order: order,
                take: +limit,
                skip: +offset,
            });

            expect(result).toEqual({
                total: mockCount,
                limit: +limit,
                offset: +offset,
                data: mockSections,
            });
        });

        it('should return paginated sections without search', async () => {
            const limit = 10;
            const offset = 0;
            const search = '';
            const order: { [key: string]: 'ASC' | 'DESC' } = { section_name: 'ASC' };
            const mockSections = [new Section(), new Section()];
            const mockCount = mockSections.length;

            mockSectionRepository.findAndCount.mockResolvedValue([mockSections, mockCount]);

            const result = await service.findAllSection(limit, offset, search, order);

            expect(mockSectionRepository.findAndCount).toHaveBeenCalledWith({
                where: {},
                order: order,
                take: +limit,
                skip: +offset,
            });

            expect(result).toEqual({
                total: mockCount,
                limit: +limit,
                offset: +offset,
                data: mockSections,
            });
        });

        it('should apply pagination correctly', async () => {
            const limit = 5;
            const offset = 2;
            const search = '';
            const order: { [key: string]: 'ASC' | 'DESC' } = { section_name: 'ASC' };
            const mockSections = [new Section(), new Section()];
            const mockCount = mockSections.length;

            mockSectionRepository.findAndCount.mockResolvedValue([mockSections, mockCount]);

            const result = await service.findAllSection(limit, offset, search, order);

            expect(mockSectionRepository.findAndCount).toHaveBeenCalledWith({
                where: {},
                order: order,
                take: +limit,
                skip: +offset,
            });

            expect(result).toEqual({
                total: mockCount,
                limit: +limit,
                offset: +offset,
                data: mockSections,
            });
        });
    });
    describe('findOneSection', () => {
        it('should return a section when found', async () => {
            const sectionId = '1';
            const mockSection = new Section();

            mockSectionRepository.findOne.mockResolvedValue(mockSection);

            const result = await service.findOneSection(sectionId);

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: { id: sectionId },
            });
            expect(result).toEqual(mockSection);
        });

        it('should throw a NotFoundException when section is not found', async () => {
            const sectionId = '1';

            mockSectionRepository.findOne.mockResolvedValue(null);

            await expect(service.findOneSection(sectionId)).rejects.toThrow(
                new NotFoundException(SUCCESS.RECORD_NOT_FOUND('Section')),
            );
            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: { id: sectionId },
            });
        });
    });
    describe('updateSection', () => {
        const sectionId = '1';
        const updateSectionDto: UpdateSectionDto = { section_name: 'Updated Section' };
        const updatedSection = { id: '1', section_name: 'Updated Section' };
        it('should successfully update and return the section', async () => {
            service.update = jest.fn().mockResolvedValue(updatedSection);

            const result = await service.updateSection(sectionId, updateSectionDto);

            expect(service.update).toHaveBeenCalledWith(sectionId, updateSectionDto);
            expect(result).toEqual(updatedSection);
        });

        it('should throw a NotFoundException if the section is not found', async () => {
            service.update = jest.fn().mockRejectedValue(new NotFoundException('Section not found'));

            await expect(service.updateSection(sectionId, updateSectionDto)).rejects.toThrow(NotFoundException);
            expect(service.update).toHaveBeenCalledWith(sectionId, updateSectionDto);
        });

        it('should throw a ConflictException if there is a conflict during update', async () => {
            service.update = jest.fn().mockRejectedValue(new ConflictException('Section already exists'));

            await expect(service.updateSection(sectionId, updateSectionDto)).rejects.toThrow(ConflictException);
            expect(service.update).toHaveBeenCalledWith(sectionId, updateSectionDto);
        });
    });

    describe('deleteSection', () => {
        const mockSection = new Section();
        it('should delete a section if it exists', async () => {
            mockSectionRepository.findOne.mockResolvedValue(mockSection);

            const result = await service.deleteSection('1');

            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
            });

            expect(mockSectionRepository.update).toHaveBeenCalledWith(
                { id: '1', deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );

            expect(result).toBeUndefined();
        });

        it('should throw a NotFoundException when section is not found', async () => {
            const sectionId = '1';

            mockSectionRepository.findOne.mockResolvedValue(null);

            await expect(service.findOneSection(sectionId)).rejects.toThrow(
                new NotFoundException(ERROR.RECORD_NOT_FOUND('Section')),
            );
            expect(mockSectionRepository.findOne).toHaveBeenCalledWith({
                where: { id: sectionId },
            });
        });
    });
});
