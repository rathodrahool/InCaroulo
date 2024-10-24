import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Country } from '@shared/entities/country.entity';
import { parseSearchKeyword } from '@shared/helpers/common.functions';
import { plainToClass, plainToInstance } from 'class-transformer';
import { FindManyOptions, FindOneOptions, ILike, Repository } from 'typeorm';

@Injectable()
export class DropdownService {
    constructor(
        @InjectRepository(Country)
        private readonly countryRepository: Repository<Country>,
    ) {}
    async findAllWithCount(where: FindManyOptions<Country>): Promise<[Country[], number]> {
        const [list, count] = await this.countryRepository.findAndCount(where);
        return [plainToInstance(Country, list), count];
    }

    async find(where: FindManyOptions<Country>): Promise<Country[]> {
        const list = await this.countryRepository.find(where);
        return plainToInstance(Country, list);
    }

    async findOne(id: string): Promise<Country> {
        const record = await this.countryRepository.findOne({
            where: { id: id },
        });
        return plainToClass(Country, record);
    }

    async findOneWhere(where: FindOneOptions<Country>): Promise<Country> {
        const record = await this.countryRepository.findOne(where);
        return plainToClass(Country, record);
    }
    async findAllCountries(search: string, order: { [key: string]: 'ASC' | 'DESC' }): Promise<[Country[], number]> {
        const where = {};
        if (search) {
            Object.assign(where, {
                name: ILike(`%${parseSearchKeyword(search)}%`),
            });
        }

        const [list, count]: [Country[], number] = await this.findAllWithCount({
            where: where,
            order: order,
            select: ['id', 'name', 'iso_code', 'flag', 'phone_code'],
        });
        return [list, count];
    }
}
