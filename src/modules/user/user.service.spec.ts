import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { IsNull, Repository, UpdateResult } from 'typeorm';
import { User } from './entities/user.entity';
import { OtpService } from '@modules/auth/otp/otp.service';
import { EmailService } from '@shared/services/mail/mail.service';
import { DeviceInformationService } from '@modules/auth/device-information/device.information.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
    ActivityType,
    BlockReasonEnum,
    DeviceType,
    expiryTimeEnum,
    UserStatus,
    VerificationType,
} from '@root/src/shared/constants/enum';
import { EmailVerifyDto } from '@modules/auth/dto/email.verify.dto';
import { extractDeviceInfo } from '@shared/helpers/common.functions';
import { Request } from 'express';
import { UpdatePhoneDto } from '@modules/auth/dto/update.phone.dto';
import { EmailUpdateProfileDto } from '../auth/dto/email.update.profile.dto';
jest.mock('@shared/helpers/common.functions', () => ({
    // Mock other exports if needed
    generateTokens: jest.fn().mockReturnValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
        accessTokenExpiryTime: new Date(),
        refreshTokenExpiryTime: new Date(),
    }),
    extractDeviceInfo: jest.fn().mockReturnValue({
        device_id: 'mockDeviceId',
        device_type: 'mockDeviceType',
        device_name: 'mockDeviceName',
        device_ip: 'mockDeviceIp',
        app_version: 'mockAppVersion',
        timezone: 'mockTimezone',
        activity_type: 'mockActivityType',
        registered_at: new Date(),
        last_active_at: new Date(),
        link_id: 'mockLinkId',
    }),
}));
describe('UserService', () => {
    let service: UserService;
    let userRepository: Repository<User>;
    let deviceInformationService: DeviceInformationService;
    let otpService: OtpService;
    let emailService: EmailService;
    const mockReq = {
        user: { id: '1' },
        token: 'mockAccessToken',
        'device-type': DeviceType.WEB,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        save: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: OtpService,
                    useValue: {
                        validateOtp: jest.fn(),
                    },
                },
                {
                    provide: EmailService,
                    useValue: {},
                },
                {
                    provide: DeviceInformationService,
                    useValue: {
                        create: jest.fn(),
                    },
                },
                {
                    provide: OtpService,
                    useValue: {
                        handleOtpGeneration: jest.fn(),
                    },
                },
                {
                    provide: EmailService,
                    useValue: {
                        sendOtpEmail: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        deviceInformationService = module.get<DeviceInformationService>(DeviceInformationService);
        otpService = module.get<OtpService>(OtpService);
        emailService = module.get<EmailService>(EmailService);
    });

    describe('create', () => {
        it('should successfully create a user', async () => {
            const createUserDto = {
                // Your DTO properties
                email: 'test@example.com',
                password: 'password',
                // Add other properties as needed
            };

            const savedUser = {
                ...createUserDto,
                id: 'user-id',
            };

            userRepository.save = jest.fn().mockResolvedValue(savedUser);

            const result = await service.create(createUserDto);

            expect(result).toEqual(plainToClass(User, savedUser));
            expect(userRepository.save).toHaveBeenCalledWith(createUserDto);
            expect(userRepository.save).toHaveBeenCalledTimes(1);
        });
    });

    describe('findAllWithCount', () => {
        it('should return a list of users with the count', async () => {
            const where = {}; // Define your query options
            const userList = [
                { id: 'user1', email: 'user1@example.com' },
                { id: 'user2', email: 'user2@example.com' },
            ];
            const count = userList.length;

            userRepository.findAndCount = jest.fn().mockResolvedValue([userList, count]);

            const [resultList, resultCount] = await service.findAllWithCount(where);

            expect(resultList).toEqual(plainToInstance(User, userList));
            expect(resultCount).toBe(count);
            expect(userRepository.findAndCount).toHaveBeenCalledWith(where);
            expect(userRepository.findAndCount).toHaveBeenCalledTimes(1);
        });
    });

    describe('findAll', () => {
        it('should return a list of users', async () => {
            const userList = [
                { id: 'user1', email: 'user1@example.com' },
                { id: 'user2', email: 'user2@example.com' },
            ];

            userRepository.find = jest.fn().mockResolvedValue(userList);

            const resultList = await service.findAll();

            expect(resultList).toEqual(plainToInstance(User, userList));
            expect(userRepository.find).toHaveBeenCalled();
            expect(userRepository.find).toHaveBeenCalledTimes(1);
        });
    });

    describe('count', () => {
        it('should return the count of users matching the given criteria', async () => {
            const where = { where: { id: '1' } }; // Example criteria
            const expectedCount = 5;

            userRepository.count = jest.fn().mockResolvedValue(expectedCount);

            const result = await service.count(where);

            expect(result).toBe(expectedCount);
            expect(userRepository.count).toHaveBeenCalledWith(where);
            expect(userRepository.count).toHaveBeenCalledTimes(1);
        });
    });

    describe('findOne', () => {
        it('should return a user record by id', async () => {
            const userId = 'some-user-id';
            const mockUser = { id: userId, name: 'John Doe' }; // Mock user record

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

            const result = await service.findOne(userId);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: userId },
            });
            expect(result).toEqual(expect.any(User));
            expect(result).toMatchObject(mockUser);
        });

        it('should handle null id by using IsNull condition', async () => {
            const mockUser = { id: null, name: 'Anonymous' }; // Mock user with null id

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

            const result = await service.findOne(null);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: IsNull() },
            });
            expect(result).toEqual(expect.any(User));
            expect(result).toMatchObject(mockUser);
        });
    });

    describe('findOneWhere', () => {
        it('should return a user record based on where conditions', async () => {
            const whereCondition = { where: { email: 'test@example.com' } };
            const mockUser = { id: 'user-id', email: 'test@example.com', name: 'John Doe' };

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

            const result = await service.findOneWhere(whereCondition);

            expect(userRepository.findOne).toHaveBeenCalledWith(whereCondition);
            expect(result).toEqual(mockUser);
        });

        it('should return null if no user record is found', async () => {
            const whereCondition = { where: { email: 'nonexistent@example.com' } };

            userRepository.findOne = jest.fn().mockResolvedValue(null);

            const result = await service.findOneWhere(whereCondition);

            expect(userRepository.findOne).toHaveBeenCalledWith(whereCondition);
            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a user record with the given updateUserDto', async () => {
            const userId = 'user-id';
            const updateUserDto: UpdateUserDto = {
                email: 'updated@example.com',
                first_name: 'Updated Name',
            };

            const mockUpdateResult = {
                affected: 1,
            };

            userRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            const result = await service.update(userId, updateUserDto);

            expect(userRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
            expect(result).toEqual(mockUpdateResult);
        });

        it('should throw a NotFoundException if no user record is updated', async () => {
            const userId = 'nonexistent-user-id';
            const updateUserDto: UpdateUserDto = {
                email: 'nonexistent@example.com',
                first_name: 'Nonexistent Name',
            };

            const mockUpdateResult = {
                affected: 0, // No records were updated
            };

            userRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);

            expect(userRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
        });
    });

    describe('remove', () => {
        it('should successfully soft-delete a user by updating the deleted_at field', async () => {
            const userId = 'valid-user-id';
            const mockUpdateResult = {
                affected: 1, // Simulate that one record was updated
            };

            userRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            const result = await service.remove(userId);

            expect(userRepository.update).toHaveBeenCalledWith(
                { id: userId, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
            expect(result).toEqual(mockUpdateResult);
        });

        it('should throw a NotFoundException if no user record is updated', async () => {
            const userId = 'nonexistent-user-id';
            const mockUpdateResult = {
                affected: 0, // Simulate that no records were updated
            };

            userRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            await expect(service.remove(userId)).rejects.toThrow(NotFoundException);

            expect(userRepository.update).toHaveBeenCalledWith(
                { id: userId, deleted_at: IsNull() },
                { deleted_at: expect.any(String) },
            );
        });
    });

    describe('deleteAccount', () => {
        it('should successfully block a user and soft-delete the account', async () => {
            const userId = 'valid-user-id';
            const blockReason = BlockReasonEnum.SUSPICIOUS_ACTIVITY;
            const mockUpdateResult = { affected: 1 }; // Simulate that one record was updated

            userRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            const result = await service.deleteAccount(userId, blockReason);

            expect(userRepository.update).toHaveBeenCalledWith(
                { id: userId, deleted_at: IsNull() },
                {
                    deleted_at: expect.any(String),
                    status: UserStatus.BLOCKED,
                    block_reason: blockReason,
                },
            );
            expect(result).toEqual(mockUpdateResult);
        });

        it('should throw a NotFoundException if no user record is updated', async () => {
            const userId = 'nonexistent-user-id';
            const blockReason = BlockReasonEnum.SUSPICIOUS_ACTIVITY;
            const mockUpdateResult = { affected: 0 }; // Simulate no records updated

            userRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);

            await expect(service.deleteAccount(userId, blockReason)).rejects.toThrow(NotFoundException);

            expect(userRepository.update).toHaveBeenCalledWith(
                { id: userId, deleted_at: IsNull() },
                {
                    deleted_at: expect.any(String),
                    status: UserStatus.BLOCKED,
                    block_reason: blockReason,
                },
            );
        });
    });

    describe('findByEmail', () => {
        it('should return a user by email', async () => {
            const email = 'test@example.com';
            const mockUser = { id: 'user-id', email: 'test@example.com' };

            userRepository.createQueryBuilder = jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                withDeleted: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.findByEmail(email);

            expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(result).toEqual(plainToInstance(User, mockUser));
        });

        it('should include deleted users when includeDeleted is true', async () => {
            const email = 'test@example.com';
            const mockUser = { id: 'user-id', email: 'test@example.com' };

            userRepository.createQueryBuilder = jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                withDeleted: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.findByEmail(email, true);

            expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(userRepository.createQueryBuilder().withDeleted).toHaveBeenCalled();
            expect(result).toEqual(plainToInstance(User, mockUser));
        });

        it('should return null if no user is found', async () => {
            const email = 'nonexistent@example.com';

            userRepository.createQueryBuilder = jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                withDeleted: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            });

            const result = await service.findByEmail(email);

            expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(result).toBeNull();
        });
    });

    describe('findByContact', () => {
        it('should return a user by contact', async () => {
            const contactNumber = '9145859685';
            const mockUser = new User();

            userRepository.createQueryBuilder = jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                withDeleted: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.findByContactNumber(contactNumber);

            expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(result).toEqual(plainToInstance(User, mockUser));
        });

        it('should include deleted users when includeDeleted is true', async () => {
            const contactNumber = '9145859685';
            const mockUser = new User();

            userRepository.createQueryBuilder = jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                withDeleted: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.findByContactNumber(contactNumber, true);

            expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(userRepository.createQueryBuilder().withDeleted).toHaveBeenCalled();
            expect(result).toEqual(plainToInstance(User, mockUser));
        });

        it('should return null if no user is found', async () => {
            const contactNumber = '9145859685';

            userRepository.createQueryBuilder = jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                withDeleted: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            });

            const result = await service.findByContactNumber(contactNumber);

            expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(result).toBeNull();
        });
    });

    describe('getUserProfile', () => {
        it('should return the user profile with role', async () => {
            const mockUser = {
                id: 'user-id',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                country_code: '+1',
                contact_number: '1234567890',
                role: { role_name: 'user' },
            };
            const mockRequest = {
                user: { id: 'user-id' },
                headers: {
                    'device-type': 'web',
                    'user-agent': 'Mozilla/5.0',
                },
            };

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            deviceInformationService.create = jest.fn();

            const result = await service.getUserProfile(mockRequest as any);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-id' },
                relations: ['role'],
            });
            expect(result).toEqual({
                id: 'user-id',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                country_code: '+1',
                contact_number: '1234567890',
                role: 'user',
            });
            expect(deviceInformationService.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if user is not found', async () => {
            const mockRequest = {
                user: { id: 'user-id' },
            };

            userRepository.findOne = jest.fn().mockResolvedValue(null);

            await expect(service.getUserProfile(mockRequest as any)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateUserProfile', () => {
        const mockEmailUpdateProfileDto = new EmailUpdateProfileDto();
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            role: { role_name: 'user' },
        };
        it('should throw NotFoundException if user does not exist', async () => {
            userRepository.findOne = jest.fn().mockResolvedValue(null);

            await expect(service.updateUserProfile(mockEmailUpdateProfileDto, mockReq)).rejects.toThrow(
                NotFoundException,
            );
            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockReq.user.id } });
        });

        it('should update user profile and create device information if user exists', async () => {
            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            (userRepository.update as jest.Mock).mockResolvedValue({ affected: 1 }); // Mocking the update response
            deviceInformationService.create = jest.fn().mockResolvedValue({});

            await service.updateUserProfile(mockEmailUpdateProfileDto, mockReq);

            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockReq.user.id } });
            expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, mockEmailUpdateProfileDto);
            expect(deviceInformationService.create).toHaveBeenCalled();
        });
    });

    describe('sendEmailChangeOtp', () => {
        it('should handle OTP generation and sending via email', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'user@example.com',
                contact_number: null,
            };
            const mockOtp = 123456;

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            otpService.handleOtpGeneration = jest.fn().mockResolvedValue(mockOtp);
            emailService.sendOtpEmail = jest.fn();
            deviceInformationService.create = jest.fn();

            const mockRequest = {
                user: { id: 'user-id' },
                headers: {
                    'device-type': 'web',
                    'user-agent': 'Mozilla/5.0',
                },
            };

            await service.sendEmailChangeOtp(mockRequest as any);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-id' },
            });
            expect(otpService.handleOtpGeneration).toHaveBeenCalledWith(
                mockUser,
                mockUser.email,
                VerificationType.UPDATE_EMAIL,
            );
            expect(emailService.sendOtpEmail).toHaveBeenCalledWith(mockUser, mockOtp, expiryTimeEnum.FIVE_MIN);
            expect(deviceInformationService.create).toHaveBeenCalled();
        });

        it('should handle OTP generation and sending via contact number', async () => {
            const mockUser = {
                id: 'user-id',
                email: null,
                contact_number: '1234567890',
            };
            const mockOtp = '654321';

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            otpService.handleOtpGeneration = jest.fn().mockResolvedValue(mockOtp);
            deviceInformationService.create = jest.fn();

            const mockRequest = {
                user: { id: 'user-id' },
                headers: {
                    'device-type': 'web',
                    'user-agent': 'Mozilla/5.0',
                },
            };

            await service.sendEmailChangeOtp(mockRequest as any);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-id' },
            });
            expect(otpService.handleOtpGeneration).toHaveBeenCalledWith(
                mockUser,
                mockUser.contact_number,
                VerificationType.UPDATE_EMAIL,
            );
            expect(deviceInformationService.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if user is not found', async () => {
            userRepository.findOne = jest.fn().mockResolvedValue(null);

            const mockRequest = {
                user: { id: 'user-id' },
            };

            await expect(service.sendEmailChangeOtp(mockRequest as any)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if neither email nor contact number is present', async () => {
            const mockUser = {
                id: 'user-id',
                email: null,
                contact_number: null,
            };

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

            const mockRequest = {
                user: { id: 'user-id' },
            };

            await expect(service.sendEmailChangeOtp(mockRequest as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('verifyOtp', () => {
        const mockEmailVerifyDto = new EmailVerifyDto();
        mockEmailVerifyDto.otp = 123456;
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            role: { role_name: 'user' },
        };
        it('should throw UnauthorizedException if user does not exist', async () => {
            service.findOneWhere = jest.fn().mockResolvedValueOnce(null);

            await expect(service.verifyOtp(mockEmailVerifyDto, mockReq)).rejects.toThrow(UnauthorizedException);

            expect(service.findOneWhere).toHaveBeenCalledWith({
                where: { id: mockReq.user.id },
                relations: ['role'],
            });
        });

        it('should throw ConflictException if email already exists', async () => {
            service.findOneWhere = jest
                .fn()
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ email: 'newemail@example.com', role: 'user' });

            await expect(service.verifyOtp(mockEmailVerifyDto, mockReq)).rejects.toThrow(ConflictException);

            expect(service.findOneWhere).toHaveBeenCalledWith({
                where: { email: mockEmailVerifyDto.email },
                relations: ['role'],
            });
        });
        it('should throw BadRequestException if OTP is invalid', async () => {
            service.findOneWhere = jest.fn().mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
            otpService.validateOtp = jest.fn().mockResolvedValueOnce(false);

            await expect(service.verifyOtp(mockEmailVerifyDto, mockReq)).rejects.toThrow(BadRequestException);

            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, mockEmailVerifyDto.otp);
        });

        it('should successfully update email and create device information if OTP is valid', async () => {
            service.findOneWhere = jest.fn().mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
            otpService.validateOtp = jest.fn().mockResolvedValueOnce(true); // Valid OTP
            service.update = jest.fn().mockResolvedValueOnce({
                id: mockUser.id,
                email: mockEmailVerifyDto.email,
            }); // Mock update
            (deviceInformationService.create as jest.Mock).mockResolvedValueOnce({}); // Mock device info creation

            await service.verifyOtp(mockEmailVerifyDto, mockReq);

            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, mockEmailVerifyDto.otp);
            expect(service.update).toHaveBeenCalledWith(mockUser.id, { email: mockEmailVerifyDto.email });
            expect(deviceInformationService.create).toHaveBeenCalled();
        });
    });

    describe('deleteUserAccount', () => {
        it('should delete the user account and log the device information', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'user@example.com',
                contact_number: '1234567890',
            } as User;

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            service.deleteAccount = jest.fn().mockResolvedValue({ affected: 1 });
            deviceInformationService.create = jest.fn();

            const mockRequest = {
                user: { id: 'user-id' },
                headers: {
                    'device-type': 'web',
                    'user-agent': 'Mozilla/5.0',
                },
            } as unknown as Request;

            await service.deleteUserAccount(mockRequest as any);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-id' },
            });
            expect(service.deleteAccount).toHaveBeenCalledWith(mockUser.id, BlockReasonEnum.USER_DELETED_ACCOUNT);
            expect(deviceInformationService.create).toHaveBeenCalledWith(
                extractDeviceInfo({
                    request: mockRequest,
                    activity_type: ActivityType.DELETE_ACCOUNT,
                    user: mockUser,
                }),
            );
        });

        it('should throw NotFoundException if user is not found', async () => {
            userRepository.findOne = jest.fn().mockResolvedValue(null);

            const mockRequest = {
                user: { id: 'user-id' },
            };

            await expect(service.deleteUserAccount(mockRequest as any)).rejects.toThrow(NotFoundException);
        });
    });

    describe('sendPhoneChangeOtp', () => {
        it('should handle sending OTP to contact number', async () => {
            const mockUser = {
                id: 'user-id',
                contact_number: '1234567890',
                email: 'user@example.com',
                country_code: 'US',
            } as User;

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            otpService.handleOtpGeneration = jest.fn().mockResolvedValue('otp-sms');
            emailService.sendOtpEmail = jest.fn(); // Not expected to be called

            const mockRequest = {
                user: { id: 'user-id' },
                headers: {
                    'device-type': 'web',
                    'user-agent': 'Mozilla/5.0',
                    'device-id': 'device-id',
                    'app-version': '1.0.0',
                    timezone: 'UTC',
                },
                ip: '127.0.0.1',
            } as unknown as Request;

            await service.sendPhoneChangeOtp(mockRequest);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-id' },
            });
            expect(otpService.handleOtpGeneration).toHaveBeenCalledWith(
                mockUser,
                mockUser.contact_number,
                VerificationType.UPDATE_PHONE,
            );
            expect(deviceInformationService.create).toHaveBeenCalledWith(
                extractDeviceInfo({
                    request: mockRequest,
                    activity_type: ActivityType.UPDATE_PHONE,
                    user: mockUser,
                }),
            );
        });

        it('should handle sending OTP to email', async () => {
            const mockUser = {
                id: 'user-id',
                contact_number: null,
                email: 'user@example.com',
                country_code: 'US',
            } as User;

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            otpService.handleOtpGeneration = jest.fn().mockResolvedValue('otp-email');
            emailService.sendOtpEmail = jest.fn();
            otpService.sendOtpSms = jest.fn(); // Not expected to be called

            const mockRequest = {
                user: { id: 'user-id' },
                headers: {
                    'device-type': 'web',
                    'user-agent': 'Mozilla/5.0',
                    'device-id': 'device-id',
                    'app-version': '1.0.0',
                    timezone: 'UTC',
                },
                ip: '127.0.0.1',
            } as unknown as Request;

            await service.sendPhoneChangeOtp(mockRequest);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-id' },
            });
            expect(otpService.handleOtpGeneration).toHaveBeenCalledWith(
                mockUser,
                mockUser.email,
                VerificationType.UPDATE_PHONE,
            );
            expect(emailService.sendOtpEmail).toHaveBeenCalledWith(mockUser, 'otp-email', expiryTimeEnum.FIVE_MIN);
            expect(otpService.sendOtpSms).not.toHaveBeenCalled();
            expect(deviceInformationService.create).toHaveBeenCalledWith(
                extractDeviceInfo({
                    request: mockRequest,
                    activity_type: ActivityType.UPDATE_PHONE,
                    user: mockUser,
                }),
            );
        });

        it('should throw BadRequestException if no contact number or email', async () => {
            const mockUser = {
                id: 'user-id',
                contact_number: null,
                email: null,
            } as User;

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

            const mockRequest = {
                user: { id: 'user-id' },
            } as unknown as Request;

            await expect(service.sendPhoneChangeOtp(mockRequest)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if user is not found', async () => {
            userRepository.findOne = jest.fn().mockResolvedValue(null);

            const mockRequest = {
                user: { id: 'user-id' },
            } as unknown as Request;

            await expect(service.sendPhoneChangeOtp(mockRequest)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updatePhoneNo', () => {
        it('should update the phone number and create device info', async () => {
            const mockUser = {
                id: 'user-id',
                contact_number: '1234567890',
                country_code: 'US',
                role: { role_name: 'user' },
            } as User;

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            otpService.validateOtp = jest.fn().mockResolvedValue(true);
            userRepository.update = jest.fn().mockResolvedValue({ affected: 1 } as UpdateResult); // Mocked to return a result with `affected` property
            deviceInformationService.create = jest.fn();

            const mockRequest = {
                user: { id: 'user-id' },
                headers: {
                    'device-type': 'web',
                    'user-agent': 'Mozilla/5.0',
                    'device-id': 'device-id',
                    'app-version': '1.0.0',
                    timezone: 'UTC',
                },
                ip: '127.0.0.1',
            } as unknown as Request;

            const updatePhoneDto: UpdatePhoneDto = {
                otp: 123456,
                contact_number: '0987654321',
                country_code: 'US',
            };

            await service.updatePhoneNo(updatePhoneDto, mockRequest);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-id' },
                relations: ['role'],
            });
            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, updatePhoneDto.otp);
            expect(userRepository.update).toHaveBeenCalledWith('user-id', {
                contact_number: updatePhoneDto.contact_number,
                country_code: updatePhoneDto.country_code,
            });
            expect(deviceInformationService.create).toHaveBeenCalledWith(
                extractDeviceInfo({
                    request: mockRequest,
                    activity_type: ActivityType.VERIFY_EMAIL_UPDATE,
                    user: mockUser,
                }),
            );
        });

        it('should throw UnauthorizedException if user is not found', async () => {
            userRepository.findOne = jest.fn().mockResolvedValue(null);

            const mockRequest = {
                user: { id: 'user-id' },
            } as unknown as Request;

            const updatePhoneDto: UpdatePhoneDto = {
                otp: 123456,
                contact_number: '0987654321',
                country_code: '+91',
            };

            await expect(service.updatePhoneNo(updatePhoneDto, mockRequest)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException if OTP is invalid', async () => {
            const mockUser = {
                id: 'user-id',
                contact_number: '1234567890',
                country_code: '+91',
                role: { role_name: 'user' },
            } as User;

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            otpService.validateOtp = jest.fn().mockResolvedValue(false);

            const mockRequest = {
                user: { id: 'user-id' },
            } as unknown as Request;

            const updatePhoneDto: UpdatePhoneDto = {
                otp: 123456,
                contact_number: '0987654321',
                country_code: '+91',
            };

            await expect(service.updatePhoneNo(updatePhoneDto, mockRequest)).rejects.toThrow(BadRequestException);
        });
    });
});
