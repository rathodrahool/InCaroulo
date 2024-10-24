import { Test, TestingModule } from '@nestjs/testing';
import { DropdownController } from './dropdown.controller';
import { DropdownService } from './dropdown.service';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Response } from 'express';
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { HttpStatus } from '@nestjs/common';
import { Country } from '@root/src/shared/entities/country.entity';
import { FindAllQuery } from '@shared/interfaces/interfaces';

describe('DropdownController', () => {
    let controller: DropdownController;
    let dropdownService: DropdownService;
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DropdownController],
            providers: [
                {
                    provide: DropdownService,
                    useValue: {
                        findAllCountries: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<DropdownController>(DropdownController);
        dropdownService = module.get<DropdownService>(DropdownService);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('findAll', () => {
        it('should return a list of countries successfully', async () => {
            const query: FindAllQuery = {
                search: 'test',
                order: { name: 'ASC' },
            };
            const mockList = [new Country(), new Country()];
            const mockCount = mockList.length;

            (dropdownService.findAllCountries as jest.Mock).mockResolvedValue([mockList, mockCount]);
            await controller.findAll({ search: query.search, order: query.order }, mockResponse as Response);

            expect(dropdownService.findAllCountries).toHaveBeenCalledWith(query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_FOUND('countries'),
                data: mockList,
            });
        });

        it('should return no result found message when no countries are found', async () => {
            const query: FindAllQuery = {
                search: 'test',
                order: { name: 'ASC' },
            };
            const mockList = [];
            const mockCount = 0;

            (dropdownService.findAllCountries as jest.Mock).mockResolvedValue([mockList, mockCount]);

            await controller.findAll(query, mockResponse as Response);

            expect(dropdownService.findAllCountries).toHaveBeenCalledWith(query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: ERROR.NO_RESULT_FOUND,
                data: mockList,
            });
        });
        it('should return countries based on search query', async () => {
            const query: FindAllQuery = {
                search: 'test',
                order: { name: 'ASC' },
            };
            const mockList = [new Country(), new Country()];
            const mockCount = mockList.length;

            (dropdownService.findAllCountries as jest.Mock).mockResolvedValue([mockList, mockCount]);

            await controller.findAll(query, mockResponse as Response);

            expect(dropdownService.findAllCountries).toHaveBeenCalledWith(query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_FOUND('countries'),
                data: mockList,
            });
        });

        it('should return permissions sorted by order', async () => {
            const query: FindAllQuery = {
                search: undefined,
                order: { name: 'ASC' },
            };
            const mockList = [new Country(), new Country()];
            const mockCount = mockList.length;

            (dropdownService.findAllCountries as jest.Mock).mockResolvedValue([mockList, mockCount]);

            await controller.findAll(query, mockResponse as Response);

            expect(dropdownService.findAllCountries).toHaveBeenCalledWith(query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_FOUND('countries'),
                data: mockList,
            });
        });
        it('should return no results when no permissions match the query', async () => {
            const query: FindAllQuery = {
                search: 'nonexistents',
                order: undefined,
            };
            const mockList = [];
            const mockCount = mockList.length;

            (dropdownService.findAllCountries as jest.Mock).mockResolvedValue([mockList, mockCount]);

            await controller.findAll(query, mockResponse as Response);

            expect(dropdownService.findAllCountries).toHaveBeenCalledWith(query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: ERROR.NO_RESULT_FOUND,
                data: [],
            });
        });

        it('should handle unexpected errors from the service gracefully', async () => {
            const query: FindAllQuery = {
                search: undefined,
                order: undefined,
            };
            (dropdownService.findAllCountries as jest.Mock).mockRejectedValue(new Error('Unexpected Error'));

            await expect(controller.findAll(query, mockResponse as Response)).rejects.toThrow('Unexpected Error');
        });
    });
});
