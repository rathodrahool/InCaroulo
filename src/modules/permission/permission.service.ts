// NestJS common decorators and utilities t
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// TypeORM
import { FindManyOptions, FindOneOptions, ILike, IsNull, Not, Repository } from 'typeorm';

// Entities
import { Permission } from './entities/permission.entity';

// DTO (Data Transfer Objects)
import { CreatePermissionDto } from './dto/create.permission.dto';
import { UpdatePermissionDto } from './dto/update.permission.dto';

// Transformation and Serialization
import { plainToClass, plainToInstance } from 'class-transformer';

// Constants and Helpers
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { parseSearchKeyword } from '@shared/helpers/common.functions';
import { Pagination } from '@shared/interfaces/interfaces';

@Injectable()
export class PermissionService {
    constructor(
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
    ) {}

    async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
        const result = await this.permissionRepository.save(createPermissionDto);
        return plainToClass(Permission, result);
    }

    async findAll(): Promise<[Permission[]]> {
        const list = await this.permissionRepository.find();
        return [plainToInstance(Permission, list)];
    }

    async findAllWithCount(where: FindManyOptions<Permission>): Promise<[Permission[], number]> {
        const [list, count] = await this.permissionRepository.findAndCount(where);
        return [plainToInstance(Permission, list), count];
    }

    async find(where: FindManyOptions<Permission>) {
        const list = await this.permissionRepository.find(where);
        return plainToInstance(Permission, list);
    }

    async findOne(id: string): Promise<Permission> {
        const record = await this.permissionRepository.findOne({
            where: { id: id },
        });
        if (!record) {
            throw new NotFoundException(SUCCESS.RECORD_NOT_FOUND('Permission'));
        }
        return plainToClass(Permission, record);
    }

    async findOneWhere(where: FindOneOptions<Permission>): Promise<Permission> {
        const record = await this.permissionRepository.findOne(where);
        return plainToClass(Permission, record);
    }

    async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
        const isExist = await this.findOneWhere({
            where: {
                permission_name: updatePermissionDto.permission_name,
                id: Not(id),
            },
        });

        if (isExist) {
            throw new ConflictException(ERROR.ALREADY_EXISTS('Permission'));
        }
        await this.permissionRepository.update(id, updatePermissionDto);
        const updatedRecord = await this.findOne(id);
        return updatedRecord;
    }

    async remove(id: string) {
        const record = await this.permissionRepository.update(
            { id: id, deleted_at: IsNull() },
            {
                deleted_at: new Date().toISOString(),
            },
        );
        return record;
    }

    async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
        const existingRecord = await this.findOneWhere({
            where: { permission_name: createPermissionDto.permission_name },
        });
        if (existingRecord) {
            throw new ConflictException(ERROR.ALREADY_EXISTS('Permission'));
        }
        const result = await this.create(createPermissionDto);
        return result;
    }

    async findAllPermission(
        limit: number,
        offset: number,
        search: string,
        order: { [key: string]: 'ASC' | 'DESC' },
    ): Promise<Pagination<Permission>> {
        const where = {};
        if (search) {
            Object.assign(where, {
                permission_name: ILike(`%${parseSearchKeyword(search)}%`),
            });
        }

        const [list, count]: [Permission[], number] = await this.findAllWithCount({
            where: where,
            order: order,
            take: +limit,
            skip: +offset,
        });

        return {
            total: count,
            limit: +limit,
            offset: +offset,
            data: list,
        };
    }

    async findOnePermission(id: string): Promise<Permission> {
        const result = await this.findOne(id);
        return result;
    }

    async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
        const result = await this.update(id, updatePermissionDto);
        return result;
    }

    async deletePermission(id: string) {
        await this.findOne(id);
        const result = await this.remove(id);
        return result;
    }
}
