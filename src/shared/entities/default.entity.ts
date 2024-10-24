import { Exclude } from 'class-transformer';
import { Request } from 'express';
import {
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
} from 'typeorm';

export class DefaultEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Exclude()
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @Exclude()
    @DeleteDateColumn({ name: 'deleted_at' })
    deleted_at: Date;

    @Exclude()
    @Column({ name: 'created_device_ip', length: 256 })
    created_device_ip: string;

    @Exclude()
    @Column({ name: 'updated_device_ip', length: 256, nullable: true })
    updated_device_ip: string | null;

    @Exclude()
    @Column({ name: 'deleted_device_ip', length: 256, nullable: true })
    deleted_device_ip: string | null;
    request: Request;
    static requestContext: { ip?: string } = {};
}
@EventSubscriber()
export class CommonSubscriber implements EntitySubscriberInterface<DefaultEntity> {
    listenTo() {
        return DefaultEntity;
    }

    beforeInsert(event: InsertEvent<DefaultEntity>): void {
        event.entity.created_device_ip = DefaultEntity.requestContext.ip;
    }

    beforeUpdate(event: UpdateEvent<DefaultEntity>): void {
        if (event.entity.deleted_at) {
            event.entity.deleted_device_ip = DefaultEntity.requestContext.ip;
        } else {
            event.entity.updated_device_ip = DefaultEntity.requestContext.ip;
        }
    }

    beforeRemove(event: RemoveEvent<DefaultEntity>): void {
        if (event.entity) {
            event.entity.deleted_device_ip = DefaultEntity.requestContext.ip;
        }
    }
}
