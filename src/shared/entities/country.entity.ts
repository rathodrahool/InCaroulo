import { Column, Entity } from 'typeorm';
import { DefaultEntity } from './default.entity';

import { DefaultStatus } from '@shared/constants/enum';

@Entity()
export class Country extends DefaultEntity {
    @Column({ type: 'character varying' })
    name: string;

    @Column({ type: 'character varying' })
    iso_code: string;

    @Column({ type: 'character varying' })
    flag: string;

    @Column({ type: 'character varying' })
    phone_code: string;

    @Column({ type: 'character varying' })
    currency: string;

    @Column({ type: 'character varying' })
    latitude: string;

    @Column({ type: 'character varying' })
    longitude: string;

    @Column({
        type: 'enum',
        enum: DefaultStatus,
        default: DefaultStatus.ACTIVE,
    })
    status: DefaultStatus;
}
