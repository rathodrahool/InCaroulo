import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { DefaultEntity } from '@shared/entities/default.entity';
import { Role } from '@modules/role/entities/role.entity';

@Entity('admins')
export class Admin extends DefaultEntity {
    @Column({ length: 255 })
    first_name: string;

    @Column({ length: 255 })
    last_name: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Exclude()
    @Column({ length: 255 })
    password: string;

    @ManyToOne(() => Role, (role) => role.users, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'role_id' })
    role: Role;
}
