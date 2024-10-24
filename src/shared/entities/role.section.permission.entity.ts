import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import { Section } from '@modules/section/entities/section.entity';
import { DefaultEntity } from './default.entity';

@Entity('role_section_permissions')
export class RoleSectionPermission extends DefaultEntity {
    @ManyToOne(() => Role, (role) => role.roleSectionPermissions, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Section, (section) => section.roleSectionPermission, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'section_id' })
    section: Section;

    @ManyToOne(() => Permission, (permission) => permission.roleSectionPermission, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;
}
