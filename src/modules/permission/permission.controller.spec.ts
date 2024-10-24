import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create.permission.dto';
import { UpdatePermissionDto } from './dto/update.permission.dto';
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { Permission } from './entities/permission.entity';
import { LIMIT, OFFSET } from '@root/src/shared/constants/constant';
import { FindAllQuery } from '@shared/interfaces/interfaces';

describe('PermissionController', () => {
    let controller: PermissionController;
    let permissionService: PermissionService;
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PermissionController],
            providers: [
                {
                    provide: PermissionService,
                    useValue: {
                        createPermission: jest.fn(),
                        findAllPermission: jest.fn(),
                        findOnePermission: jest.fn(),
                        updatePermission: jest.fn(),
                        deletePermission: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<PermissionController>(PermissionController);
        permissionService = module.get<PermissionService>(PermissionService);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('create', () => {
        it('should create a new permission successfully', async () => {
            const createPermissionDto: CreatePermissionDto = {
                permission_name: 'New Permission',
            };

            const mockResult = { id: '1', ...createPermissionDto } as Permission;

            (permissionService.createPermission as jest.Mock).mockResolvedValue(mockResult);

            await controller.create(createPermissionDto, mockResponse as Response);

            expect(permissionService.createPermission).toHaveBeenCalledWith(createPermissionDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_CREATED('Permission'),
                data: mockResult,
            });
        });
    });

    describe('findOne', () => {
        it('should return a specific permission by id', async () => {
            const mockResult = { id: '1', permission_name: 'Permission 1' } as Permission;

            (permissionService.findOnePermission as jest.Mock).mockResolvedValue(mockResult);

            await controller.findOne('1', mockResponse as Response);

            expect(permissionService.findOnePermission).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_FOUND('Permission'),
                data: mockResult,
            });
        });
    });

    describe('findAll', () => {
        it('should return all permissions with default pagination', async () => {
            const mockResult = {
                total: 1,
                limit: +LIMIT,
                offset: +OFFSET,
                data: [new Permission()],
            };

            (permissionService.findAllPermission as jest.Mock).mockResolvedValue(mockResult);

            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: undefined,
                order: { created_at: 'ASC' },
            };

            await controller.findAll(query, mockResponse as Response);

            expect(permissionService.findAllPermission).toHaveBeenCalledWith(+LIMIT, +OFFSET, undefined, {
                created_at: 'ASC',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: query.limit,
                offset: query.offset,
                message: SUCCESS.RECORD_FOUND('Permissions'),
                data: mockResult.data,
            });
        });

        it('should return paginated permissions when limit and offset are provided', async () => {
            const query: FindAllQuery = {
                limit: 2,
                offset: 0,
                search: undefined,
                order: { created_at: 'ASC' },
            };
            const mockResult = {
                total: 3,
                limit: query.limit,
                offset: query.offset,
                data: [new Permission(), new Permission(), new Permission()],
            };

            (permissionService.findAllPermission as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(permissionService.findAllPermission).toHaveBeenCalledWith(query.limit, query.offset, undefined, {
                created_at: 'ASC',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: SUCCESS.RECORD_FOUND('Permissions'),
                data: mockResult.data,
            });
        });

        it('should return permissions based on search query', async () => {
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: 'admin',
                order: { created_at: 'ASC' },
            };
            const mockResult = {
                total: 1,
                limit: query.limit,
                offset: query.offset,
                data: [new Permission(), new Permission(), new Permission()],
            };

            (permissionService.findAllPermission as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(permissionService.findAllPermission).toHaveBeenCalledWith(query.limit, query.offset, query.search, {
                created_at: 'ASC',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: query.limit,
                offset: query.offset,
                message: SUCCESS.RECORD_FOUND('Permissions'),
                data: mockResult.data,
            });
        });

        it('should return permissions sorted by order', async () => {
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: undefined,
                order: { permission_name: 'ASC' },
            };
            const mockResult = {
                total: 4,
                limit: LIMIT,
                offset: OFFSET,
                data: [new Permission(), new Permission(), new Permission(), new Permission()],
            };

            const order = { permission_name: 'ASC' };

            (permissionService.findAllPermission as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(permissionService.findAllPermission).toHaveBeenCalledWith(
                query.limit,
                query.offset,
                undefined,
                order,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: SUCCESS.RECORD_FOUND('Permissions'),
                data: mockResult.data,
            });
        });

        it('should return no results when no permissions match the query', async () => {
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: 'nonexistent',
                order: { permission_name: 'ASC' },
            };
            const mockResult = {
                total: 0,
                limit: query.limit,
                offset: query.offset,
                data: [],
            };

            (permissionService.findAllPermission as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(permissionService.findAllPermission).toHaveBeenCalledWith(
                query.limit,
                query.offset,
                query.search,
                query.order,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: ERROR.NO_RESULT_FOUND,
                data: mockResult.data,
            });
        });

        it('should handle unexpected errors from the service gracefully', async () => {
            const query: FindAllQuery = {
                limit: undefined,
                offset: undefined,
                search: undefined,
                order: undefined,
            };
            (permissionService.findAllPermission as jest.Mock).mockRejectedValue(new Error('Unexpected Error'));

            await expect(controller.findAll(query, mockResponse as Response)).rejects.toThrow('Unexpected Error');
        });
    });
    describe('update', () => {
        it('should update a permission successfully', async () => {
            const updatePermissionDto: UpdatePermissionDto = {
                permission_name: 'Updated Permission',
            };

            (permissionService.updatePermission as jest.Mock).mockResolvedValue(true);

            await controller.update('1', updatePermissionDto, mockResponse as Response);

            expect(permissionService.updatePermission).toHaveBeenCalledWith('1', updatePermissionDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_UPDATED('Permission'),
            });
        });

        it('should return not found when the permission does not exist', async () => {
            (permissionService.updatePermission as jest.Mock).mockResolvedValue(false);

            await controller.update('1', {}, mockResponse as Response);

            expect(permissionService.updatePermission).toHaveBeenCalledWith('1', {});
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_NOT_FOUND('Permission'),
            });
        });
    });

    describe('remove', () => {
        it('should delete a permission successfully', async () => {
            (permissionService.deletePermission as jest.Mock).mockResolvedValue(true);

            await controller.remove('1', mockResponse as Response);

            expect(permissionService.deletePermission).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_DELETED('Permission'),
            });
        });

        it('should return not found when the permission does not exist', async () => {
            (permissionService.deletePermission as jest.Mock).mockResolvedValue(false);

            await controller.remove('1', mockResponse as Response);

            expect(permissionService.deletePermission).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_NOT_FOUND('Permission'),
            });
        });
    });
});
