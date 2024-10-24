import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, IsNull } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ERROR, SUCCESS } from '@root/src/shared/constants/messages';
import { CreatePermissionDto } from './dto/create.permission.dto';
import { PermissionService } from './permission.service';
import { Permission } from './entities/permission.entity';
import { UpdatePermissionDto } from './dto/update.permission.dto';

describe('PermissionService', () => {
    let service: PermissionService;
    const mockPermissionRepository = {
        findOneWhere: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionService,
                {
                    provide: getRepositoryToken(Permission),
                    useValue: mockPermissionRepository,
                },
            ],
        }).compile();

        service = module.get<PermissionService>(PermissionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const createPermissionDto: CreatePermissionDto = {
            permission_name: 'New Permission',
        };

        const savedPermission = {
            id: '1',
            permission_name: 'New Permission',
        };

        it('should create and return a permission', async () => {
            mockPermissionRepository.save.mockResolvedValue(savedPermission);

            const result = await service.create(createPermissionDto);

            expect(mockPermissionRepository.save).toHaveBeenCalledWith(createPermissionDto);
            expect(result).toEqual(expect.objectContaining(savedPermission));
        });
    });
    describe('findAll', () => {
        it('should return a list of Permission', async () => {
            const mockPermisisons = [new Permission(), new Permission()];
            mockPermissionRepository.find.mockResolvedValue(mockPermisisons);

            const result = await service.findAll();

            expect(mockPermissionRepository.find).toHaveBeenCalled();
            expect(result).toEqual([plainToInstance(Permission, mockPermisisons)]);
        });
    });

    describe('findAllWithCount', () => {
        it('should return a list of permissions with a count', async () => {
            const mockPermissions = [new Permission(), new Permission()];
            const mockCount = mockPermissions.length;
            mockPermissionRepository.findAndCount.mockResolvedValue([mockPermissions, mockCount]);

            const where = {};
            const result = await service.findAllWithCount(where);

            expect(mockPermissionRepository.findAndCount).toHaveBeenCalledWith(where);
            expect(result).toEqual([plainToInstance(Permission, mockPermissions), mockCount]);
        });
    });

    describe('find', () => {
        it('should return a list of permissions', async () => {
            const mockPermissions = [new Permission(), new Permission()];
            mockPermissionRepository.find.mockResolvedValue([mockPermissions]);

            const where = {};
            const result = await service.find(where);

            expect(mockPermissionRepository.find).toHaveBeenCalledWith(where);
            expect(result).toEqual([plainToInstance(Permission, mockPermissions)]);
        });
    });

    describe('findOne', () => {
        it('should return a permission by id', async () => {
            const mockPermission = new Permission();
            mockPermission.id = '1';
            mockPermissionRepository.findOne.mockResolvedValue(mockPermission);

            const result = await service.findOne('1');

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual(plainToInstance(Permission, mockPermission));
        });
        it('should throw NotFoundException when role is not found', async () => {
            mockPermissionRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(
                new NotFoundException(SUCCESS.RECORD_NOT_FOUND('Permission')),
            );

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'non-existent-id' },
            });
        });
    });

    describe('findOneWhere', () => {
        it('should return a permission based on conditions', async () => {
            const mockPermission = new Permission();
            mockPermission.id = '1';
            mockPermission.permission_name = 'Test Section';
            const where = { where: { permission_name: 'Test Section' } };
            mockPermissionRepository.findOne.mockResolvedValue(mockPermission);

            const result = await service.findOneWhere(where);

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith(where);
            expect(result).toEqual(mockPermission);
        });
        it('should return undefined when no Permission record is found', async () => {
            const where = { where: { id: '2' } };
            mockPermissionRepository.findOne.mockResolvedValue(undefined);

            const result = await service.findOneWhere(where);

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith(where);
            expect(result).toBeUndefined();
        });
    });

    describe('update', () => {
        const id = '1';
        const mockPermission = new Permission();
        const updatePermissionDto: UpdatePermissionDto = { permission_name: 'Updated Permission Name' };

        it('should successfully update a permission and return the updated record', async () => {
            // Arrange
            const updatedPermission = { ...mockPermission, permission_name: updatePermissionDto.permission_name };

            mockPermissionRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(updatedPermission);

            mockPermissionRepository.update.mockResolvedValue(undefined);

            const result = await service.update(id, updatePermissionDto);

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    permission_name: updatePermissionDto.permission_name,
                    id: expect.not.stringMatching(id),
                },
            });
            expect(mockPermissionRepository.update).toHaveBeenCalledWith(id, updatePermissionDto);
            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({ where: { id } });
            expect(result).toEqual(updatedPermission);
        });

        it('should throw a ConflictException if a permission with the same name exists', async () => {
            const existingPermission = { id: '2', permission_name: 'Updated Permission Name' };
            mockPermissionRepository.findOne.mockResolvedValue(existingPermission);

            await expect(service.update(id, updatePermissionDto)).rejects.toThrow(
                new ConflictException(ERROR.ALREADY_EXISTS('Permission')),
            );

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    permission_name: updatePermissionDto.permission_name,
                    id: expect.not.stringMatching(id),
                },
            });
            expect(mockPermissionRepository.update).not.toHaveBeenCalled();
        });

        it('should throw a NotFoundException if permission to update is not found after update', async () => {
            mockPermissionRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

            mockPermissionRepository.update.mockResolvedValue(undefined);

            // Act & Assert
            await expect(service.update(id, updatePermissionDto)).rejects.toThrow(
                new NotFoundException(`Permission Not Found.`),
            );

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: {
                    permission_name: updatePermissionDto.permission_name,
                    id: expect.not.stringMatching(id),
                },
            });
            expect(mockPermissionRepository.update).toHaveBeenCalledWith(id, updatePermissionDto);
            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({ where: { id } });
        });
    });

    describe('remove', () => {
        it('should soft delete a permission by updating the deleted_at field', async () => {
            const id = '1';
            mockPermissionRepository.update.mockResolvedValue(undefined);

            await service.remove(id);

            expect(mockPermissionRepository.update).toHaveBeenCalledWith(
                { id: id, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
        });
    });
    describe('createPermission', () => {
        it('should throw ConflictException if the permission already exists', async () => {
            const createPermissionDto: CreatePermissionDto = { permission_name: 'Existing Permission' };

            mockPermissionRepository.findOne.mockResolvedValue({ id: '1', permission_name: 'Existing Permission' });

            await expect(service.createPermission(createPermissionDto)).rejects.toThrow(
                new ConflictException(ERROR.ALREADY_EXISTS('Permission')),
            );

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: { permission_name: createPermissionDto.permission_name },
            });
        });

        it('should create a permission if it does not already exist', async () => {
            const createPermissionDto: CreatePermissionDto = { permission_name: 'New Permission' };
            const newPermission = { id: '2', permission_name: 'New Permission' };

            mockPermissionRepository.findOne.mockResolvedValue(null);

            mockPermissionRepository.save.mockResolvedValue(newPermission);

            const result = await service.createPermission(createPermissionDto);

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: { permission_name: createPermissionDto.permission_name },
            });
            expect(mockPermissionRepository.save).toHaveBeenCalledWith(createPermissionDto);
            expect(result).toEqual(newPermission);
        });
    });
    describe('findAllPermissions', () => {
        it('should return paginated permissions with search and order applied', async () => {
            const limit = 10;
            const offset = 0;
            const search = 'Test';
            const order: { [key: string]: 'ASC' | 'DESC' } = { permission_name: 'ASC' };
            const mockSections = [new Permission(), new Permission()];
            const mockCount = mockSections.length;
            mockPermissionRepository.findAndCount.mockResolvedValue([mockSections, mockCount]);

            const result = await service.findAllPermission(limit, offset, search, order);

            expect(mockPermissionRepository.findAndCount).toHaveBeenCalledWith({
                where: {
                    permission_name: ILike(`%${search}%`),
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

        it('should return paginated permissions without search', async () => {
            const limit = 10;
            const offset = 0;
            const search = '';
            const order: { [key: string]: 'ASC' | 'DESC' } = { permission_name: 'ASC' };
            const mockSections = [new Permission(), new Permission()];
            const mockCount = mockSections.length;

            mockPermissionRepository.findAndCount.mockResolvedValue([mockSections, mockCount]);

            const result = await service.findAllPermission(limit, offset, search, order);

            expect(mockPermissionRepository.findAndCount).toHaveBeenCalledWith({
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
            const order: { [key: string]: 'ASC' | 'DESC' } = { permission_name: 'ASC' };
            const mockPermisisons = [new Permission(), new Permission()];
            const mockCount = mockPermisisons.length;

            mockPermissionRepository.findAndCount.mockResolvedValue([mockPermisisons, mockCount]);

            const result = await service.findAllPermission(limit, offset, search, order);

            expect(mockPermissionRepository.findAndCount).toHaveBeenCalledWith({
                where: {},
                order: order,
                take: +limit,
                skip: +offset,
            });

            expect(result).toEqual({
                total: mockCount,
                limit: +limit,
                offset: +offset,
                data: mockPermisisons,
            });
        });
    });
    describe('findOnePermission', () => {
        it('should return a permission when found', async () => {
            const permissionId = '1';
            const mockPermisison = new Permission();

            mockPermissionRepository.findOne.mockResolvedValue(mockPermisison);

            const result = await service.findOnePermission(permissionId);

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: { id: permissionId },
            });
            expect(result).toEqual(mockPermisison);
        });

        it('should throw a NotFoundException when section is not found', async () => {
            const sectionId = '1';

            mockPermissionRepository.findOne.mockResolvedValue(null);

            await expect(service.findOnePermission(sectionId)).rejects.toThrow(
                new NotFoundException(SUCCESS.RECORD_NOT_FOUND('Permission')),
            );
            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: { id: sectionId },
            });
        });
    });
    describe('updatePermission', () => {
        const permissionId = '1';
        const updatePermissionDto: UpdatePermissionDto = { permission_name: 'Updated Permission' };
        const updatedPermission = { id: '1', permission_name: 'Updated Permission' };
        it('should successfully update and return the permission', async () => {
            service.update = jest.fn().mockResolvedValue(updatedPermission);

            const result = await service.updatePermission(permissionId, updatePermissionDto);

            expect(service.update).toHaveBeenCalledWith(permissionId, updatePermissionDto);
            expect(result).toEqual(updatedPermission);
        });

        it('should throw a NotFoundException if the permission is not found', async () => {
            service.update = jest.fn().mockRejectedValue(new NotFoundException('Permisison not found'));

            await expect(service.updatePermission(permissionId, updatePermissionDto)).rejects.toThrow(
                NotFoundException,
            );
            expect(service.update).toHaveBeenCalledWith(permissionId, updatePermissionDto);
        });

        it('should throw a ConflictException if there is a conflict during update', async () => {
            service.update = jest.fn().mockRejectedValue(new ConflictException('Permission already exists'));

            await expect(service.updatePermission(permissionId, updatePermissionDto)).rejects.toThrow(
                ConflictException,
            );
            expect(service.update).toHaveBeenCalledWith(permissionId, updatePermissionDto);
        });
    });
    describe('deletePermission', () => {
        const mockPermission = new Permission();
        it('should delete a permission if it exists', async () => {
            mockPermissionRepository.findOne.mockResolvedValue(mockPermission);

            const result = await service.deletePermission('1');

            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
            });

            expect(mockPermissionRepository.update).toHaveBeenCalledWith(
                { id: '1', deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
            expect(result).toBeUndefined();
        });

        it('should throw a NotFoundException when section is not found', async () => {
            const sectionId = '1';

            mockPermissionRepository.findOne.mockResolvedValue(null);

            await expect(service.findOnePermission(sectionId)).rejects.toThrow(
                new NotFoundException(SUCCESS.RECORD_NOT_FOUND('Permission')),
            );
            expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
                where: { id: sectionId },
            });
        });
    });
});
