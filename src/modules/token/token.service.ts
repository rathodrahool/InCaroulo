// NestJS common decorators and utilities
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

// TypeORM
import { FindOneOptions, LessThan, Repository } from 'typeorm';

// Entities
import { Tokens } from './entities/tokens.entity';
import { User } from '@modules/user/entities/user.entity';
import { Admin } from '@modules/admin/entities/admin.entity';

// Constants and Enums
import { DefaultStatus, TokenTypeEnum } from '@shared/constants/enum';

// Transformation and Serialization
import { plainToClass } from 'class-transformer';
import { TokenCreationOptions } from '@shared/interfaces/interfaces';
import { UpdateTokenDto } from './dto/update.token.dto';

@Injectable()
export class TokenService {
    constructor(
        @InjectRepository(Tokens)
        private tokenRepository: Repository<Tokens>,
    ) {}

    async create(options: TokenCreationOptions): Promise<Tokens> {
        const {
            entity,
            access_token,
            access_token_expiry,
            refresh_token_expiry,
            refresh_token,
            type = TokenTypeEnum.ACCESS,
            device,
        } = options;
        const newToken = this.tokenRepository.create({
            access_token,
            access_token_expiry: access_token_expiry,
            refresh_token: refresh_token,
            refresh_token_expiry: refresh_token_expiry,
            type: type,
            device: device,
        });
        if (entity instanceof User) {
            newToken.user = entity;
        } else if (entity instanceof Admin) {
            newToken.admin = entity;
        }
        return await this.tokenRepository.save(newToken);
    }

    async findOneWhere(where: FindOneOptions<Tokens>) {
        const record = await this.tokenRepository.findOne(where);
        return plainToClass(Tokens, record);
    }

    async update(id: string, updateTokenDto: UpdateTokenDto) {
        await this.tokenRepository.update(id, updateTokenDto);
    }

    async findTokenRecord(link_id: string, activity: string) {
        return await this.tokenRepository
            .createQueryBuilder('tokens')
            .innerJoinAndSelect('tokens.device', 'device')
            .innerJoinAndSelect('device.user', 'user')
            .where('device.link_id = :link_id', { link_id })
            .andWhere('device.activity_type = :activityType', { activityType: activity })
            .getOne();
    }
    async invalidateToken(token: Tokens, tokenType: TokenTypeEnum): Promise<void> {
        switch (tokenType) {
            case TokenTypeEnum.ACCESS:
                token.access_token_status = DefaultStatus.IN_ACTIVE;
                break;
            case TokenTypeEnum.REFRESH:
                token.refresh_token_status = DefaultStatus.IN_ACTIVE;
                break;
        }
        await this.tokenRepository.save(token);
    }

    async validateToken(token: string, tokenType: TokenTypeEnum): Promise<boolean> {
        const whereCondition = tokenType === TokenTypeEnum.ACCESS ? { access_token: token } : { refresh_token: token };

        const foundToken = await this.findOneWhere({ where: whereCondition });
        if (!foundToken) {
            return false;
        }

        const isTokenActive =
            tokenType === TokenTypeEnum.ACCESS
                ? foundToken.access_token_status === DefaultStatus.ACTIVE
                : foundToken.refresh_token_status === DefaultStatus.ACTIVE;

        const isTokenNotExpired =
            new Date() <
            (tokenType === TokenTypeEnum.ACCESS ? foundToken.access_token_expiry : foundToken.refresh_token_expiry);

        return isTokenActive && isTokenNotExpired;
    }

    async findActiveTokens(entity: User | Admin): Promise<Tokens[]> {
        const { id } = entity;
        const now = new Date();

        return this.tokenRepository
            .createQueryBuilder('token')
            .leftJoinAndSelect('token.device', 'device')
            .where(
                'token.access_token_status = :accessStatus AND token.access_token_expiry > :now OR ' +
                    'token.refresh_token_status = :refreshStatus AND token.refresh_token_expiry > :now',
                {
                    accessStatus: DefaultStatus.ACTIVE,
                    refreshStatus: DefaultStatus.ACTIVE,
                    now,
                },
            )
            .andWhere(`token.${entity instanceof User ? 'user_id' : 'admin_id'} = :id`, { id })
            .getMany();
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleTokenCleanup() {
        const now = new Date();

        // Find all expired tokens
        const expiredTokens = await this.tokenRepository.find({
            where: [
                { access_token_status: DefaultStatus.ACTIVE, access_token_expiry: LessThan(now) },
                { refresh_token_status: DefaultStatus.ACTIVE, refresh_token_expiry: LessThan(now) },
            ],
        });

        // Mark expired tokens as inactive...
        for (const token of expiredTokens) {
            if (token.access_token_expiry < now) {
                token.access_token_status = DefaultStatus.IN_ACTIVE;
            }
            if (token.refresh_token_expiry < now) {
                token.refresh_token_status = DefaultStatus.IN_ACTIVE;
            }
            await this.tokenRepository.save(token);
        }

        // Delete all tokens that are inactive
        const inactiveTokens = await this.tokenRepository.find({
            where: [
                { access_token_status: DefaultStatus.IN_ACTIVE },
                { refresh_token_status: DefaultStatus.IN_ACTIVE },
            ],
        });

        for (const token of inactiveTokens) {
            await this.tokenRepository.delete(token.id);
        }
    }
}
