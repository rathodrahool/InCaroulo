import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { DropdownService } from './dropdown.service';
import { Country } from '@root/src/shared/entities/country.entity';

describe('DropdownService', () => {
    let service: DropdownService;
    const mockDropdownRepository = {
        findOneWhere: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DropdownService,
                {
                    provide: getRepositoryToken(Country),
                    useValue: mockDropdownRepository,
                },
            ],
        }).compile();

        service = module.get<DropdownService>(DropdownService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAllWithCount', () => {
        it('should return a list of Countries with a count', async () => {
            const mockCountries = [new Country(), new Country()];
            const mockCount = mockCountries.length;
            mockDropdownRepository.findAndCount.mockResolvedValue([mockCountries, mockCount]);

            const where = {};
            const result = await service.findAllWithCount(where);

            expect(mockDropdownRepository.findAndCount).toHaveBeenCalledWith(where);
            expect(result).toEqual([plainToInstance(Country, mockCountries), mockCount]);
        });
    });

    describe('find', () => {
        it('should return a list of countries', async () => {
            const mockCountries = [new Country(), new Country()];
            mockDropdownRepository.find.mockResolvedValue([mockCountries]);

            const where = {};
            const result = await service.find(where);

            expect(mockDropdownRepository.find).toHaveBeenCalledWith(where);
            expect(result).toEqual([plainToInstance(Country, mockCountries)]);
        });
    });

    describe('findOne', () => {
        it('should return a country by id', async () => {
            const mockCountry = new Country();
            mockCountry.id = '1';
            mockDropdownRepository.findOne.mockResolvedValue(mockCountry);

            const result = await service.findOne('1');

            expect(mockDropdownRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual(plainToInstance(Country, mockCountry));
        });
    });

    describe('findOneWhere', () => {
        it('should return a country based on conditions', async () => {
            const mockCountry = new Country();
            mockCountry.id = '1';
            mockCountry.name = 'India';
            const where = { where: { name: 'India' } };
            mockDropdownRepository.findOne.mockResolvedValue(mockCountry);

            const result = await service.findOneWhere(where);

            expect(mockDropdownRepository.findOne).toHaveBeenCalledWith(where);
            expect(result).toEqual(mockCountry);
        });
        it('should return undefined when no Country record is found', async () => {
            const where = { where: { id: '2' } };
            mockDropdownRepository.findOne.mockResolvedValue(undefined);

            const result = await service.findOneWhere(where);

            expect(mockDropdownRepository.findOne).toHaveBeenCalledWith(where);
            expect(result).toBeUndefined();
        });
    });

    describe('findAllCountries', () => {
        it('should return list of countries and count without search', async () => {
            const result = [
                [
                    { id: '1', name: 'Country A' },
                    { id: '2', name: 'Country B' },
                ],
                2,
            ];

            mockDropdownRepository.findAndCount.mockResolvedValue(result);

            const [countries, count] = await service.findAllCountries('', { name: 'ASC' });

            expect(countries).toEqual([
                { id: '1', name: 'Country A' },
                { id: '2', name: 'Country B' },
            ]);
            expect(count).toBe(2);
            expect(mockDropdownRepository.findAndCount).toHaveBeenCalledWith({
                where: {},
                order: { name: 'ASC' },
                select: ['id', 'name', 'iso_code', 'flag', 'phone_code'],
            });
        });

        it('should return filtered list of countries when search is provided', async () => {
            const result = [[{ id: '1', name: 'Search Country' }], 1];

            mockDropdownRepository.findAndCount.mockResolvedValue(result);

            const [countries, count] = await service.findAllCountries('search', { name: 'ASC' });

            expect(countries).toEqual([{ id: '1', name: 'Search Country' }]);
            expect(count).toBe(1);
            expect(mockDropdownRepository.findAndCount).toHaveBeenCalledWith({
                where: { name: ILike('%search%') },
                order: { name: 'ASC' },
                select: ['id', 'name', 'iso_code', 'flag', 'phone_code'],
            });
        });

        it('should return empty array and count 0 if no countries found', async () => {
            const result = [[], 0];

            mockDropdownRepository.findAndCount.mockResolvedValue(result);

            const [countries, count] = await service.findAllCountries('no match', { name: 'ASC' });

            expect(countries).toEqual([]);
            expect(count).toBe(0);
            expect(mockDropdownRepository.findAndCount).toHaveBeenCalledWith({
                where: { name: ILike('%no match%') },
                order: { name: 'ASC' },
                select: ['id', 'name', 'iso_code', 'flag', 'phone_code'],
            });
        });

        it('should return countries ordered by provided order', async () => {
            const result = [
                [
                    { id: '1', name: 'A Country' },
                    { id: '2', name: 'B Country' },
                ],
                2,
            ];

            mockDropdownRepository.findAndCount.mockResolvedValue(result);

            const [countries, count] = await service.findAllCountries('', { name: 'DESC' });

            expect(countries).toEqual([
                { id: '1', name: 'A Country' },
                { id: '2', name: 'B Country' },
            ]);
            expect(count).toBe(2);
            expect(mockDropdownRepository.findAndCount).toHaveBeenCalledWith({
                where: {},
                order: { name: 'DESC' },
                select: ['id', 'name', 'iso_code', 'flag', 'phone_code'],
            });
        });
    });
});
