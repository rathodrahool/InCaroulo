import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { ActivityType, DeviceType } from '@shared/constants/enum';
import { User } from '@modules/user/entities/user.entity';
import { DefaultEntity } from '@shared/entities/default.entity';
import { Tokens } from '@modules/token/entities/tokens.entity';

@Entity()
export class DeviceInformation extends DefaultEntity {
    @Column({ type: 'character varying', nullable: true })
    device_id: string;

    @Column({ type: 'character varying', nullable: true })
    device_name: string;

    @Column({ type: 'character varying', nullable: true })
    device_ip: string;

    @Column({ type: 'character varying', nullable: true })
    app_version: string;

    @Column({
        type: 'enum',
        enum: DeviceType,
        nullable: true,
    })
    device_type: DeviceType;

    @Column({
        type: 'enum',
        enum: ActivityType,
    })
    activity_type: ActivityType;

    @Column({
        type: 'character varying',
        nullable: true,
        default: 'UTC+05:30',
    })
    timezone: string;

    @Column({
        type: 'boolean',
        default: true,
    })
    is_active: boolean;

    @Column({ type: 'timestamp with time zone', nullable: true })
    last_active_at: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    registered_at: Date;

    @Column({ type: 'uuid', nullable: true })
    link_id: string;

    @ManyToOne(() => User, (user) => user.devices)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => Tokens, (token) => token.device)
    token: Tokens[];
}
