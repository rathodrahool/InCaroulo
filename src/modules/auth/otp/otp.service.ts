// NestJS and TypeORM imports
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThan, FindOneOptions } from 'typeorm';

// Entities
import { User } from '@modules/user/entities/user.entity';
import { Otp } from './entities/otp.entity';

// Additional libraries and utilities
import * as crypto from 'crypto';
import { plainToClass } from 'class-transformer';
import { DefaultStatus, ENVIRONMENT, expiryTimeEnum, VerificationType } from '@shared/constants/enum';

// NestJS configuration
import { ConfigService } from '@nestjs/config';

// External services
import * as twilio from 'twilio';

@Injectable()
export class OtpService {
    constructor(
        @InjectRepository(Otp)
        private otpRepository: Repository<Otp>,
        private configService: ConfigService,

        private twilioClient: twilio.Twilio,
    ) {
        const accountSid = this.configService.get<string>('twilio.sid');
        const authToken = this.configService.get<string>('twilio.token');
        this.twilioClient = twilio(accountSid, authToken);
    }
    generateOtp(): number {
        let otp = crypto.randomInt(100000, 999999);
        if (process.env.ENVIRONMENT === ENVIRONMENT.development) {
            otp = 123456;
        }
        return otp;
    }

    private isEmail(contactInformation: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(contactInformation);
    }
    createOtpEntity(
        user: User,
        otp: number,
        contactInformation: string,
        type: VerificationType,
        expireAt: Date,
        countryCode?: string | null,
    ): Otp {
        // Determine if the contactInformation is an email or contact number
        const isEmail = this.isEmail(contactInformation);

        return this.otpRepository.create({
            status: DefaultStatus.ACTIVE,
            user: user,
            otp,
            country_code: isEmail ? null : countryCode,
            contact_number: isEmail ? null : contactInformation,
            email: isEmail ? contactInformation : null,
            type,
            expire_at: expireAt,
        });
    }
    async saveOtp(otpEntity: Otp): Promise<void> {
        await this.otpRepository.save(otpEntity);
    }

    async updateOtpStatus(userId: string, newStatus: DefaultStatus): Promise<void> {
        await this.otpRepository.update({ user: { id: userId }, status: DefaultStatus.ACTIVE }, { status: newStatus });
    }
    async validateOtp(user: User, otp: number): Promise<boolean> {
        const otpRecord = await this.otpRepository.findOne({
            where: [
                {
                    user: { id: user.id },
                    otp,
                    expire_at: MoreThan(new Date()),
                    status: DefaultStatus.ACTIVE,
                    is_verified: false,
                },
            ],
        });
        if (otpRecord) {
            otpRecord.is_verified = true;
            otpRecord.status = DefaultStatus.IN_ACTIVE;
            await this.otpRepository.save(otpRecord);
            return true;
        }
        return false;
    }

    async findOneBy(where: FindOptionsWhere<Otp>) {
        const record = await this.otpRepository.findOneBy(where);
        return plainToClass(Otp, record);
    }
    async update(id: string, updateData: Partial<Otp>): Promise<void> {
        await this.otpRepository.update(id, updateData);
    }
    // twillo
    async sendOtpSms(user: User, countryCode: string, otp: number) {
        // const to = `+${countryCode}${user.contact_number}`;
        // const from = this.configService.get<string>('twilio.phone_number');
        // const body = `Your OTP is: ${otp}`;
        // await this.twilioClient.messages.create({
        //     body,
        //     to,
        //     from,
        // });
        // return true;
    }
    async findOneWhere(where: FindOneOptions<Otp>) {
        const record = await this.otpRepository.findOne(where);
        return record;
    }
    async findOtpByUserAndType(user: User | undefined, verificationType: VerificationType): Promise<Otp | null> {
        if (!user || !user.id) {
            return null;
        }

        const whereCondition = { user: { id: user.id }, type: verificationType };
        return await this.otpRepository.findOne({
            where: whereCondition,
        });
    }

    async handleOtpGeneration(
        user: User,
        contactInformation: string,
        verificationType: VerificationType,
        countryCode?: string | null,
    ): Promise<number> {
        const otpExpiryTime = new Date();
        const otp = this.generateOtp();
        otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + expiryTimeEnum.FIVE_MIN);

        let otpEntity = await this.findOtpByUserAndType(user, verificationType);

        if (otpEntity) {
            otpEntity.otp = otp;
            otpEntity.expire_at = otpExpiryTime;
            otpEntity.status = DefaultStatus.ACTIVE;
            otpEntity.is_verified = false;
        } else {
            otpEntity = this.createOtpEntity(
                user,
                otp,
                contactInformation,
                verificationType,
                otpExpiryTime,
                countryCode,
            );
        }

        await this.saveOtp(otpEntity);
        return otp;
    }
}
