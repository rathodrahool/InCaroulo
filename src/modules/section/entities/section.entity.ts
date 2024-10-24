import { DefaultEntity } from '@shared/entities/default.entity';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity('sections')
export class Section extends DefaultEntity {
    @Column({ unique: true })
    section_name: string;

    @OneToMany(() => RoleSectionPermission, (rmp) => rmp.section)
    roleSectionPermission: RoleSectionPermission[];
}
