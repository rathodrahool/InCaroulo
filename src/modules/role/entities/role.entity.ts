import { Entity, Column, OneToMany } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { DefaultEntity } from '@shared/entities/default.entity';
import { Admin } from '@modules/admin/entities/admin.entity';

@Entity('roles')
export class Role extends DefaultEntity {
    @Column({ unique: true })
    role_name: string;

    @OneToMany(() => User, (user) => user.role)
    users: User[];

    @OneToMany(() => Admin, (admin) => admin.role)
    admin: Admin[];

    @OneToMany(() => RoleSectionPermission, (rmp) => rmp.role)
    roleSectionPermissions: RoleSectionPermission[];
}
