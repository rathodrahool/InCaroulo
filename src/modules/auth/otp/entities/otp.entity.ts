import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DefaultEntity } from '@shared/entities/default.entity';
import { User } from '@modules/user/entities/user.entity';
import { DefaultStatus, VerificationType } from '@shared/constants/enum';
@Entity('otp')
export class Otp extends DefaultEntity {
    @Column({
        type: 'enum',
        enum: DefaultStatus,
        default: DefaultStatus.ACTIVE,
    })
    status: DefaultStatus;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User | null;

    @Column({ type: 'integer' })
    otp: number;

    @Column({ type: 'character varying', length: 5, nullable: true })
    country_code: string;

    @Column({ type: 'character varying', length: 15, nullable: true })
    contact_number: string;

    @Column({ type: 'text', nullable: true })
    email: string;
    @Column({
        type: 'enum',
        enum: VerificationType,
    })
    type: VerificationType;

    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @Column({ type: 'timestamp with time zone', nullable: true })
    expire_at: Date;
}
