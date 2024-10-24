import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DefaultEntity } from '@shared/entities/default.entity';
import { User } from '@modules/user/entities/user.entity';
import { Admin } from '@modules/admin/entities/admin.entity';
import { DefaultStatus, TokenTypeEnum } from '@shared/constants/enum';
import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';

@Entity('tokens')
export class Tokens extends DefaultEntity {
    @Column({
        type: 'enum',
        enum: DefaultStatus,
        default: DefaultStatus.ACTIVE,
    })
    access_token_status: DefaultStatus;

    @Column({
        type: 'enum',
        enum: DefaultStatus,
        default: DefaultStatus.ACTIVE,
    })
    refresh_token_status: DefaultStatus;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'admin_id' })
    admin: Admin;

    @Column({ type: 'text' })
    access_token: string;

    @Column({ type: 'text', nullable: true })
    refresh_token: string;

    @Column({ type: 'text', nullable: true })
    firebase_token: string;

    @Column({ type: 'timestamp with time zone', nullable: true })
    access_token_expiry: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    refresh_token_expiry: Date;

    @Column({
        type: 'enum',
        enum: TokenTypeEnum,
        default: TokenTypeEnum.VERIFY,
    })
    type: TokenTypeEnum;

    @ManyToOne(() => DeviceInformation, (deviceInformation) => deviceInformation.token, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'device_id' })
    device: DeviceInformation;
}
