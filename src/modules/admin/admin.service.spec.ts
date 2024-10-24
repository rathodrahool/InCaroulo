import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create.admin.dto';
import { RoleService } from '../role/role.service';
import { AuthService } from '../auth/auth.service';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import { plainToInstance } from 'class-transformer';
import { IsNull } from 'typeorm';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginAdminDto } from './dto/login.admin.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenTypeEnum } from '@root/src/shared/constants/enum';
import * as tokenUtils from '@shared/helpers/common.functions';
import { ChangePasswordDto } from './dto/change.password.dto';
import { AssignRoleDto } from './dto/assign.role.dto';
import { RemoveRoleDto } from './dto/remove.role.dto';
jest.mock('@shared/helpers/common.functions', () => ({
    generateTokens: jest.fn(),
}));
describe('AdminService', () => {
    let service: AdminService;
    let authService: AuthService;
    let tokenService: TokenService;
    let roleService: RoleService;
    let userService: UserService;
    const mockAdminRepository = {
        findOneWhere: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        count: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
    };
    const mockAuthService = {
        hashPassword: jest.fn(),
        validatePassword: jest.fn(),
    };

    const mockRolesService = {
        findOneWhere: jest.fn(),
    };

    const mockTokenService = {
        create: jest.fn(),
        findTokenRecord: jest.fn(),
        validateToken: jest.fn(),
        invalidateToken: jest.fn(),
        update: jest.fn(),
        findOneWhere: jest.fn(),
    };

    const mockUserService = {
        findOneWhere: jest.fn(),
    };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: getRepositoryToken(Admin),
                    useValue: mockAdminRepository,
                },
                {
                    provide: RoleService,
                    useValue: mockRolesService,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: TokenService,
                    useValue: mockTokenService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: JwtService,
                    useValue: {
                        verify: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findOneWhere: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        roleService = module.get<RoleService>(RoleService);
        tokenService = module.get<TokenService>(TokenService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const createAdminDto = new CreateAdminDto();
        it('should create and return a admin', async () => {
            mockAdminRepository.save.mockResolvedValue(createAdminDto);

            const result = await service.create(createAdminDto);

            expect(mockAdminRepository.save).toHaveBeenCalledWith(createAdminDto);
            expect(result).toEqual(expect.objectContaining(createAdminDto));
        });
    });

    describe('findAllWithCount', () => {
        it('should return a list of admin with a count', async () => {
            const mockAdmins = [new Admin(), new Admin()];
            const mockCount = mockAdmins.length;
            mockAdminRepository.findAndCount.mockResolvedValue([mockAdmins, mockCount]);

            const where = {};
            const result = await service.findAllWithCount(where);

            expect(mockAdminRepository.findAndCount).toHaveBeenCalledWith(where);
            expect(result).toEqual([plainToInstance(Admin, mockAdmins), mockCount]);
        });
    });
    describe('findAll', () => {
        it('should return a list of admin', async () => {
            const mockAdmins = [new Admin(), new Admin()];
            mockAdminRepository.find.mockResolvedValue(mockAdmins);

            const result = await service.findAll();

            expect(mockAdminRepository.find).toHaveBeenCalled();
            expect(result).toEqual([plainToInstance(Admin, mockAdmins)]);
        });
    });
    describe('findOne', () => {
        it('should return a admin by id', async () => {
            const mockAdmin = new Admin();
            mockAdmin.id = '1';
            mockAdminRepository.findOne.mockResolvedValue(mockAdmin);

            const result = await service.findOne('1');

            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual(plainToInstance(Admin, mockAdmin));
        });
    });

    describe('findOneWhere', () => {
        it('should return a admin record based on where conditions', async () => {
            const whereCondition = { where: { email: 'test@example.com' } };
            const mockAdmin = { id: 'admin-id', email: 'test@example.com', name: 'Super Admin' };

            mockAdminRepository.findOne = jest.fn().mockResolvedValue(mockAdmin);

            const result = await service.findOneWhere(whereCondition);

            expect(mockAdminRepository.findOne).toHaveBeenCalledWith(whereCondition);
            expect(result).toEqual(mockAdmin);
        });

        it('should return null if no user record is found', async () => {
            const whereCondition = { where: { email: 'nonexistent@example.com' } };

            mockAdminRepository.findOne = jest.fn().mockResolvedValue(null);

            const result = await service.findOneWhere(whereCondition);

            expect(mockAdminRepository.findOne).toHaveBeenCalledWith(whereCondition);
            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a admin record with the given updateAdminDto', async () => {
            const adminId = 'admin-id';
            const updateAdminDto: UpdateAdminDto = {
                email: 'updated@example.com',
                first_name: 'Updated Name',
            };

            const mockUpdateResult = {
                affected: 1,
            };

            mockAdminRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            const result = await service.update(adminId, updateAdminDto);

            expect(mockAdminRepository.update).toHaveBeenCalledWith(adminId, updateAdminDto);
            expect(result).toEqual(mockUpdateResult);
        });

        it('should throw a NotFoundException if no admin record is updated', async () => {
            const adminId = 'nonexistent-admin-id';
            const updateAdminDto: UpdateAdminDto = {
                email: 'nonexistent@example.com',
                first_name: 'Nonexistent Name',
            };

            const mockUpdateResult = {
                affected: 0, // No records were updated
            };

            mockAdminRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            await expect(service.update(adminId, updateAdminDto)).rejects.toThrow(NotFoundException);

            expect(mockAdminRepository.update).toHaveBeenCalledWith(adminId, updateAdminDto);
        });
    });

    describe('remove', () => {
        it('should successfully soft-delete a admin by updating the deleted_at field', async () => {
            const adminId = 'valid-admin-id';
            const mockUpdateResult = {
                affected: 1, // Simulate that one record was updated
            };

            mockAdminRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            const result = await service.remove(adminId);

            expect(mockAdminRepository.update).toHaveBeenCalledWith(
                { id: adminId, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
            expect(result).toEqual(mockUpdateResult);
        });

        it('should throw a NotFoundException if no admin record is updated', async () => {
            const adminId = 'nonexistent-admin-id';
            const mockUpdateResult = {
                affected: 0,
            };

            mockAdminRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            await expect(service.remove(adminId)).rejects.toThrow(NotFoundException);

            expect(mockAdminRepository.update).toHaveBeenCalledWith(
                { id: adminId, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
        });
    });
    describe('count', () => {
        it('should return the count of admins', async () => {
            const mockCount = 5;
            const where = {};
            mockAdminRepository.count.mockResolvedValue(mockCount);

            const result = await service.count(where);

            expect(mockAdminRepository.count).toHaveBeenCalledWith(where);
            expect(result).toEqual(mockCount);
        });

        it('should return 0 when there are no Section', async () => {
            const where = { where: { deleted_at: IsNull() } };
            const expectedCount = 0;

            mockAdminRepository.count.mockResolvedValue(expectedCount);

            const result = await service.count(where);

            expect(mockAdminRepository.count).toHaveBeenCalledWith(where);
            expect(result).toBe(expectedCount);
        });
    });
    describe('validateAdmin', () => {
        it('should return true if admin is found', async () => {
            const mockAdmin = new Admin();
            mockAdminRepository.findOne.mockResolvedValue(mockAdmin);

            const result = await service.validateAdmin('1');
            expect(result).toBe(true);
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
        });

        it('should return false if admin is not found', async () => {
            mockAdminRepository.findOne.mockResolvedValue(null);

            const result = await service.validateAdmin('1');
            expect(result).toBe(false);
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
        });
    });

    describe('getAdminRole', () => {
        it('should return the role name if admin is found', async () => {
            const mockAdmin = {
                id: '1',
                role: { role_name: 'Admin' },
            } as Admin;
            mockAdminRepository.findOne.mockResolvedValue(mockAdmin);

            const result = await service.getAdminRole('1');
            expect(result).toBe('Admin');
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['role'],
            });
        });

        it('should return null if admin is not found', async () => {
            mockAdminRepository.findOne.mockResolvedValue(null);

            const result = await service.getAdminRole('1');
            expect(result).toBeNull();
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['role'],
            });
        });
    });

    describe('isAdmin', () => {
        it('should return true if admin is found', async () => {
            const mockAdmin = new Admin();
            mockAdminRepository.findOne.mockResolvedValue(mockAdmin);

            const result = await service.isAdmin('1');
            expect(result).toBe(true);
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
        });

        it('should return false if admin is not found', async () => {
            mockAdminRepository.findOne.mockResolvedValue(null);

            const result = await service.isAdmin('1');
            expect(result).toBe(false);
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
        });
    });
    describe('adminSignUp', () => {
        const createAdminDto: CreateAdminDto = {
            first_name: 'test',
            last_name: 'user',
            email: 'admin@example.com',
            password: 'hashedPassword',
        };

        it('should throw ConflictException if admin already exists', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValue(new Admin());

            await expect(service.adminSignUp(createAdminDto)).rejects.toThrow(ConflictException);
        });

        it('should create a new admin', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValue(null);
            roleService.findOneWhere = jest.fn().mockResolvedValue({ id: '1', role_name: 'admin' });
            authService.hashPassword = jest.fn().mockResolvedValue('hashedPassword');
            mockAdminRepository.save = jest.fn().mockResolvedValue(new Admin());

            await service.adminSignUp(createAdminDto);

            expect(roleService.findOneWhere).toHaveBeenCalledWith({ where: { role_name: 'admin' } });
            expect(authService.hashPassword).toHaveBeenCalledWith(createAdminDto.password);
            expect(mockAdminRepository.save).toHaveBeenCalledWith({
                ...createAdminDto,
                role: { id: '1', role_name: 'admin' },
            });
        });
    });
    describe('adminLogin', () => {
        const loginAdminDto: LoginAdminDto = {
            email: 'admin@example.com',
            password: 'password123',
        };

        const mockAdmin = {
            id: '1',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: { role_name: 'admin' },
        };

        const mockAccessToken = 'accessToken123';
        const mockAccessTokenExpiryTime = new Date();

        beforeEach(() => {
            jest.clearAllMocks(); // Clear any previous mocks
        });

        it('should throw UnauthorizedException if admin does not exist', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(null);

            await expect(service.adminLogin(loginAdminDto)).rejects.toThrow(UnauthorizedException);
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({
                where: { email: loginAdminDto.email },
                relations: ['role'],
            });
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(mockAdmin);
            authService.validatePassword = jest.fn().mockResolvedValueOnce(false);

            await expect(service.adminLogin(loginAdminDto)).rejects.toThrow(UnauthorizedException);
            expect(authService.validatePassword).toHaveBeenCalledWith(loginAdminDto.password, mockAdmin.password);
        });

        it('should return access token and admin details if credentials are valid', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(mockAdmin);
            authService.validatePassword = jest.fn().mockResolvedValueOnce(true);

            // Mock the return value of the generateTokens function
            (tokenUtils.generateTokens as jest.Mock).mockReturnValueOnce({
                accessToken: mockAccessToken,
                accessTokenExpiryTime: mockAccessTokenExpiryTime,
                refreshToken: null,
                refreshTokenExpiryTime: null,
            });

            tokenService.create = jest.fn().mockResolvedValueOnce({
                access_token: mockAccessToken,
                access_token_expiry: mockAccessTokenExpiryTime,
            });

            const result = await service.adminLogin(loginAdminDto);

            expect(tokenService.create).toHaveBeenCalledWith({
                entity: mockAdmin,
                access_token: mockAccessToken,
                access_token_expiry: mockAccessTokenExpiryTime,
                type: TokenTypeEnum.ACCESS,
            });

            expect(result).toEqual({
                id: mockAdmin.id,
                email: mockAdmin.email,
                access_token: mockAccessToken,
            });
        });
    });

    describe('changeAdminPassword', () => {
        const adminId = '1';
        const changePasswordDto: ChangePasswordDto = {
            old_password: 'oldPassword123',
            new_password: 'newPassword456',
        };

        const mockAdmin = {
            id: '1',
            password: 'hashedOldPassword',
        };

        it('should throw NotFoundException if admin does not exist', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(null);

            await expect(service.changeAdminPassword(adminId, changePasswordDto)).rejects.toThrow(NotFoundException);
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({ where: { id: adminId } });
        });

        it('should throw UnauthorizedException if the old password is incorrect', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(mockAdmin);
            authService.validatePassword = jest.fn().mockResolvedValueOnce(false);

            await expect(service.changeAdminPassword(adminId, changePasswordDto)).rejects.toThrow(
                UnauthorizedException,
            );
            expect(authService.validatePassword).toHaveBeenCalledWith(
                changePasswordDto.old_password,
                mockAdmin.password,
            );
        });

        it('should update the password if the old password is correct', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(mockAdmin);
            authService.validatePassword = jest.fn().mockResolvedValueOnce(true);
            authService.hashPassword = jest.fn().mockResolvedValueOnce('hashedNewPassword');

            mockAdminRepository.update = jest.fn().mockResolvedValueOnce({});

            await service.changeAdminPassword(adminId, changePasswordDto);

            expect(authService.validatePassword).toHaveBeenCalledWith(
                changePasswordDto.old_password,
                mockAdmin.password,
            );
            expect(authService.hashPassword).toHaveBeenCalledWith(changePasswordDto.new_password);
            expect(mockAdminRepository.update).toHaveBeenCalledWith(adminId, { password: 'hashedNewPassword' });
        });
    });

    describe('adminLogout', () => {
        const adminId = '1';
        const token = 'validAccessToken';
        const req = { token: token };

        const mockAdmin = {
            id: '1',
            role: { role_name: 'admin' },
        };

        const mockTokenRecord = {
            id: 'tokenId',
            access_token: token,
        };

        it('should throw UnauthorizedException if no token is provided', async () => {
            const reqWithoutToken = { token: null };

            await expect(service.adminLogout(adminId, reqWithoutToken)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw NotFoundException if admin does not exist', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(null); // Mock admin not found

            await expect(service.adminLogout(adminId, req)).rejects.toThrow(NotFoundException);
            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({
                where: { id: adminId },
                relations: ['role'],
            });
        });

        it('should invalidate the token if it exists', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(mockAdmin);
            mockTokenService.findOneWhere = jest.fn().mockResolvedValueOnce(mockTokenRecord); // Mock token found
            mockTokenService.invalidateToken = jest.fn().mockResolvedValueOnce({}); // Mock token invalidation

            await service.adminLogout(adminId, req);

            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({
                where: { id: adminId },
                relations: ['role'],
            });
            expect(mockTokenService.findOneWhere).toHaveBeenCalledWith({
                where: { admin: { id: mockAdmin.id }, access_token: token },
            });
            expect(mockTokenService.invalidateToken).toHaveBeenCalledWith(mockTokenRecord, TokenTypeEnum.ACCESS);
        });

        it('should not call invalidateToken if the token does not exist', async () => {
            mockAdminRepository.findOne = jest.fn().mockResolvedValueOnce(mockAdmin);
            mockTokenService.findOneWhere = jest.fn().mockResolvedValueOnce(null); // Mock token not found

            await service.adminLogout(adminId, req);

            expect(mockAdminRepository.findOne).toHaveBeenCalledWith({
                where: { id: adminId },
                relations: ['role'],
            });
            expect(mockTokenService.findOneWhere).toHaveBeenCalledWith({
                where: { admin: { id: mockAdmin.id }, access_token: token },
            });
            expect(mockTokenService.invalidateToken).not.toHaveBeenCalled();
        });
    });

    describe('assignRole', () => {
        const assignRoleDto: AssignRoleDto = {
            user_id: '1',
            role_id: '2',
        };

        const mockUser = {
            id: '1',
            role: { id: 'oldRoleId' },
        };

        const mockRole = {
            id: '2',
            role_name: 'admin',
        };

        it('should throw NotFoundException if the user does not exist', async () => {
            userService.findOneWhere = jest.fn().mockResolvedValueOnce(null);

            await expect(service.assignRole(assignRoleDto)).rejects.toThrow(NotFoundException);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: assignRoleDto.user_id },
                relations: ['role'],
            });
        });

        it('should throw NotFoundException if the role does not exist', async () => {
            userService.findOneWhere = jest.fn().mockResolvedValueOnce(mockUser);
            roleService.findOne = jest.fn().mockResolvedValueOnce(null);

            await expect(service.assignRole(assignRoleDto)).rejects.toThrow(NotFoundException);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: assignRoleDto.user_id },
                relations: ['role'],
            });
            expect(roleService.findOne).toHaveBeenCalledWith(assignRoleDto.role_id);
        });

        it('should assign the role to the user and update the user', async () => {
            userService.findOneWhere = jest.fn().mockResolvedValueOnce(mockUser);
            roleService.findOne = jest.fn().mockResolvedValueOnce(mockRole);
            userService.update = jest.fn().mockResolvedValueOnce({});

            await service.assignRole(assignRoleDto);

            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: assignRoleDto.user_id },
                relations: ['role'],
            });
            expect(roleService.findOne).toHaveBeenCalledWith(assignRoleDto.role_id);
            expect(userService.update).toHaveBeenCalledWith(mockUser.id, {
                ...mockUser,
                role: mockRole,
            });
        });
    });
    describe('removeRole', () => {
        const removeRoleDto: RemoveRoleDto = {
            user_id: '1',
            role_id: '2',
        };

        const mockUser = {
            id: '1',
            role: { id: '2', role_name: 'admin' },
        };

        const mockRole = {
            id: '2',
            role_name: 'admin',
        };
        const defaultRole = {
            id: 'defaultRoleId',
            role_name: 'user',
        };

        it('should throw NotFoundException if the user does not exist', async () => {
            userService.findOneWhere = jest.fn().mockResolvedValueOnce(null);

            await expect(service.removeRole(removeRoleDto)).rejects.toThrow(NotFoundException);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: removeRoleDto.user_id },
                relations: ['role'],
            });
        });

        it('should throw NotFoundException if the role does not exist', async () => {
            userService.findOneWhere = jest.fn().mockResolvedValueOnce(mockUser);
            roleService.findOne = jest.fn().mockResolvedValueOnce(null);

            await expect(service.removeRole(removeRoleDto)).rejects.toThrow(NotFoundException);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: removeRoleDto.user_id },
                relations: ['role'],
            });
            expect(roleService.findOne).toHaveBeenCalledWith(removeRoleDto.role_id);
        });

        it('should throw BadRequestException if the user does not have the role to remove', async () => {
            const mockUserWithDifferentRole = {
                ...mockUser,
                role: { id: 'differentRoleId' },
            };
            userService.findOneWhere = jest.fn().mockResolvedValueOnce(mockUserWithDifferentRole);
            roleService.findOne = jest.fn().mockResolvedValueOnce(mockRole);

            await expect(service.removeRole(removeRoleDto)).rejects.toThrow(BadRequestException);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: removeRoleDto.user_id },
                relations: ['role'],
            });
            expect(roleService.findOne).toHaveBeenCalledWith(removeRoleDto.role_id);
        });

        it('should remove the role and assign a default role if all conditions are met', async () => {
            userService.findOneWhere = jest.fn().mockResolvedValueOnce(mockUser);
            roleService.findOne = jest.fn().mockResolvedValueOnce(mockRole);
            roleService.findOneWhere = jest.fn().mockResolvedValueOnce(defaultRole);
            userService.update = jest.fn().mockResolvedValueOnce({});

            // Act
            await service.removeRole(removeRoleDto);

            // Assert
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: removeRoleDto.user_id },
                relations: ['role'],
            });
            expect(roleService.findOne).toHaveBeenCalledWith(removeRoleDto.role_id);
            expect(roleService.findOneWhere).toHaveBeenCalledWith({ where: { role_name: 'user' } });
            expect(userService.update).toHaveBeenCalledWith(mockUser.id, {
                ...mockUser,
                role: defaultRole,
            });
        });
    });
});
