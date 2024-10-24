import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Response } from 'express';
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { HttpStatus } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create.role.dto';
import { Role } from './entities/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoleSectionPermission } from '@root/src/shared/entities/role.section.permission.entity';
import { UpdateRoleDto } from './dto/update.role.dto';
import { LIMIT, OFFSET } from '@root/src/shared/constants/constant';
import { FindAllQuery } from '@shared/interfaces/interfaces';

describe('RoleController', () => {
    let controller: RoleController;
    let roleService: RoleService;
    let mockResponse: Partial<Response>;

    const mockRoleSectionPermissionRepository = {
        save: jest.fn(),
        update: jest.fn(),
    };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RoleController],
            providers: [
                {
                    provide: RoleService,
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                        findAllRole: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(RoleSectionPermission),
                    useValue: mockRoleSectionPermissionRepository,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<RoleController>(RoleController);
        roleService = module.get<RoleService>(RoleService);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('create', () => {
        it('should create role successfully', async () => {
            const createRoleDto = new CreateRoleDto();
            roleService.createRole = jest.fn().mockResolvedValue(undefined);

            await controller.create(createRoleDto, mockResponse as Response);

            expect(roleService.createRole).toHaveBeenCalledWith(createRoleDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_CREATED('Role'),
            });
        });
    });

    describe('findOne', () => {
        it('should return a specific role by id', async () => {
            const mockResult = { id: '1', role_name: 'Role 1' } as Role;

            roleService.findOneRole = jest.fn().mockResolvedValue(mockResult);

            await controller.findOne('1', mockResponse as Response);

            expect(roleService.findOneRole).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_FOUND('Role'),
                data: mockResult,
            });
        });
    });
    describe('findAll', () => {
        it('should return all roles with default pagination', async () => {
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: undefined,
                order: { created_at: 'ASC' },
            };
            const mockResult = {
                total: 2,
                limit: query.limit,
                offset: query.offset,
                data: [new Role(), new Role()],
            };

            (roleService.findAllRole as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(roleService.findAllRole).toHaveBeenCalledWith(query.limit, query.offset, query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: SUCCESS.RECORD_FOUND('Roles'),
                data: mockResult.data,
            });
        });

        it('should return paginated roles when limit and offset are provided', async () => {
            const query: FindAllQuery = {
                limit: 10,
                offset: 0,
                search: undefined,
                order: { created_at: 'ASC' },
            };
            const mockResult = {
                total: 2,
                limit: query.limit,
                offset: query.offset,
                data: [new Role(), new Role()],
            };

            roleService.findAllRole = jest.fn().mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(roleService.findAllRole).toHaveBeenCalledWith(query.limit, query.offset, query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: SUCCESS.RECORD_FOUND('Roles'),
                data: mockResult.data,
            });
        });

        it('should return roles based on search query', async () => {
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: 'admin',
                order: { created_at: 'ASC' },
            };
            const mockResult = {
                total: 2,
                limit: LIMIT,
                offset: OFFSET,
                data: [new Role(), new Role()],
            };

            (roleService.findAllRole as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(roleService.findAllRole).toHaveBeenCalledWith(query.limit, query.offset, query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: SUCCESS.RECORD_FOUND('Roles'),
                data: mockResult.data,
            });
        });

        it('should return roles sorted by order', async () => {
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: undefined,
                order: { role_name: 'ASC' },
            };
            const mockResult = {
                total: 2,
                limit: LIMIT,
                offset: OFFSET,
                data: [new Role(), new Role()],
            };

            (roleService.findAllRole as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(roleService.findAllRole).toHaveBeenCalledWith(query.limit, query.offset, query.search, query.order);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                total: mockResult.total,
                limit: mockResult.limit,
                offset: mockResult.offset,
                message: SUCCESS.RECORD_FOUND('Roles'),
                data: mockResult.data,
            });
        });

        it('should return no results when no roles match the query', async () => {
            const query: FindAllQuery = {
                limit: +LIMIT,
                offset: +OFFSET,
                search: 'nonexistent',
                order: { role_name: 'ASC' },
            };
            const mockResult = {
                total: 0,
                limit: query.limit,
                offset: query.offset,
                data: [],
            };

            (roleService.findAllRole as jest.Mock).mockResolvedValue(mockResult);

            await controller.findAll(query, mockResponse as Response);

            expect(roleService.findAllRole).toHaveBeenCalledWith(query.limit, query.offset, query.search, query.order);
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
            (roleService.findAllRole as jest.Mock).mockRejectedValue(new Error('Unexpected Error'));

            await expect(controller.findAll(query, mockResponse as Response)).rejects.toThrow('Unexpected Error');
        });
    });
    describe('update', () => {
        it('should update a role successfully', async () => {
            const updateRoleDto: UpdateRoleDto = {
                role_name: 'Updated Role',
            };

            roleService.updateRole = jest.fn().mockResolvedValue(true);

            await controller.update('1', updateRoleDto, mockResponse as Response);

            expect(roleService.updateRole).toHaveBeenCalledWith('1', updateRoleDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_UPDATED('Role'),
            });
        });
    });

    describe('remove', () => {
        it('should delete a Role successfully', async () => {
            roleService.removeRole = jest.fn().mockResolvedValue(true);

            await controller.remove('1', mockResponse as Response);

            expect(roleService.removeRole).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_DELETED('Role'),
            });
        });
    });
});
