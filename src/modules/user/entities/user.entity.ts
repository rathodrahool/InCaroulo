import { Entity, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { Exclude } from 'class-transformer';
import { DefaultEntity } from '@shared/entities/default.entity';
import { Role } from '@modules/role/entities/role.entity';
import { UserStatus } from '@shared/constants/enum';
import { Otp } from '@modules/auth/otp/entities/otp.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';
import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';

@Entity('users')
export class User extends DefaultEntity {
    @Column({ length: 255, nullable: true })
    full_name: string;

    @Column({ unique: true, length: 255, nullable: true })
    email: string;

    @Exclude()
    @Column({ length: 255, nullable: true })
    password: string;

    @Column({ type: 'character varying', nullable: true })
    base_url: string;

    @Column({ type: 'character varying', nullable: true })
    internal_path: string;

    @Column({ type: 'character varying', nullable: true })
    external_path: string;

    @Column({ type: 'character varying', nullable: true })
    image: string;

    @Column({ type: 'character varying', nullable: true })
    block_reason: string;

    @Column({ type: 'text', nullable: true })
    google_id: string;

    @OneToMany(() => Tokens, (token) => token.user)
    token: Tokens[];

    @OneToMany(() => Otp, (otp) => otp.user)
    otp: Otp[];

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.UNVERIFIED,
    })
    status: UserStatus;

    @ManyToOne(() => Role, (role) => role.users, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @OneToMany(() => DeviceInformation, (deviceInformation) => deviceInformation.user)
    devices: DeviceInformation[];
}
