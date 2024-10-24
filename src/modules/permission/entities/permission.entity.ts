import { DefaultEntity } from '@shared/entities/default.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity('permissions')
export class Permission extends DefaultEntity {
    @Column({ unique: true })
    permission_name: string;

    @OneToMany(() => RoleSectionPermission, (rmp) => rmp.permission)
    roleSectionPermission: RoleSectionPermission[];
}
