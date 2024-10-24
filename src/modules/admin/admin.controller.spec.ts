import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { CreateAdminDto } from './dto/create.admin.dto';
import { Response } from 'express';
import { AUTH_SUCCESS } from '@shared/constants/messages';
import { HttpStatus } from '@nestjs/common';
import { LoginAdminDto } from './dto/login.admin.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { AssignRoleDto } from './dto/assign.role.dto';
import { RemoveRoleDto } from './dto/remove.role.dto';

describe('AdminController', () => {
    let controller: AdminController;
    let adminService: AdminService;
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                {
                    provide: AdminService,
                    useValue: {
                        adminSignUp: jest.fn(),
                        adminLogin: jest.fn(),
                        changeAdminPassword: jest.fn(),
                        adminLogout: jest.fn(),
                        assignRole: jest.fn(),
                        removeRole: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AdminController>(AdminController);
        adminService = module.get<AdminService>(AdminService);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('adminSignUp', () => {
        it('should sign up an admin successfully', async () => {
            const createAdminDto: CreateAdminDto = {
                email: 'admin@example.com',
                password: 'password123',
                first_name: 'test',
                last_name: 'user',
            };

            (adminService.adminSignUp as jest.Mock).mockResolvedValue(undefined);

            await controller.adminSignUp(createAdminDto, mockResponse as Response);

            expect(adminService.adminSignUp).toHaveBeenCalledWith(createAdminDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.SIGN_UP,
            });
        });
    });

    describe('adminLogin', () => {
        it('should log in an admin successfully', async () => {
            const loginAdminDto: LoginAdminDto = {
                email: 'admin@example.com',
                password: 'password123',
            };

            const mockResult = {
                accessToken: 'mockAccessToken',
                refreshToken: 'mockRefreshToken',
            };

            (adminService.adminLogin as jest.Mock).mockResolvedValue(mockResult);

            await controller.adminLogin(loginAdminDto, mockResponse as Response);

            expect(adminService.adminLogin).toHaveBeenCalledWith(loginAdminDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.LOGIN,
                data: mockResult,
            });
        });
    });

    describe('changeAdminPassword', () => {
        it('should change admin password successfully', async () => {
            const changePasswordDto: ChangePasswordDto = {
                old_password: 'oldPassword123',
                new_password: 'newPassword123',
            };

            const mockRequest = {
                user: { id: '1' },
            };

            (adminService.changeAdminPassword as jest.Mock).mockResolvedValue(undefined);

            await controller.changeAdminPassword(changePasswordDto, mockRequest as any, mockResponse as Response);

            expect(adminService.changeAdminPassword).toHaveBeenCalledWith('1', changePasswordDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.PASSWORD_RESET,
            });
        });
    });

    describe('adminLogout', () => {
        it('should log out an admin successfully', async () => {
            const mockRequest = {
                user: { id: '1' },
            };

            (adminService.adminLogout as jest.Mock).mockResolvedValue(undefined);

            await controller.adminLogout(mockRequest as any, mockResponse as Response);

            expect(adminService.adminLogout).toHaveBeenCalledWith('1', mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.LOGOUT,
            });
        });
    });

    describe('assignRole', () => {
        it('should assign a role successfully', async () => {
            const assignRoleDto: AssignRoleDto = {
                user_id: '123',
                role_id: '456',
            };

            (adminService.assignRole as jest.Mock).mockResolvedValue(undefined);

            await controller.assignRole(assignRoleDto, mockResponse as Response);

            expect(adminService.assignRole).toHaveBeenCalledWith(assignRoleDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.ROLE_ASSIGNED,
            });
        });
    });

    describe('removeRole', () => {
        it('should remove a role successfully', async () => {
            const removeRoleDto: RemoveRoleDto = {
                user_id: '123',
                role_id: '456',
            };

            (adminService.removeRole as jest.Mock).mockResolvedValue(undefined);

            await controller.removeRole(removeRoleDto, mockResponse as Response);

            expect(adminService.removeRole).toHaveBeenCalledWith(removeRoleDto);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.ROLE_REMOVED,
            });
        });
    });
});
