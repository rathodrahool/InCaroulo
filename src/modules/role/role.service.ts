// NestJS common decorators and utilities
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// TypeORM
import { FindManyOptions, FindOneOptions, ILike, IsNull, Repository } from 'typeorm';

// Entities
import { Role } from './entities/role.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';

// Transformation and Serialization
import { plainToClass, plainToInstance } from 'class-transformer';

// DTO (Data Transfer Objects)
import { CreateRoleDto } from './dto/create.role.dto';
import { UpdateRoleDto } from './dto/update.role.dto';

// Constants and Helpers
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { parseSearchKeyword } from '@shared/helpers/common.functions';

// Services
import { SectionService } from '@modules/section/section.service';
import { PermissionService } from '@modules/permission/permission.service';
import { Pagination } from '@shared/interfaces/interfaces';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        private readonly sectionService: SectionService,
        private readonly permissionService: PermissionService,
        @InjectRepository(RoleSectionPermission)
        private readonly roleSectionPermissionRepository: Repository<RoleSectionPermission>,
    ) {}

    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const result = await this.roleRepository.save(createRoleDto);
        return plainToClass(Role, result);
    }

    async findOneWhere(where: FindOneOptions<Role>) {
        const record = await this.roleRepository.findOne(where);
        return record;
    }

    async findAllWithCount(where: FindManyOptions<Role>): Promise<[Role[], number]> {
        const [list, count] = await this.roleRepository.findAndCount(where);
        return [plainToInstance(Role, list), count];
    }

    async count(where: FindManyOptions<Role>): Promise<number> {
        const count = await this.roleRepository.count(where);
        return count;
    }

    async findOne(id: string): Promise<Role> {
        const record = await this.roleRepository.findOne({
            where: { id },
            relations: ['roleSectionPermissions'],
        });
        if (!record) {
            throw new NotFoundException(SUCCESS.RECORD_NOT_FOUND('Role'));
        }

        return plainToClass(Role, record);
    }

    async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.roleRepository.findOne({ where: { id } });
        if (role) {
            await this.roleRepository.save({ ...role, ...updateRoleDto });
        }
        const updatedRecord = await this.findOne(id);
        return updatedRecord;
    }

    async remove(id: string) {
        await this.roleRepository.update(
            { id: id, deleted_at: IsNull() },
            {
                deleted_at: new Date().toISOString(),
            },
        );
    }

    async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
        const { role_name, permissions } = createRoleDto;

        // Check if role already exists and
        const existingRole = await this.findOneWhere({
            where: { role_name },
        });
        if (existingRole) {
            throw new ConflictException(ERROR.ALREADY_EXISTS('Role'));
        }
        // Fetch all sections and permissions in parallel
        const sectionNames = permissions.map((permission) => permission.section);
        const sectionPromises = sectionNames.map((section) =>
            this.sectionService.findOneWhere({ where: { section_name: section } }),
        );

        const allSectionPermissions = permissions.flatMap((permission) => permission.section_permission);
        const permissionPromises = allSectionPermissions.map((permission) =>
            this.permissionService.findOneWhere({
                where: { permission_name: permission },
            }),
        );
        const sections = await Promise.all(sectionPromises);
        const permissionsList = await Promise.all(permissionPromises);

        // Validate sections
        for (const section of sections) {
            if (!section) {
                const missingSection = sectionNames[sections.indexOf(section)];
                throw new BadRequestException(ERROR.RECORD_NOT_FOUND(`Section ${missingSection}`));
            }
        }

        // Validate permissions
        for (const permission of permissionsList) {
            if (!permission) {
                const missingPermission = allSectionPermissions[permissionsList.indexOf(permission)];
                throw new BadRequestException(ERROR.RECORD_NOT_FOUND(`Permission ${missingPermission}`));
            }
        }

        // Create the role
        const savedRole = await this.create(createRoleDto);

        // Associate role with permissions and sections
        const roleSectionPermissions = [];
        for (const permission of permissions) {
            const section = sections.find((sec) => sec.section_name === permission.section);
            const sectionPermissions = permissionsList.filter((per) =>
                permission.section_permission.includes(per.permission_name),
            );

            for (const permission of sectionPermissions) {
                const roleSectionPermission = new RoleSectionPermission();
                roleSectionPermission.role = savedRole;
                roleSectionPermission.section = section;
                roleSectionPermission.permission = permission;
                roleSectionPermissions.push(roleSectionPermission);
            }
        }

        await this.roleSectionPermissionRepository.save(roleSectionPermissions);

        return savedRole;
    }

    async findAllRole(
        limit: number,
        offset: number,
        search: string,
        order: { [key: string]: 'ASC' | 'DESC' },
    ): Promise<Pagination<Role>> {
        const where = {};
        if (search) {
            Object.assign(where, {
                role_name: ILike(`%${parseSearchKeyword(search)}%`),
            });
        }

        const [list, count]: [Role[], number] = await this.findAllWithCount({
            where: where,
            order: order,
            take: +limit,
            skip: +offset,
        });

        return {
            total: count,
            limit: +limit,
            offset: +offset,
            data: list,
        };
    }

    async findOneRole(id: string): Promise<Role> {
        const result = await this.findOne(id);
        return result;
    }

    async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<void> {
        const { permissions } = updateRoleDto;

        // Check if role exists
        const role = await this.findOne(id);

        // Update the role
        await this.update(id, updateRoleDto);

        await this.roleSectionPermissionRepository.update(
            { role: { id: id }, deleted_at: IsNull() },
            {
                deleted_at: new Date().toISOString(),
            },
        );

        // Fetch sections and permissions in parallel
        const sectionNames = permissions.map((permission) => permission.section);
        const sectionPromises = sectionNames.map((section) =>
            this.sectionService.findOneWhere({ where: { section_name: section } }),
        );

        const allSectionPermissions = permissions.flatMap((permission) => permission.section_permission);
        const permissionPromises = allSectionPermissions.map((permission) =>
            this.permissionService.findOneWhere({
                where: { permission_name: permission },
            }),
        );

        const sections = await Promise.all(sectionPromises);
        const permissionsList = await Promise.all(permissionPromises);

        // Validate sections
        for (const section of sections) {
            if (!section) {
                const missingSection = sectionNames[sections.indexOf(section)];
                throw new NotFoundException(ERROR.RECORD_NOT_FOUND(`Section ${missingSection}`));
            }
        }

        // Validate permissions
        for (const permission of permissionsList) {
            if (!permission) {
                const missingPermission = allSectionPermissions[permissionsList.indexOf(permission)];
                throw new NotFoundException(ERROR.RECORD_NOT_FOUND(`Permission ${missingPermission}`));
            }
        }

        // Create roleSectionPermission entities for valid sections and permissions
        const roleSectionPermissions = [];
        for (const permission of permissions) {
            const section = sections.find((sec) => sec.section_name === permission.section);
            const sectionPermissions = permissionsList.filter((per) =>
                permission.section_permission.includes(per.permission_name),
            );

            for (const permission of sectionPermissions) {
                const roleSectionPermission = new RoleSectionPermission();
                roleSectionPermission.role = role;
                roleSectionPermission.section = section;
                roleSectionPermission.permission = permission;
                roleSectionPermissions.push(roleSectionPermission);
            }
        }

        await this.roleSectionPermissionRepository.save(roleSectionPermissions);
    }

    async removeRole(id: string): Promise<void> {
        await this.findOne(id);

        await this.roleSectionPermissionRepository.update(
            { role: { id: id }, deleted_at: IsNull() },
            {
                deleted_at: new Date().toISOString(),
            },
        );
        await this.remove(id);
    }
}
