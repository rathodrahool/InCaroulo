import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { RoleService } from '@modules/role/role.service';
import { hasPermission } from '@shared/helpers/common.functions';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { Repository } from 'typeorm';
import { ROLES_KEY } from '../decorators/roles.decorator';

jest.mock('@shared/helpers/common.functions');

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;
    let roleService: RoleService;
    let roleSectionPermissionRepository: Repository<RoleSectionPermission>;

    beforeEach(async () => {
        reflector = { get: jest.fn() } as any;
        roleService = { findOneWhere: jest.fn() } as any;
        roleSectionPermissionRepository = {} as any;

        guard = new RolesGuard(reflector, roleSectionPermissionRepository, roleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return false if no required roles are defined', async () => {
        (reflector.get as jest.Mock).mockReturnValue(undefined);

        const mockRequest = { user: { id: 1, roleName: 'admin' } };
        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
            getHandler: jest.fn().mockReturnValue(() => {}),
        } as any;

        const result = await guard.canActivate(context);

        expect(result).toBe(false);
        expect(reflector.get).toHaveBeenCalledWith(ROLES_KEY, context.getHandler());
    });

    it('should throw ForbiddenException if no user is found in the request', async () => {
        (reflector.get as jest.Mock).mockReturnValue([{ role: 'admin', permission: 'read' }]);

        const mockRequest = { user: undefined }; // No user found
        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
            getHandler: jest.fn().mockReturnValue(() => {}),
        } as any;

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if the user does not have the required roles', async () => {
        const mockRequiredRoles = [{ role: 'admin', permission: 'read' }];
        (reflector.get as jest.Mock).mockReturnValue(mockRequiredRoles);

        const mockRequest = { user: { id: 1, roleName: 'user' } }; // User has wrong role
        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
            getHandler: jest.fn().mockReturnValue(() => {}),
        } as any;

        (roleService.findOneWhere as jest.Mock).mockResolvedValue(null); // Simulate no matching roles

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        expect(roleService.findOneWhere).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if the user does not have the required permissions', async () => {
        const mockRequiredRoles = [{ role: 'admin', permission: 'write' }];
        (reflector.get as jest.Mock).mockReturnValue(mockRequiredRoles);

        const mockRequest = { user: { id: 1, roleName: 'admin' } }; // User with role
        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
            getHandler: jest.fn().mockReturnValue(() => {}),
        } as any;

        (roleService.findOneWhere as jest.Mock).mockResolvedValue({ id: 1, roleName: 'admin' });
        (hasPermission as jest.Mock).mockResolvedValue(false); // Simulate no permission

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        expect(hasPermission).toHaveBeenCalledWith(roleSectionPermissionRepository, mockRequiredRoles, 1);
    });

    it('should return true if the user has the required role and permissions', async () => {
        const mockRequiredRoles = [{ role: 'admin', permission: 'read' }];
        (reflector.get as jest.Mock).mockReturnValue(mockRequiredRoles);

        const mockRequest = { user: { id: 1, roleName: 'admin' } };
        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
            getHandler: jest.fn().mockReturnValue(() => {}),
        } as any;

        (roleService.findOneWhere as jest.Mock).mockResolvedValue({ id: 1, roleName: 'admin' });
        (hasPermission as jest.Mock).mockResolvedValue(true); // Simulate permission granted

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(roleService.findOneWhere).toHaveBeenCalled();
        expect(hasPermission).toHaveBeenCalledWith(roleSectionPermissionRepository, mockRequiredRoles, 1);
    });
});
