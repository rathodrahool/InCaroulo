// Libraries and Frameworks
import { plainToClass, plainToInstance } from 'class-transformer';
import { FindManyOptions, FindOneOptions, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// DTO (Data Transfer Objects)
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { User } from './entities/user.entity';
import { ActivityType, BlockReasonEnum, UserStatus } from '@shared/constants/enum';
import { OtpService } from '@modules/auth/otp/otp.service';
import { EmailService } from '@shared/services/mail/mail.service';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AUTH_ERROR, ERROR } from '@shared/constants/messages';

import { EmailVerifyDto } from '@modules/auth/dto/email.verify.dto';
import { EmailUpdateProfileDto } from '@modules/auth/dto/email.update.profile.dto';
import { extractDeviceInfo } from '@shared/helpers/common.functions';
import { DeviceInformationService } from '@modules/auth/device-information/device.information.service';

export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly otpService: OtpService,
        private readonly emailService: EmailService,
        private readonly deviceInformationService: DeviceInformationService,
    ) {}

    async create(createUserDto: CreateUserDto) {
        const result = await this.userRepository.save(createUserDto);
        return plainToClass(User, result);
    }

    async findAllWithCount(where: FindManyOptions<User>) {
        const [list, count] = await this.userRepository.findAndCount(where);
        return [plainToInstance(User, list), count];
    }

    async findAll() {
        const list = await this.userRepository.find();
        return plainToInstance(User, list);
    }

    async count(where: FindManyOptions<User>) {
        const count = await this.userRepository.count(where);
        return count;
    }

    async findOne(id: string) {
        const record = await this.userRepository.findOne({
            where: { id: id || IsNull() },
        });
        return plainToClass(User, record);
    }

    async findOneWhere(where: FindOneOptions<User>) {
        const record = await this.userRepository.findOne(where);
        return record;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const result = await this.userRepository.update(id, updateUserDto);
        if (result.affected === 0) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return result;
    }

    async remove(id: string) {
        const result = await this.userRepository.update(
            { id: id, deleted_at: IsNull() },
            { deleted_at: new Date().toISOString() },
        );

        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return result;
    }
    async deleteAccount(id: string, blockReason: BlockReasonEnum) {
        const record = await this.userRepository.update(
            { id: id, deleted_at: IsNull() },
            {
                deleted_at: new Date().toISOString(),
                status: UserStatus.BLOCKED,
                block_reason: blockReason,
            },
        );
        if (record.affected === 0) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return record;
    }

    async findByEmail(email: string, includeDeleted: boolean = false): Promise<User | null> {
        const queryBuilder = this.userRepository.createQueryBuilder('user').where('user.email = :email', { email });

        if (includeDeleted) {
            queryBuilder.withDeleted();
        }

        const user = await queryBuilder.getOne();
        return user ? plainToInstance(User, user) : null;
    }

    async findByContactNumber(contactNumber: string, includeDeleted: boolean = false): Promise<User | null> {
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .where('user.contact_number = :contactNumber', { contactNumber });
        if (includeDeleted) {
            queryBuilder.withDeleted();
        }

        const user = await queryBuilder.getOne();
        return user ? plainToInstance(User, user) : null;
    }

    async getUserProfile(req) {
        const user = await this.findOneWhere({
            where: { id: req.user.id },
            relations: ['role'],
        });
        if (!user) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('User'));
        }

        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.VIEW_PROFILE,
            user: user,
        });

        await this.deviceInformationService.create(deviceInfo);
        const record = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role.role_name,
        };
        return record;
    }

    async updateUserProfile(emailUpdateProfileDto: EmailUpdateProfileDto, req) {
        const isExists = await this.findOneWhere({
            where: { id: req.user.id },
        });

        if (!isExists) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('User'));
        }

        await this.update(isExists.id, emailUpdateProfileDto);

        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.UPDATE_PROFILE,
            user: isExists,
        });
        await this.deviceInformationService.create(deviceInfo);
        return;
    }

    async verifyOtp(emailVerifyDto: EmailVerifyDto, req) {
        const isExists = await this.findOneWhere({
            where: { id: req.user.id },
            relations: ['role'],
        });

        if (!isExists) {
            throw new UnauthorizedException(AUTH_ERROR.WRONG_CREDENTIALS);
        }
        const existingUserByEmail = await this.findOneWhere({
            where: { email: emailVerifyDto.email },
            relations: ['role'],
        });
        if (existingUserByEmail) {
            throw new ConflictException(ERROR.ALREADY_EXISTS('Email'));
        }

        const isVerified = await this.otpService.validateOtp(isExists, emailVerifyDto.otp);
        if (!isVerified) {
            throw new BadRequestException(AUTH_ERROR.INVALID_OTP);
        }
        await this.update(req.user.id, { email: emailVerifyDto.email });
        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.VERIFY_EMAIL_UPDATE,
            user: isExists,
        });
        await this.deviceInformationService.create(deviceInfo);
        return;
    }

    async deleteUserAccount(req) {
        const isExists = await this.findOneWhere({
            where: { id: req.user.id },
        });

        if (!isExists) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('User'));
        }
        this.deleteAccount(isExists.id, BlockReasonEnum.USER_DELETED_ACCOUNT);
        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.DELETE_ACCOUNT,
            user: isExists,
        });
        await this.deviceInformationService.create(deviceInfo);
        return;
    }
}
