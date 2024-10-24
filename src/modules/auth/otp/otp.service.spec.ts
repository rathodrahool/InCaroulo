import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OtpService } from './otp.service';
import { Otp } from './entities/otp.entity';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { DefaultStatus, VerificationType } from '@root/src/shared/constants/enum';
import { User } from '../../user/entities/user.entity';

describe('OtpService', () => {
    let service: OtpService;
    let mockConfigService: Partial<ConfigService>;
    let mockTwilioClient: jest.Mocked<twilio.Twilio>;
    const mockOtpRepository = {
        findOneWhere: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        findOneBy: jest.fn(),
        create: jest.fn(),
    };
    beforeEach(async () => {
        mockConfigService = {
            get: jest.fn().mockImplementation((key: string) => {
                if (key === 'twilio.sid') return 'ACmockSid';
                if (key === 'twilio.token') return 'mockToken';
                if (key === 'twilio.phone_number') return 'mockPhoneNumber';
            }),
        };
        mockOtpRepository.create = jest.fn().mockImplementation((entity) => entity);
        mockTwilioClient = {
            messages: {
                create: jest.fn().mockResolvedValue({}),
            },
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OtpService,
                {
                    provide: getRepositoryToken(Otp),
                    useValue: mockOtpRepository,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: twilio.Twilio,
                    useValue: mockTwilioClient,
                },
            ],
        }).compile();

        service = module.get<OtpService>(OtpService);
        jest.clearAllMocks();
    });

    describe('generateOtp', () => {
        it('should generate a random OTP between 100000 and 999999', () => {
            const otp = service.generateOtp();
            expect(otp).toBeGreaterThanOrEqual(100000);
            expect(otp).toBeLessThan(1000000);
        });

        it('should generate a fixed OTP of 123456 in development environment', () => {
            process.env.ENVIRONMENT = 'development';
            const otp = service.generateOtp();
            expect(otp).toBe(123456);
            process.env.ENVIRONMENT = 'test'; // Reset environment after test
        });

        it('should generate a random OTP in non-development environments', () => {
            process.env.ENVIRONMENT = 'production';
            const otp = service.generateOtp();
            expect(otp).toBeGreaterThanOrEqual(100000);
            expect(otp).toBeLessThan(1000000);
            process.env.ENVIRONMENT = 'test'; // Reset environment after test
        });
    });

    describe('createOtpEntity', () => {
        it('should create an OTP entity with email as contact information', () => {
            const user = { id: '123' } as any;
            const otp = 123456;
            const contactInformation = 'test@example.com';
            const expireAt = new Date();

            const otpEntity = service.createOtpEntity(user, otp, contactInformation, VerificationType.LOGIN, expireAt);

            expect(otpEntity.email).toBe(contactInformation);
            expect(otpEntity.contact_number).toBeNull();
            expect(otpEntity.country_code).toBeNull();
            expect(otpEntity.user).toBe(user);
            expect(otpEntity.otp).toBe(otp);
            expect(otpEntity.status).toBe(DefaultStatus.ACTIVE);
            expect(otpEntity.expire_at).toBe(expireAt);
        });

        it('should create an OTP entity with phone number as contact information', () => {
            const user = { id: '123' } as any;
            const otp = 123456;
            const contactInformation = '9876543210';
            const expireAt = new Date();
            const countryCode = '+1';

            const otpEntity = service.createOtpEntity(
                user,
                otp,
                contactInformation,
                VerificationType.LOGIN,
                expireAt,
                countryCode,
            );

            expect(otpEntity.email).toBeNull();
            expect(otpEntity.contact_number).toBe(contactInformation);
            expect(otpEntity.country_code).toBe(countryCode);
            expect(otpEntity.user).toBe(user);
            expect(otpEntity.otp).toBe(otp);
            expect(otpEntity.status).toBe(DefaultStatus.ACTIVE);
            expect(otpEntity.expire_at).toBe(expireAt);
        });
    });

    describe('saveOtp', () => {
        it('should call the otpRepository save method with correct entity', async () => {
            const otpEntity = { otp: 123456 } as any;

            await service.saveOtp(otpEntity);

            expect(mockOtpRepository.save).toHaveBeenCalledWith(otpEntity);
        });
    });

    describe('updateOtpStatus', () => {
        it('should update the OTP status for the correct user', async () => {
            const userId = '123';

            await service.updateOtpStatus(userId, DefaultStatus.IN_ACTIVE);

            expect(mockOtpRepository.update).toHaveBeenCalledWith(
                { user: { id: userId }, status: 'active' },
                { status: DefaultStatus.IN_ACTIVE },
            );
        });
    });

    describe('validateOtp', () => {
        it('should return true and mark OTP as verified when a valid OTP is found', async () => {
            const user = { id: '123' } as any;
            const otp = 123456;
            const otpRecord = { is_verified: false, status: 'ACTIVE', expire_at: new Date() };

            mockOtpRepository.findOne.mockResolvedValue(otpRecord);

            const result = await service.validateOtp(user, otp);

            expect(result).toBe(true);
            expect(otpRecord.is_verified).toBe(true);
            expect(otpRecord.status).toBe('inactive');
            expect(mockOtpRepository.save).toHaveBeenCalledWith(otpRecord);
        });

        it('should return false when no valid OTP is found', async () => {
            const user = { id: '123' } as any;
            const otp = 123456;

            mockOtpRepository.findOne.mockResolvedValue(null);

            const result = await service.validateOtp(user, otp);

            expect(result).toBe(false);
        });
    });

    describe('findOneBy', () => {
        it('should find one OTP by where condition', async () => {
            const whereCondition = { id: '123' };
            const otpRecord = { id: '123', otp: 123456 };

            mockOtpRepository.findOneBy.mockResolvedValue(otpRecord);

            const result = await service.findOneBy(whereCondition);

            expect(mockOtpRepository.findOneBy).toHaveBeenCalledWith(whereCondition);
            expect(result).toEqual(expect.objectContaining(otpRecord));
        });
    });

    describe('handleOtpGeneration', () => {
        it('should generate a new OTP and save it when an OTP does not exist', async () => {
            const user = { id: '123' } as any;
            const contactInformation = 'test@example.com';

            const generatedOtp = 123456;

            service.generateOtp = jest.fn().mockReturnValue(generatedOtp);
            mockOtpRepository.findOne.mockResolvedValue(null);

            const result = await service.handleOtpGeneration(
                user,
                contactInformation,
                VerificationType.FORGOT_PASSWORD,
            );

            expect(service.generateOtp).toHaveBeenCalled();
            expect(mockOtpRepository.save).toHaveBeenCalled();
            expect(result).toBe(generatedOtp);
        });

        it('should update and save the existing OTP when an OTP already exists', async () => {
            const user = { id: '123' } as any;
            const contactInformation = 'test@example.com';
            const existingOtp = { otp: 654321, status: 'IN_ACTIVE', is_verified: true };

            service.generateOtp = jest.fn().mockReturnValue(123456);
            mockOtpRepository.findOne.mockResolvedValue(existingOtp);

            const result = await service.handleOtpGeneration(
                user,
                contactInformation,
                VerificationType.FORGOT_PASSWORD,
            );

            expect(mockOtpRepository.save).toHaveBeenCalledWith(existingOtp);
            expect(existingOtp.otp).toBe(123456);
            expect(existingOtp.status).toBe('active');
            expect(existingOtp.is_verified).toBe(false);
            expect(result).toBe(123456);
        });
    });

    describe('update', () => {
        it('should update the OTP entity with the given id and updateData', async () => {
            const id = '123';
            const updateData = { otp: 654321 };

            // Mock the otpRepository.update method
            mockOtpRepository.update = jest.fn().mockResolvedValue(undefined);

            // Call the service's update method
            await service.update(id, updateData);

            // Expect that otpRepository.update was called with the correct arguments
            expect(mockOtpRepository.update).toHaveBeenCalledWith(id, updateData);
        });

        it('should throw an error if update fails', async () => {
            const id = '123';
            const updateData = { otp: 654321 };

            // Mock the otpRepository.update to throw an error
            mockOtpRepository.update = jest.fn().mockRejectedValue(new Error('Update failed'));

            // Expect the service update method to throw the same error
            await expect(service.update(id, updateData)).rejects.toThrow('Update failed');
        });
    });

    describe('findOneWhere', () => {
        it('should return a record when found', async () => {
            const mockRecord = { id: '1' };
            mockOtpRepository.findOne.mockResolvedValue(mockRecord);

            const result = await service.findOneWhere({ where: { id: '1' } });

            expect(mockOtpRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual(mockRecord);
        });

        it('should return null if no record is found', async () => {
            mockOtpRepository.findOne.mockResolvedValue(null);

            const result = await service.findOneWhere({ where: { id: '2' } });

            expect(mockOtpRepository.findOne).toHaveBeenCalledWith({ where: { id: '2' } });
            expect(result).toBeNull();
        });
    });
    describe('findOtpByUserAndType', () => {
        const verificationType = VerificationType.LOGIN;
        it('should return null when user is undefined', async () => {
            const result = await service.findOtpByUserAndType(undefined, verificationType);

            expect(mockOtpRepository.findOne).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should return null when user has no id', async () => {
            const user = new User();

            const result = await service.findOtpByUserAndType(user, verificationType);

            expect(mockOtpRepository.findOne).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should return an OTP entity when user and verification type match', async () => {
            const user = new User();
            user.id = '123';
            const otpEntity = { id: 'otp123', otp: 654321 } as Otp;

            mockOtpRepository.findOne = jest.fn().mockResolvedValue(otpEntity);

            const result = await service.findOtpByUserAndType(user, verificationType);

            expect(mockOtpRepository.findOne).toHaveBeenCalledWith({
                where: { user: { id: user.id }, type: verificationType },
            });
            expect(result).toBe(otpEntity);
        });

        it('should return null when no OTP entity is found', async () => {
            const user = new User();
            user.id = '123'; // User with an id

            mockOtpRepository.findOne = jest.fn().mockResolvedValue(null);

            const result = await service.findOtpByUserAndType(user, verificationType);

            expect(mockOtpRepository.findOne).toHaveBeenCalledWith({
                where: { user: { id: user.id }, type: verificationType },
            });

            expect(result).toBeNull();
        });
    });
});
