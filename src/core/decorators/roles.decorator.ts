import { SetMetadata } from '@nestjs/common';
import { RolePermission } from '@shared/interfaces/interfaces';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolePermission[]) => SetMetadata(ROLES_KEY, roles);
