// NestJS and TypeORM imports
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';

import { plainToClass } from 'class-transformer';
import { DeviceInformation } from './entities/device.information.entity';
import { DeviceInformationDto } from './dto/device.information.dto';
import { User } from '@modules/user/entities/user.entity';
import { TokenService } from '@modules/token/token.service';
import { ActivityType, TokenTypeEnum } from '@shared/constants/enum';

@Injectable()
export class DeviceInformationService {
    constructor(
        @InjectRepository(DeviceInformation)
        private deviceRepository: Repository<DeviceInformation>,
        private readonly tokenService: TokenService,
    ) {}

    async create(deviceInfoDto: DeviceInformationDto) {
        const result = await this.deviceRepository.save(deviceInfoDto);
        return plainToClass(DeviceInformation, result);
    }

    async findOneWhere(where: FindOneOptions<DeviceInformation>) {
        const record = await this.deviceRepository.findOne(where);
        return record;
    }
    async update(id: string, updateDeviceInfoDto: Partial<DeviceInformationDto>): Promise<void> {
        await this.deviceRepository.update(id, updateDeviceInfoDto);
    }
    async logoutAllDevice(user: User) {
        const allowMultipleDeviceLogin = process.env.ALLOW_MULTIPLE_DEVICE_LOGIN;
        if (!allowMultipleDeviceLogin) {
            const activeTokens = await this.tokenService.findActiveTokens(user);

            for (const token of activeTokens) {
                await this.tokenService.invalidateToken(token, TokenTypeEnum.ACCESS);
                await this.update(token.device.id, {
                    is_active: false,
                    last_active_at: new Date(),
                    activity_type: ActivityType.LOGOUT,
                });
            }
        }
    }
}
