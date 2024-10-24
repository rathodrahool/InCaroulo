import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePermission } from '@shared/interfaces/interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { In, Repository } from 'typeorm';
import { RoleService } from '@modules/role/role.service';
import { hasPermission } from '@shared/helpers/common.functions';
import { ROLES_KEY } from '@decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectRepository(RoleSectionPermission)
        private readonly roleSectionPermissionRepository: Repository<RoleSectionPermission>,
        private readonly roleService: RoleService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<RolePermission[]>(ROLES_KEY, context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0) {
            return false;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not found in request.');
        }

        const allRoles = requiredRoles.map((role) => role.role);
        const queryCondition =
            user.roleName === 'admin'
                ? { admin: { id: user.id }, role_name: In(allRoles) }
                : { users: { id: user.id }, role_name: In(allRoles) };

        const userRole = await this.roleService.findOneWhere({ where: queryCondition });

        if (!userRole) {
            throw new ForbiddenException('User does not have the required roles.');
        }

        const permissionGranted = await hasPermission(this.roleSectionPermissionRepository, requiredRoles, userRole.id);

        if (!permissionGranted) {
            throw new ForbiddenException('User does not have the required permissions.');
        }

        return true;
    }
}
