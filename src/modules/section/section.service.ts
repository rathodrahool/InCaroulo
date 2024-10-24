import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, ILike, IsNull, Not, Repository } from 'typeorm';
import { Section } from './entities/section.entity';

// DTO (Data Transfer Objects)
import { CreateSectionDto } from './dto/create.section.dto';
import { UpdateSectionDto } from './dto/update.section.dto';

// Transformation and Serialization
import { plainToClass, plainToInstance } from 'class-transformer';

// Constants and Helpers
import { ERROR, SUCCESS } from '@shared/constants/messages';

import { parseSearchKeyword } from '@shared/helpers/common.functions';
import { Pagination } from '@shared/interfaces/interfaces';

@Injectable()
export class SectionService {
    constructor(
        @InjectRepository(Section)
        private readonly sectionRepository: Repository<Section>,
    ) {}

    async create(createSectionDto: CreateSectionDto): Promise<Section> {
        const result = await this.sectionRepository.save(createSectionDto);
        return plainToClass(Section, result);
    }

    async findAll(): Promise<[Section[]]> {
        const list = await this.sectionRepository.find();
        return [plainToInstance(Section, list)];
    }

    async findAllWithCount(where: FindManyOptions<Section>): Promise<[Section[], number]> {
        const [list, count] = await this.sectionRepository.findAndCount(where);
        return [plainToInstance(Section, list), count];
    }
    async findOne(id: string): Promise<Section> {
        const record = await this.sectionRepository.findOne({
            where: { id: id },
        });

        if (!record) {
            throw new NotFoundException(SUCCESS.RECORD_NOT_FOUND('Section'));
        }
        return plainToClass(Section, record);
    }

    async findOneWhere(where: FindOneOptions<Section>): Promise<Section> {
        const record = await this.sectionRepository.findOne(where);
        return record;
    }
    async count(where: FindManyOptions<Section>): Promise<number> {
        const count = await this.sectionRepository.count(where);
        return count;
    }

    async update(id: string, updateSectionDto: UpdateSectionDto): Promise<Section> {
        const isExist = await this.findOneWhere({
            where: {
                section_name: updateSectionDto.section_name,
                id: Not(id),
            },
        });

        if (isExist) {
            throw new ConflictException(ERROR.ALREADY_EXISTS('Section'));
        }
        await this.sectionRepository.update(id, updateSectionDto);
        const updatedRecord = await this.findOne(id);
        return updatedRecord;
    }

    async remove(id: string) {
        await this.sectionRepository.update(
            { id: id, deleted_at: IsNull() },
            {
                deleted_at: new Date().toISOString(),
            },
        );
    }

    async createSection(createSectionDto: CreateSectionDto): Promise<Section> {
        const existingRecord = await this.findOneWhere({
            where: { section_name: createSectionDto.section_name },
        });
        if (existingRecord) {
            throw new ConflictException(ERROR.ALREADY_EXISTS('Section'));
        }
        const result = await this.create(createSectionDto);
        return result;
    }

    async findAllSection(
        limit: number,
        offset: number,
        search: string,
        order: { [key: string]: 'ASC' | 'DESC' },
    ): Promise<Pagination<Section>> {
        const where = {};
        if (search) {
            Object.assign(where, {
                section_name: ILike(`%${parseSearchKeyword(search)}%`),
            });
        }

        const [list, count]: [Section[], number] = await this.findAllWithCount({
            where: where,
            order: order,
            take: limit,
            skip: offset,
        });

        return {
            total: count,
            limit: limit,
            offset: offset,
            data: list,
        };
    }

    async findOneSection(id: string): Promise<Section> {
        const result = await this.findOne(id);
        return result;
    }

    async updateSection(id: string, updateSectionDto: UpdateSectionDto): Promise<Section> {
        const result = await this.update(id, updateSectionDto);
        return result;
    }

    async deleteSection(id: string) {
        await this.findOne(id);
        const result = await this.remove(id);
        return result;
    }
}
