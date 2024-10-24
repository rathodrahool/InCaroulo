// create-role.dto.ts
class PermissionDto {
    section: string;
    section_permission: string[];
}

export class CreateRoleDto {
    role_name: string;
    description: string;
    permissions: PermissionDto[];
}
