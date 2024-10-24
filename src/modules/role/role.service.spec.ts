import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, ILike, IsNull } from 'typeorm';
import { RoleService } from './role.service';
import { SectionService } from '@modules/section/section.service';
import { PermissionService } from '@modules/permission/permission.service';
import { Role } from './entities/role.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { CreateRoleDto } from './dto/create.role.dto';
import { UpdateRoleDto } from './dto/update.role.dto';
import { ERROR } from '@shared/constants/messages';
import { plainToClass, plainToInstance } from 'class-transformer';

describe('RoleService', () => {
    let roleService: RoleService;

    const mockRoleRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        update: jest.fn(),
        findOneWhere: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    };

    const mockRoleSectionPermissionRepository = {
        save: jest.fn(),
        update: jest.fn(),
    };

    const mockSectionService = {
        findOneWhere: jest.fn(),
    };

    const mockPermissionService = {
        findOneWhere: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: getRepositoryToken(Role),
                    useValue: mockRoleRepository,
                },
                {
                    provide: getRepositoryToken(RoleSectionPermission),
                    useValue: mockRoleSectionPermissionRepository,
                },
                {
                    provide: SectionService,
                    useValue: mockSectionService,
                },
                {
                    provide: PermissionService,
                    useValue: mockPermissionService,
                },
            ],
        }).compile();

        roleService = module.get<RoleService>(RoleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new role and return it as a Role instance', async () => {
            const createRoleDto: CreateRoleDto = {
                role_name: 'Test Role',
                description: 'test desc',
                permissions: [
                    {
                        section: 'dashboard',
                        section_permission: ['create', 'delete'],
                    },
                ],
            };

            const savedRole = {
                id: 'generated-id',
                role_name: 'Test Role',
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockRoleRepository.save.mockResolvedValue(savedRole);

            const result = await roleService.create(createRoleDto);

            expect(mockRoleRepository.save).toHaveBeenCalledWith(createRoleDto);
            expect(result).toBeInstanceOf(Role);
            expect(result).toEqual(plainToClass(Role, savedRole));
        });
    });

    describe('findOneWhere', () => {
        it('should find a role based on given criteria', async () => {
            const mockRole = {
                id: 'test-id',
                role_name: 'Test Role',
                created_at: new Date(),
                updated_at: new Date(),
                // Add other properties as needed based on your Role entity
            };

            const findOptions: FindOneOptions<Role> = {
                where: { role_name: 'Test Role' },
            };

            mockRoleRepository.findOne.mockResolvedValue(mockRole);

            const result = await roleService.findOneWhere(findOptions);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith(findOptions);
            expect(result).toEqual(mockRole);
        });

        it('should return null if no role is found', async () => {
            const findOptions: FindOneOptions<Role> = {
                where: { role_name: 'Non-existent Role' },
            };

            mockRoleRepository.findOne.mockResolvedValue(null);

            const result = await roleService.findOneWhere(findOptions);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith(findOptions);
            expect(result).toBeNull();
        });
    });

    describe('findAllWithCount', () => {
        it('should find roles and count based on given criteria', async () => {
            const mockRoles = [
                {
                    id: 'role-1',
                    role_name: 'Admin',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 'role-2',
                    role_name: 'User',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                // Add more mock roles as needed
            ];

            const mockCount = mockRoles.length;

            const findOptions: FindManyOptions<Role> = {
                where: { role_name: 'Admin' },
                order: { created_at: 'DESC' },
                take: 10,
                skip: 0,
            };

            mockRoleRepository.findAndCount.mockResolvedValue([mockRoles, mockCount]);

            const [result, count] = await roleService.findAllWithCount(findOptions);

            expect(mockRoleRepository.findAndCount).toHaveBeenCalledWith(findOptions);
            expect(result).toEqual(plainToInstance(Role, mockRoles));
            expect(count).toBe(mockCount);
        });

        it('should return empty array and count 0 if no roles are found', async () => {
            const findOptions: FindManyOptions<Role> = {
                where: { role_name: 'Non-existent Role' },
            };

            mockRoleRepository.findAndCount.mockResolvedValue([[], 0]);

            const [result, count] = await roleService.findAllWithCount(findOptions);

            expect(mockRoleRepository.findAndCount).toHaveBeenCalledWith(findOptions);
            expect(result).toEqual([]);
            expect(count).toBe(0);
        });
    });

    describe('count', () => {
        it('should return the count of roles based on given criteria', async () => {
            const findOptions: FindManyOptions<Role> = {
                where: { role_name: 'Admin' },
            };

            const expectedCount = 5;

            mockRoleRepository.count.mockResolvedValue(expectedCount);

            const result = await roleService.count(findOptions);

            expect(mockRoleRepository.count).toHaveBeenCalledWith(findOptions);
            expect(result).toBe(expectedCount);
        });

        it('should return 0 if no roles match the criteria', async () => {
            const findOptions: FindManyOptions<Role> = {
                where: { role_name: 'Non-existent Role' },
            };

            mockRoleRepository.count.mockResolvedValue(0);

            const result = await roleService.count(findOptions);

            expect(mockRoleRepository.count).toHaveBeenCalledWith(findOptions);
            expect(result).toBe(0);
        });

        it('should return total count when no criteria is provided', async () => {
            const findOptions: FindManyOptions<Role> = {};

            const totalCount = 10;

            mockRoleRepository.count.mockResolvedValue(totalCount);

            const result = await roleService.count(findOptions);

            expect(mockRoleRepository.count).toHaveBeenCalledWith(findOptions);
            expect(result).toBe(totalCount);
        });
    });

    describe('findOne', () => {
        it('should return a role when found', async () => {
            const mockRole = {
                id: 'test-id',
                role_name: 'Admin',
                created_at: new Date(),
                updated_at: new Date(),
                roleSectionPermissions: [
                    { id: 'perm-1', section: 'users', permissions: ['read', 'write'] },
                    { id: 'perm-2', section: 'posts', permissions: ['read'] },
                ],
            };

            mockRoleRepository.findOne.mockResolvedValue(mockRole);

            const result = await roleService.findOne('test-id');

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'test-id' },
                relations: ['roleSectionPermissions'],
            });
            expect(result).toEqual(plainToClass(Role, mockRole));
        });

        it('should throw NotFoundException when role is not found', async () => {
            mockRoleRepository.findOne.mockResolvedValue(null);

            await expect(roleService.findOne('non-existent-id')).rejects.toThrow(NotFoundException);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'non-existent-id' },
                relations: ['roleSectionPermissions'],
            });
        });
    });

    describe('update', () => {
        const roleId = 'existing-role-id';
        const updateRoleDto: UpdateRoleDto = {
            role_name: 'Updated Role Name',
            permissions: [
                {
                    section: 'dashboard',
                    section_permission: ['update'],
                },
            ],
        };

        it('should successfully update an existing role and return the updated role', async () => {
            // Mock role repository to return an existing role
            const existingRole = {
                id: roleId,
                role_name: 'Old Role Name',
            };
            const updatedRole = {
                id: roleId,
                role_name: 'Updated Role Name',
            };

            mockRoleRepository.findOne.mockResolvedValue(existingRole);
            mockRoleRepository.save.mockResolvedValue(updatedRole);

            // Mock the findOne method to return the updated role
            roleService.findOne = jest.fn().mockResolvedValue(updatedRole);

            const result = await roleService.update(roleId, updateRoleDto);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { id: roleId } });
            expect(mockRoleRepository.save).toHaveBeenCalledWith({ ...existingRole, ...updateRoleDto });
            expect(roleService.findOne).toHaveBeenCalledWith(roleId);
            expect(result).toEqual(updatedRole);
        });

        it('should throw a NotFoundException if the role does not exist', async () => {
            mockRoleRepository.findOne.mockResolvedValue(null);

            await expect(roleService.update(roleId, updateRoleDto)).rejects.toThrow(NotFoundException);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { id: roleId } });
            expect(mockRoleRepository.save).not.toHaveBeenCalled();
        });

        it('should handle errors during save operation', async () => {
            const existingRole = {
                id: roleId,
                role_name: 'Old Role Name',
            };

            mockRoleRepository.findOne.mockResolvedValue(existingRole);
            mockRoleRepository.save.mockRejectedValue(new Error('Save error'));

            await expect(roleService.update(roleId, updateRoleDto)).rejects.toThrow('Save error');

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { id: roleId } });
            expect(mockRoleRepository.save).toHaveBeenCalledWith({ ...existingRole, ...updateRoleDto });
        });
    });

    describe('remove', () => {
        const roleId = 'role-id-to-remove';

        it('should successfully soft-delete a role', async () => {
            // Mock the role repository update method to resolve successfully
            mockRoleRepository.update.mockResolvedValue(undefined);

            await roleService.remove(roleId);

            // Use expect.any to handle time discrepancies
            expect(mockRoleRepository.update).toHaveBeenCalledWith(
                { id: roleId, deleted_at: expect.any(Object) }, // Use expect.any for IsNull
                { deleted_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) }, // Match ISO date string
            );
        });

        it('should handle errors during update operation', async () => {
            // Mock the role repository update method to throw an error
            mockRoleRepository.update.mockRejectedValue(new Error('Update error'));

            await expect(roleService.remove(roleId)).rejects.toThrow('Update error');

            // Use expect.any to handle time discrepancies
            expect(mockRoleRepository.update).toHaveBeenCalledWith(
                { id: roleId, deleted_at: expect.any(Object) }, // Use expect.any for IsNull
                { deleted_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) }, // Match ISO date string
            );
        });
    });

    describe('createRole', () => {
        const createRoleDto: CreateRoleDto = {
            role_name: 'admin',
            description: 'test',
            permissions: [
                {
                    section: 'users',
                    section_permission: ['read', 'write'],
                },
            ],
        };

        it('should create a new role successfully', async () => {
            // Mock existing role to return null, indicating no role exists with this name
            mockRoleRepository.findOne.mockResolvedValue(null);

            // Mock sections and permissions
            mockSectionService.findOneWhere.mockResolvedValueOnce({ section_name: 'users' });
            mockPermissionService.findOneWhere.mockResolvedValueOnce({ permission_name: 'read' });
            mockPermissionService.findOneWhere.mockResolvedValueOnce({ permission_name: 'write' });

            // Mock saving role and roleSectionPermission
            mockRoleRepository.save.mockResolvedValue({ id: 1, role_name: 'admin' });
            mockRoleSectionPermissionRepository.save.mockResolvedValue([]);

            const result = await roleService.createRole(createRoleDto);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { role_name: 'admin' } });
            expect(mockSectionService.findOneWhere).toHaveBeenCalledWith({ where: { section_name: 'users' } });
            expect(mockPermissionService.findOneWhere).toHaveBeenCalledTimes(2);
            expect(mockRoleRepository.save).toHaveBeenCalledWith(expect.objectContaining({ role_name: 'admin' }));
            expect(result).toEqual({ id: 1, role_name: 'admin' });
        });

        it('should throw ConflictException if role already exists', async () => {
            mockRoleRepository.findOne.mockResolvedValue({ id: 1, role_name: 'admin' });

            await expect(roleService.createRole(createRoleDto)).rejects.toThrow(ConflictException);
            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { role_name: 'admin' } });
        });

        it('should throw BadRequestException if a section is not found', async () => {
            mockRoleRepository.findOne.mockResolvedValue(null);
            mockSectionService.findOneWhere.mockResolvedValueOnce(null); // Section not found

            await expect(roleService.createRole(createRoleDto)).rejects.toThrow(BadRequestException);
            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { role_name: 'admin' } });
            expect(mockSectionService.findOneWhere).toHaveBeenCalledWith({ where: { section_name: 'users' } });
        });

        it('should throw BadRequestException if a permission is not found', async () => {
            mockRoleRepository.findOne.mockResolvedValue(null);
            mockSectionService.findOneWhere.mockResolvedValueOnce({ section_name: 'users' });
            mockPermissionService.findOneWhere.mockResolvedValueOnce(null); // Permission not found

            await expect(roleService.createRole(createRoleDto)).rejects.toThrow(BadRequestException);
            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { role_name: 'admin' } });
            expect(mockPermissionService.findOneWhere).toHaveBeenCalled();
        });
    });

    describe('findAllRole', () => {
        const roles: Role[] = [new Role(), new Role()];

        it('should return paginated roles without search criteria', async () => {
            const limit = 10;
            const offset = 0;
            const order = { role_name: 'ASC' };
            // Mock the repository's findAndCount method
            mockRoleRepository.findAndCount.mockResolvedValueOnce([roles, 2]);

            const result = await roleService.findAllRole(limit, offset, '', { role_name: 'ASC' });

            expect(mockRoleRepository.findAndCount).toHaveBeenCalledWith({
                where: {},
                order: order,
                take: +limit,
                skip: +offset,
            });

            expect(result).toEqual({
                total: 2,
                limit: +limit,
                offset: +offset,
                data: roles,
            });
        });

        it('should return paginated roles with search criteria', async () => {
            const limit = 5;
            const offset = 0;
            const search = 'Admin';
            const order = { role_name: 'ASC' };

            // Mock the repository's findAndCount method
            mockRoleRepository.findAndCount.mockResolvedValueOnce([[roles[0]], 1]);

            const result = await roleService.findAllRole(limit, offset, search, { role_name: 'ASC' });

            expect(mockRoleRepository.findAndCount).toHaveBeenCalledWith({
                where: { role_name: ILike(`%Admin%`) },
                order: order,
                take: +limit,
                skip: +offset,
            });

            expect(result).toEqual({
                total: 1,
                limit: +limit,
                offset: +offset,
                data: [roles[0]],
            });
        });

        it('should return an empty list if no roles match search criteria', async () => {
            const limit = 5;
            const offset = 0;
            const search = 'NonExistentRole';
            const order = { role_name: 'ASC' };

            // Mock the repository's findAndCount method with no matching results
            mockRoleRepository.findAndCount.mockResolvedValueOnce([[], 0]);

            const result = await roleService.findAllRole(limit, offset, search, { role_name: 'ASC' });

            expect(mockRoleRepository.findAndCount).toHaveBeenCalledWith({
                where: { role_name: ILike(`%NonExistentRole%`) },
                order: order,
                take: +limit,
                skip: +offset,
            });

            expect(result).toEqual({
                total: 0,
                limit: +limit,
                offset: +offset,
                data: [],
            });
        });
    });

    describe('findOneRole', () => {
        it('should return a role when found by ID', async () => {
            const id = '1';
            const role = { id: '1', role_name: 'Admin' } as Role;

            mockRoleRepository.findOne.mockResolvedValueOnce(role);

            const result = await roleService.findOneRole(id);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
                where: { id },
                relations: ['roleSectionPermissions'], // As defined in the actual method
            });
            expect(result).toEqual(role);
        });

        it('should throw a NotFoundException if no role is found', async () => {
            const id = '2';

            // Mock the repository's findOne method to return null (not found)
            mockRoleRepository.findOne.mockResolvedValueOnce(null);

            await expect(roleService.findOneRole(id)).rejects.toThrow('Role Not Found.');
            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
                where: { id },
                relations: ['roleSectionPermissions'],
            });
        });
    });

    describe('updateRole', () => {
        const mockRoleId = 'role-id';
        const mockRole = { id: mockRoleId, role_name: 'admin' };
        const mockUpdateRoleDto: UpdateRoleDto = {
            role_name: 'updated-role',
            permissions: [
                {
                    section: 'users',
                    section_permission: ['create', 'edit'],
                },
            ],
        };

        it('should throw NotFoundException if section is not found', async () => {
            (mockRoleRepository.findOne as jest.Mock).mockResolvedValue(mockRole);
            (mockSectionService.findOneWhere as jest.Mock).mockResolvedValue(null); // Section not found

            await expect(roleService.updateRole(mockRoleId, mockUpdateRoleDto)).rejects.toThrow(NotFoundException);
            expect(mockSectionService.findOneWhere).toHaveBeenCalledWith({ where: { section_name: 'users' } });
        });

        it('should throw NotFoundException if permission is not found', async () => {
            const missingPermission = 'create';
            (mockRoleRepository.findOne as jest.Mock).mockResolvedValue(mockRole);
            (mockSectionService.findOneWhere as jest.Mock).mockResolvedValue({ section_name: 'users' });
            (mockPermissionService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(roleService.updateRole(mockRoleId, mockUpdateRoleDto)).rejects.toThrow(
                ERROR.RECORD_NOT_FOUND(`Permission ${missingPermission}`),
            );
            expect(mockPermissionService.findOneWhere).toHaveBeenCalledWith({
                where: { permission_name: 'create' },
            });
        });

        it('should update the role with new permissions and sections', async () => {
            const mockRoleId = 'valid-role-id'; // Ensure this role exists
            const mockUpdateRoleDto: UpdateRoleDto = {
                role_name: 'admin',
                permissions: [
                    {
                        section: 'dashboard',
                        section_permission: ['update'],
                    },
                ],
            };

            // Mock the role repository to return an existing role
            mockRoleRepository.findOne.mockResolvedValue({ id: mockRoleId, role_name: 'admin' });

            // Mock the section service to return the required section
            mockSectionService.findOneWhere.mockResolvedValueOnce({ section_name: 'dashboard' });

            // Mock the permission service to return the required permission
            mockPermissionService.findOneWhere.mockResolvedValueOnce({ permission_name: 'update' });

            // Mock the save method for the role section permissions
            mockRoleSectionPermissionRepository.save.mockResolvedValue([]);

            // Perform the update operation
            await roleService.updateRole(mockRoleId, mockUpdateRoleDto);

            // Ensure the role repository was called to find the role
            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockRoleId },
            });

            // Ensure the section and permission lookups were performed
            expect(mockSectionService.findOneWhere).toHaveBeenCalledWith({
                where: { section_name: 'dashboard' },
            });
            expect(mockPermissionService.findOneWhere).toHaveBeenCalledWith({
                where: { permission_name: 'update' },
            });

            // Ensure the role section permissions were saved correctly
            expect(mockRoleSectionPermissionRepository.save).toHaveBeenCalled();

            // Optionally, you can assert that the updated role contains the correct values
            const updatedRole = await roleService.findOneRole(mockRoleId);
            expect(updatedRole.role_name).toBe('admin');
            // expect(updatedRole.roleSectionPermissions[0].section.section_name).toBe('dashboard');
            // expect(updatedRole.roleSectionPermissions[0].permission.permission_name).toBe('update');
        });
    });

    describe('removeRole', () => {
        const mockRoleId = 'role-id';

        it('should throw NotFoundException if the role does not exist', async () => {
            mockRoleRepository.findOne.mockResolvedValue(null);
            await expect(roleService.removeRole(mockRoleId)).rejects.toThrow(NotFoundException);
            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockRoleId },
                relations: ['roleSectionPermissions'],
            });
        });

        it('should update roleSectionPermission with deleted_at timestamp and soft delete the role', async () => {
            const mockRole = { id: mockRoleId, role_name: 'admin' };
            mockRoleRepository.findOne.mockResolvedValue(mockRole);
            mockRoleSectionPermissionRepository.update.mockResolvedValue({ affected: 1 });
            mockRoleRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

            await roleService.removeRole(mockRoleId);

            expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockRoleId },
                relations: ['roleSectionPermissions'],
            });
            expect(mockRoleSectionPermissionRepository.update).toHaveBeenCalledWith(
                { role: { id: mockRoleId }, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
            expect(mockRoleRepository.update).toHaveBeenCalledWith(
                { id: mockRoleId, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
        });
    });
});
