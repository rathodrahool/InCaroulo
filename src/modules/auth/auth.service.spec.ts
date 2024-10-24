import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { OtpService } from './otp/otp.service';
import { EmailService } from '@root/src/shared/services/mail/mail.service';
import { TokenService } from '../token/token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DeviceInformationService } from './device-information/device.information.service';
import * as bcrypt from 'bcrypt';
import { EmailLoginDto } from './dto/email.login.dto';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AUTH_ERROR } from '@root/src/shared/constants/messages';
import {
    ActivityType,
    DefaultImage,
    expiryTimeEnum,
    MediaFolder,
    TokenTypeEnum,
    UserStatus,
    VerificationType,
} from '@root/src/shared/constants/enum';
import { User } from '../user/entities/user.entity';
import { EmailVerifyDto } from './dto/email.verify.dto';
import * as commonFunctions from '@shared/helpers/common.functions';
import { EmailUpdatePasswordDto } from './dto/email.update.password.dto';
import { EmailSignupDto } from './dto/email.signup.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { PhoneSignupDto } from './dto/phone.signup.dto';
import { PhoneVerifyDto } from './dto/phone.verify.dto';
import { PhoneLoginDto } from './dto/phone.login.dto';
import { generateTokens } from '@shared/helpers/common.functions';

jest.mock('bcrypt');

// Mock the helper module
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

describe('AuthService', () => {
    let service: AuthService;
    let userService: UserService;
    let otpService: OtpService;
    let tokenService: TokenService;
    let emailService: EmailService;
    let roleService: RoleService;
    let deviceInformationService: DeviceInformationService;
    let jwtService: JwtService;
    let configService: ConfigService;
    const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: { role_name: 'admin' },
    } as unknown as User;

    const emailVerifyDto: EmailVerifyDto = { email: 'test@example.com', otp: 123456 };

    const mockReq = {
        user: { id: '1' },
        token: 'mockAccessToken',
    };

    const mockToken = {
        id: '1',
        refresh_token: 'mockRefreshToken',
        access_token: 'mockAccessToken',
    };

    const mockDecodedToken = {
        id: '1',
    };
    const mockTokens = {
        id: '1',
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
        accessTokenExpiryTime: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        refreshTokenExpiryTime: new Date(Date.now() + 7200 * 1000), // 2 hours from now
    };

    const mockRole = { role_name: 'user' };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: jest.fn(),
                        findByContactNumber: jest.fn(),
                        findOneWhere: jest.fn(),
                        update: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: RoleService,
                    useValue: {
                        findOneWhere: jest.fn(),
                    },
                },
                {
                    provide: OtpService,
                    useValue: {
                        handleOtpGeneration: jest.fn(),
                        findOneWhere: jest.fn(),
                        validateOtp: jest.fn(),
                    },
                },
                {
                    provide: EmailService,
                    useValue: {
                        sendOtpEmail: jest.fn(),
                        sendAccountVerificationLink: jest.fn(),
                        sendPasswordResetLink: jest.fn(),
                    },
                },
                {
                    provide: TokenService,
                    useValue: {
                        create: jest.fn(),
                        findTokenRecord: jest.fn(),
                        validateToken: jest.fn(),
                        invalidateToken: jest.fn(),
                        update: jest.fn(),
                        findOneWhere: jest.fn(),
                    },
                },
                {
                    provide: DeviceInformationService,
                    useValue: {
                        create: jest.fn(),
                        findOneWhere: jest.fn(),
                        logoutAllDevice: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        verify: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        otpService = module.get<OtpService>(OtpService);
        roleService = module.get<RoleService>(RoleService);
        tokenService = module.get<TokenService>(TokenService);
        emailService = module.get<EmailService>(EmailService);
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);
        deviceInformationService = module.get<DeviceInformationService>(DeviceInformationService);
        jest.mock('@shared/helpers/common.functions', () => ({
            generateTokens: jest.fn().mockReturnValue(mockTokens),
        }));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('hashPassword', () => {
        it('should generate a salt and hash the password', async () => {
            const password = 'testPassword';
            const salt = 'testSalt';
            const hashedPassword = 'hashedPassword';

            (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

            const result = await service.hashPassword(password);

            expect(bcrypt.genSalt).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
            expect(result).toBe(hashedPassword);
        });
    });

    describe('validatePassword', () => {
        it('should return true if the password matches the hash', async () => {
            const password = 'testPassword';
            const hashedPassword = 'hashedPassword';

            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validatePassword(password, hashedPassword);

            expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
            expect(result).toBe(true);
        });

        it('should return false if the password does not match the hash', async () => {
            const password = 'testPassword';
            const hashedPassword = 'hashedPassword';

            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.validatePassword(password, hashedPassword);

            expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
            expect(result).toBe(false);
        });
    });
    describe('signUp', () => {
        const mockRequest = {
            headers: {
                'user-agent': 'test-agent',
            },
            ip: '127.0.0.1',
        };

        const mockEmailSignupDto: EmailSignupDto = {
            email: 'test@example.com',
            password: 'password123',
            confirm_password: 'password123',
        };

        it('should throw BadRequestException if user is blocked', async () => {
            const mockUser = { status: UserStatus.BLOCKED } as User;
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

            await expect(service.signUp(mockEmailSignupDto, mockRequest)).rejects.toThrow(BadRequestException);
        });
        it('should update device information and token when device exists', async () => {
            const isExistDevice = { id: 'deviceId123', device_type: 'mockDeviceType' };
            const existingUser = {
                id: 'userId123',
                email: 'test@example.com',
                status: UserStatus.UNVERIFIED,
            };
            const deviceInfo = { device_type: 'mockDeviceType' };
            const ab = { id: 'tokenId123' };
            const otp = 123456; // Example OTP value

            // Mock methods
            userService.findByEmail = jest.fn().mockResolvedValueOnce(existingUser);
            otpService.handleOtpGeneration = jest.fn().mockResolvedValueOnce(otp);
            deviceInformationService.findOneWhere = jest.fn().mockResolvedValueOnce(isExistDevice);
            tokenService.findOneWhere = jest.fn().mockResolvedValueOnce(ab);

            await service.signUp(mockEmailSignupDto, {});

            // Assertions
            expect(deviceInformationService.update).toHaveBeenCalledWith(
                isExistDevice.id,
                expect.objectContaining({
                    link_id: expect.any(String),
                }),
            );
            expect(tokenService.findOneWhere).toHaveBeenCalledWith({
                where: { user: { id: existingUser.id }, device: { device_type: deviceInfo.device_type } },
            });
            expect(tokenService.update).toHaveBeenCalledWith(
                ab.id,
                expect.objectContaining({
                    access_token: expect.any(String),
                    access_token_expiry: expect.any(Date),
                }),
            );
        });
        it('should handle unverified user signup', async () => {
            const mockUser = { id: '1', email: 'test@example.com', status: UserStatus.UNVERIFIED } as User;
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue('123456');
            (deviceInformationService.findOneWhere as jest.Mock).mockResolvedValue(null);
            (deviceInformationService.create as jest.Mock).mockResolvedValue({ id: '1' });
            (tokenService.create as jest.Mock).mockResolvedValue({});

            await service.signUp(mockEmailSignupDto, mockRequest);

            expect(otpService.handleOtpGeneration).toHaveBeenCalled();
            expect(deviceInformationService.create).toHaveBeenCalled();
            expect(tokenService.create).toHaveBeenCalled();
            expect(emailService.sendAccountVerificationLink).toHaveBeenCalled();
        });

        it('should throw ConflictException if user already exists and is verified', async () => {
            const mockUser = { status: UserStatus.VERIFIED } as User;
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

            await expect(service.signUp(mockEmailSignupDto, mockRequest)).rejects.toThrow(ConflictException);
        });

        it('should create a new user if email does not exist', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            (roleService.findOneWhere as jest.Mock).mockResolvedValue({ id: '1', role_name: 'user' });
            (userService.create as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue('123456');
            (deviceInformationService.create as jest.Mock).mockResolvedValue({ id: '1' });
            (tokenService.create as jest.Mock).mockResolvedValue({});

            await service.signUp(mockEmailSignupDto, mockRequest);

            expect(userService.create).toHaveBeenCalled();
            expect(otpService.handleOtpGeneration).toHaveBeenCalled();
            expect(deviceInformationService.create).toHaveBeenCalled();
            expect(tokenService.create).toHaveBeenCalled();
            expect(emailService.sendAccountVerificationLink).toHaveBeenCalled();
        });
    });
    describe('verify Signup', () => {
        it('should throw UnauthorizedException if token record is not found', async () => {
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(null);

            await expect(service.verifySignup('invalidLinkId', {})).rejects.toThrow(UnauthorizedException);
            expect(tokenService.findTokenRecord).toHaveBeenCalledWith('invalidLinkId', ActivityType.SIGNUP);
        });

        it('should throw BadRequestException if user is already verified', async () => {
            const mockTokenRecord = {
                device: {
                    user: { status: UserStatus.VERIFIED },
                },
            };
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);

            await expect(service.verifySignup('validLinkId', {})).rejects.toThrow(BadRequestException);
        });

        it('should throw UnauthorizedException if token is invalid', async () => {
            const mockTokenRecord = {
                device: {
                    user: { status: UserStatus.UNVERIFIED },
                },
                access_token: 'validToken',
            };
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(false);

            await expect(service.verifySignup('validLinkId', {})).rejects.toThrow(UnauthorizedException);
            expect(tokenService.validateToken).toHaveBeenCalledWith('validToken', TokenTypeEnum.ACCESS);
        });

        it('should throw UnauthorizedException if user does not exist', async () => {
            const mockTokenRecord = {
                device: {
                    user: { status: UserStatus.UNVERIFIED },
                },
                access_token: 'validToken',
            };
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(true);
            (jwtService.verify as jest.Mock).mockReturnValue({ email: 'test@example.com' });
            (userService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(service.verifySignup('validLinkId', {})).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if OTP is invalid', async () => {
            const mockUser = { id: '1', email: 'test@example.com', role: { role_name: 'user' } };
            const mockTokenRecord = {
                device: {
                    user: { status: UserStatus.UNVERIFIED },
                },
                access_token: 'validToken',
            };
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(true);
            (jwtService.verify as jest.Mock).mockReturnValue({ email: 'test@example.com', otp: '123456' });
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(false);

            await expect(service.verifySignup('validLinkId', {})).rejects.toThrow(UnauthorizedException);
        });

        it('should successfully verify signup and return user data with new tokens', async () => {
            const mockUser = { id: '1', email: 'test@example.com', role: { role_name: 'user' } };
            const mockTokenRecord = {
                device: {
                    user: { status: UserStatus.UNVERIFIED },
                },
                access_token: 'validToken',
            };
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(true);
            (jwtService.verify as jest.Mock).mockReturnValue({ email: 'test@example.com', otp: '123456' });
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(true);
            (deviceInformationService.create as jest.Mock).mockResolvedValue({ id: 'newDeviceId' });

            const result = await service.verifySignup('validLinkId', {});

            expect(userService.update).toHaveBeenCalledWith('1', { status: UserStatus.VERIFIED });
            expect(deviceInformationService.logoutAllDevice).toHaveBeenCalledWith(mockUser);
            expect(tokenService.create).toHaveBeenCalled();
            expect(result).toEqual({
                id: '1',
                email: 'test@example.com',
                access_token: 'mockAccessToken',
                refresh_token: 'mockRefreshToken',
            });
        });
    });
    describe('login', () => {
        it('should throw UnauthorizedException when user is not found', async () => {
            const emailLoginDto: EmailLoginDto = { email: 'test@example.com', password: 'password' };

            (userService.findOneWhere as jest.Mock).mockResolvedValue(null);

            const loginMethod = service.login(emailLoginDto);

            await expect(loginMethod).rejects.toThrow(UnauthorizedException);
            await expect(loginMethod).rejects.toThrow(AUTH_ERROR.WRONG_CREDENTIALS);

            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { email: emailLoginDto.email },
            });
        });
        it('should throw BadRequestException when user is unverified', async () => {
            const emailLoginDto: EmailLoginDto = { email: 'test@example.com', password: 'password' };
            const mockUser = { status: UserStatus.UNVERIFIED } as User;

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

            await expect(service.login(emailLoginDto)).rejects.toThrow(BadRequestException);
            await expect(service.login(emailLoginDto)).rejects.toThrow(AUTH_ERROR.ACCOUNT_NOT_VERIFIED);
        });

        it('should throw UnauthorizedException when password is invalid', async () => {
            const emailLoginDto: EmailLoginDto = { email: 'test@example.com', password: 'invalidPassword' };
            const mockUser = { status: UserStatus.VERIFIED, password: 'hashedPassword' } as User;

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (service['validatePassword'] as jest.Mock) = jest.fn().mockResolvedValue(false);

            await expect(service.login(emailLoginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(emailLoginDto)).rejects.toThrow(AUTH_ERROR.WRONG_CREDENTIALS);
        });

        it('should send OTP and email when login is successful', async () => {
            const emailLoginDto: EmailLoginDto = { email: 'test@example.com', password: 'password' };
            const mockUser = {
                status: UserStatus.VERIFIED,
                password: 'hashedPassword',
                email: 'test@example.com',
            } as User;
            const mockOtp = '123456';

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (service['validatePassword'] as jest.Mock) = jest.fn().mockResolvedValue(true);
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue(mockOtp);

            await service.login(emailLoginDto);

            expect(otpService.handleOtpGeneration).toHaveBeenCalledWith(
                mockUser,
                mockUser.email,
                VerificationType.LOGIN,
            );
            expect(emailService.sendOtpEmail).toHaveBeenCalledWith(mockUser, mockOtp, expiryTimeEnum.FIVE_MIN);
        });
    });

    describe('verifyLogin', () => {
        it('should throw UnauthorizedException when user is not found', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(service.verifyLogin(emailVerifyDto, mockReq)).rejects.toThrow(UnauthorizedException);
            await expect(service.verifyLogin(emailVerifyDto, mockReq)).rejects.toThrow(AUTH_ERROR.WRONG_CREDENTIALS);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { email: emailVerifyDto.email },
                relations: ['role'],
            });
        });

        it('should throw BadRequestException when OTP is invalid', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(false); // OTP is invalid

            await expect(service.verifyLogin(emailVerifyDto, mockReq)).rejects.toThrow(BadRequestException);
            await expect(service.verifyLogin(emailVerifyDto, mockReq)).rejects.toThrow(AUTH_ERROR.INVALID_OTP);
            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, emailVerifyDto.otp);
        });

        it('should return tokens and user info on successful login', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(true); // OTP is valid

            (commonFunctions.extractDeviceInfo as jest.Mock).mockReturnValue({
                device_id: 'mockDeviceId',
                device_type: 'mockDeviceType',
                device_name: 'mockDeviceName',
                device_ip: 'mockDeviceIp',
                app_version: 'mockAppVersion',
                timezone: 'mockTimezone',
                activity_type: 'login',
            });

            (deviceInformationService.create as jest.Mock).mockResolvedValue({
                id: '1',
                device_id: 'mockDeviceId',
            });

            const result = await service.verifyLogin(emailVerifyDto, mockReq);

            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, emailVerifyDto.otp);
            expect(deviceInformationService.logoutAllDevice).toHaveBeenCalledWith(mockUser);
            expect(commonFunctions.extractDeviceInfo).toHaveBeenCalledWith({
                request: mockReq,
                activity_type: ActivityType.LOGIN,
                user: mockUser,
                is_active: true,
            });
            expect(deviceInformationService.create).toHaveBeenCalledWith({
                device_id: 'mockDeviceId',
                device_type: 'mockDeviceType',
                device_name: 'mockDeviceName',
                device_ip: 'mockDeviceIp',
                app_version: 'mockAppVersion',
                timezone: 'mockTimezone',
                activity_type: ActivityType.LOGIN,
            });

            expect(tokenService.create).toHaveBeenCalledWith({
                entity: mockUser,
                access_token: 'mockAccessToken',
                access_token_expiry: expect.any(Date),
                refresh_token: 'mockRefreshToken',
                refresh_token_expiry: expect.any(Date),
                type: TokenTypeEnum.ACCESS,
                device: { id: '1', device_id: 'mockDeviceId' },
            });

            expect(result).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                access_token: 'mockAccessToken',
                refresh_token: 'mockRefreshToken',
            });
        });
    });
    describe('forgotPassword', () => {
        const mockEmailForgetPasswordDto = { email: 'test@example.com' };
        const mockRequest = {
            headers: {
                'user-agent': 'test-agent',
            },
            ip: '127.0.0.1',
        };

        it('should throw BadRequestException if user is not found', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(service.forgotPassword(mockEmailForgetPasswordDto, mockRequest)).rejects.toThrow(
                BadRequestException,
            );
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { email: mockEmailForgetPasswordDto.email },
            });
        });

        it('should update existing device info and token if device is found', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const mockDeviceInfo = { id: 'device1', device_type: 'testDevice' };
            const mockToken = { id: 'token1' };

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue('123456');
            (deviceInformationService.findOneWhere as jest.Mock).mockResolvedValue(mockDeviceInfo);
            (tokenService.findOneWhere as jest.Mock).mockResolvedValue(mockToken);

            await service.forgotPassword(mockEmailForgetPasswordDto, mockRequest);

            expect(deviceInformationService.update).toHaveBeenCalledWith(mockDeviceInfo.id, expect.any(Object));
            expect(tokenService.update).toHaveBeenCalledWith(mockToken.id, expect.any(Object));
        });

        it('should create new device info and token if device is not found', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const mockDeviceInfo = { id: 'newDeviceId', device_type: 'newDevice' };

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue('123456');
            (deviceInformationService.findOneWhere as jest.Mock).mockResolvedValue(null);
            (deviceInformationService.create as jest.Mock).mockResolvedValue(mockDeviceInfo);

            await service.forgotPassword(mockEmailForgetPasswordDto, mockRequest);

            expect(deviceInformationService.create).toHaveBeenCalled();
            expect(tokenService.create).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should send password reset email with the correct link and expiry time', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue('123456');
            (deviceInformationService.findOneWhere as jest.Mock).mockResolvedValue(null);
            (deviceInformationService.create as jest.Mock).mockResolvedValue({ id: 'newDeviceId' });

            await service.forgotPassword(mockEmailForgetPasswordDto, mockRequest);

            expect(emailService.sendPasswordResetLink).toHaveBeenCalledWith(
                mockUser,
                expect.any(String),
                expiryTimeEnum.FIVE_MIN,
            );
        });
    });

    describe('socialAuthRedirect', () => {
        describe('google', () => {
            const mockRequest = {
                headers: {
                    'user-agent': 'test-agent',
                },
                ip: '127.0.0.1',
            };

            const mockSocialGoogleDto = {
                email: 'test@example.com',
                google_id: 'google-123',
                apple_id: null,
            };

            it('should find an existing user by Google ID and match the email', async () => {
                const mockUser = { id: '1', email: 'test@example.com', role: { role_name: 'user' } } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

                await service.socialAuthRedirect(mockSocialGoogleDto, mockRequest);

                expect(userService.findOneWhere).toHaveBeenCalledWith({
                    where: { google_id: mockSocialGoogleDto.google_id },
                    relations: ['role'],
                });
            });

            it('should throw BadRequestException if email does not match', async () => {
                const mockUser = { id: '1', email: 'different@example.com', role: { role_name: 'user' } } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

                await expect(service.socialAuthRedirect(mockSocialGoogleDto, mockRequest)).rejects.toThrow(
                    BadRequestException,
                );
            });

            it('should throw ConflictException if email is already taken', async () => {
                const mockUserByEmail = { id: '2', email: 'test@example.com' } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by social ID
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(mockUserByEmail); // User by email exists

                await expect(service.socialAuthRedirect(mockSocialGoogleDto, mockRequest)).rejects.toThrow(
                    ConflictException,
                );
                expect(userService.findOneWhere).toHaveBeenCalledWith({ where: { email: mockSocialGoogleDto.email } });
            });

            it('should throw NotFoundException if default role is not found', async () => {
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by social ID
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by email
                (roleService.findOneWhere as jest.Mock).mockResolvedValue(null); // No role found

                await expect(service.socialAuthRedirect(mockSocialGoogleDto, mockRequest)).rejects.toThrow(
                    NotFoundException,
                );
                expect(roleService.findOneWhere).toHaveBeenCalledWith({ where: { role_name: 'user' } });
            });

            it('should throw BadRequestException if user does not have a role', async () => {
                const mockUser = { id: '1', email: 'test@example.com', role: null } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

                await expect(service.socialAuthRedirect(mockSocialGoogleDto, mockRequest)).rejects.toThrow(
                    BadRequestException,
                );
            });

            it('should create a new user, generate tokens, and store device info', async () => {
                const mockUser = { id: '1', email: 'test@example.com', role: { role_name: 'user' } } as User;
                const mockRole = { id: 'role1', role_name: 'user' };
                const mockDeviceInfo = { id: 'device1' };

                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by social ID
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by email
                (roleService.findOneWhere as jest.Mock).mockResolvedValue(mockRole); // Default role found
                (userService.create as jest.Mock).mockResolvedValue(mockUser);
                (deviceInformationService.create as jest.Mock).mockResolvedValue(mockDeviceInfo);

                const result = await service.socialAuthRedirect(mockSocialGoogleDto, mockRequest);

                expect(userService.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: mockSocialGoogleDto.email,
                        role: mockRole,
                        image: DefaultImage.user,
                    }),
                );
                expect(deviceInformationService.create).toHaveBeenCalled();
                expect(tokenService.create).toHaveBeenCalledWith(expect.any(Object));
                expect(result).toEqual(
                    expect.objectContaining({
                        id: mockUser.id,
                        email: mockUser.email,
                        access_token: expect.any(String),
                        refresh_token: expect.any(String),
                    }),
                );
            });
        });
        describe('apple', () => {
            const mockRequest = {
                headers: {
                    'user-agent': 'test-agent',
                },
                ip: '127.0.0.1',
            };

            const mockSocialAppleDto = {
                email: 'test@example.com',
                google_id: null,
                apple_id: 'google-123',
            };

            it('should find an existing user by Apple ID and match the email', async () => {
                const mockUser = { id: '1', email: 'test@example.com', role: { role_name: 'user' } } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

                await service.socialAuthRedirect(mockSocialAppleDto, mockRequest);

                expect(userService.findOneWhere).toHaveBeenCalledWith({
                    where: { apple_id: mockSocialAppleDto.apple_id },
                    relations: ['role'],
                });
            });

            it('should throw BadRequestException if email does not match', async () => {
                const mockUser = { id: '1', email: 'different@example.com', role: { role_name: 'user' } } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

                await expect(service.socialAuthRedirect(mockSocialAppleDto, mockRequest)).rejects.toThrow(
                    BadRequestException,
                );
            });

            it('should throw ConflictException if email is already taken', async () => {
                const mockUserByEmail = { id: '2', email: 'test@example.com' } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by social ID
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(mockUserByEmail); // User by email exists

                await expect(service.socialAuthRedirect(mockSocialAppleDto, mockRequest)).rejects.toThrow(
                    ConflictException,
                );
                expect(userService.findOneWhere).toHaveBeenCalledWith({ where: { email: mockSocialAppleDto.email } });
            });

            it('should throw NotFoundException if default role is not found', async () => {
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by social ID
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by email
                (roleService.findOneWhere as jest.Mock).mockResolvedValue(null); // No role found

                await expect(service.socialAuthRedirect(mockSocialAppleDto, mockRequest)).rejects.toThrow(
                    NotFoundException,
                );
                expect(roleService.findOneWhere).toHaveBeenCalledWith({ where: { role_name: 'user' } });
            });

            it('should throw BadRequestException if user does not have a role', async () => {
                const mockUser = { id: '1', email: 'test@example.com', role: null } as User;

                (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

                await expect(service.socialAuthRedirect(mockSocialAppleDto, mockRequest)).rejects.toThrow(
                    BadRequestException,
                );
            });

            it('should create a new user, generate tokens, and store device info', async () => {
                const mockUser = { id: '1', email: 'test@example.com', role: { role_name: 'user' } } as User;
                const mockRole = { id: 'role1', role_name: 'user' };
                const mockDeviceInfo = { id: 'device1' };

                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by social ID
                (userService.findOneWhere as jest.Mock).mockResolvedValueOnce(null); // No user by email
                (roleService.findOneWhere as jest.Mock).mockResolvedValue(mockRole); // Default role found
                (userService.create as jest.Mock).mockResolvedValue(mockUser);
                (deviceInformationService.create as jest.Mock).mockResolvedValue(mockDeviceInfo);

                const result = await service.socialAuthRedirect(mockSocialAppleDto, mockRequest);

                expect(userService.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: mockSocialAppleDto.email,
                        role: mockRole,
                        image: DefaultImage.user,
                    }),
                );
                expect(deviceInformationService.create).toHaveBeenCalled();
                expect(tokenService.create).toHaveBeenCalledWith(expect.any(Object));
                expect(result).toEqual(
                    expect.objectContaining({
                        id: mockUser.id,
                        email: mockUser.email,
                        access_token: expect.any(String),
                        refresh_token: expect.any(String),
                    }),
                );
            });
        });
    });

    describe('resetPassword', () => {
        const mockTokenRecord = {
            access_token: 'mockAccessToken',
            device: {
                link_id: 'mockLinkId',
                activity_type: ActivityType.FORGOT_PASSWORD,
                user: {
                    id: '1',
                    email: 'testuser@example.com',
                    status: UserStatus.VERIFIED,
                },
            },
        };
        const mockOtpRecord = {
            id: '1',
            email: 'test@example.com',
            otp: 123456,
            is_verified: false,
            expire_at: new Date(Date.now() + 60 * 60 * 1000),
            user: {
                id: '1',
                email: 'test@example.com',
                status: UserStatus.VERIFIED,
            },
        };
        const emailUpdatePasswordDto: EmailUpdatePasswordDto = {
            email: 'test@example.com',
            new_password: 'Abcd@112233',
            confirm_password: 'Abcd@112233',
        };
        const linkId = 'mockLinkId';

        it('should successfully reset the password', async () => {
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(true);
            (jwtService.verify as jest.Mock).mockReturnValue({ email: 'test@example.com', otp: 123456 });
            (otpService.findOneWhere as jest.Mock).mockResolvedValue(mockOtpRecord);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(true);

            const mockHashedPassword = 'mockHashedPassword123';
            service.hashPassword = jest.fn().mockResolvedValue(mockHashedPassword);
            (configService.get as jest.Mock).mockReturnValue('mockJwtSecret');

            await service.resetPassword(emailUpdatePasswordDto, linkId, mockReq);

            // Assert
            expect(tokenService.findTokenRecord).toHaveBeenCalledWith(linkId, ActivityType.FORGOT_PASSWORD);
            expect(tokenService.validateToken).toHaveBeenCalledWith(mockTokenRecord.access_token, TokenTypeEnum.ACCESS);
            (jwtService.verify as jest.Mock).mockReturnValue({ email: 'test@example.com', otp: 123456 });
            expect(otpService.findOneWhere).toHaveBeenCalledWith({
                where: {
                    email: 'test@example.com',
                    otp: 123456,
                    type: VerificationType.FORGOT_PASSWORD,
                },
                relations: ['user'],
            });
            expect(otpService.validateOtp).toHaveBeenCalledWith(mockOtpRecord.user, mockOtpRecord.otp);
            expect(userService.update).toHaveBeenCalledWith(mockOtpRecord.user.id, { password: mockHashedPassword });
            expect(deviceInformationService.create).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if token record not found', async () => {
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(null);

            await expect(service.resetPassword(emailUpdatePasswordDto, linkId, mockReq)).rejects.toThrow(
                new UnauthorizedException(AUTH_ERROR.INVALID_LINK),
            );

            expect(tokenService.findTokenRecord).toHaveBeenCalledWith(linkId, ActivityType.FORGOT_PASSWORD);
        });

        it('should throw UnauthorizedException if token is invalid', async () => {
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(false); // Invalid token

            await expect(service.resetPassword(emailUpdatePasswordDto, linkId, mockReq)).rejects.toThrow(
                new UnauthorizedException(AUTH_ERROR.TOKEN_EXPIRED),
            );

            expect(tokenService.validateToken).toHaveBeenCalledWith(mockTokenRecord.access_token, TokenTypeEnum.ACCESS);
        });

        it('should throw UnauthorizedException if OTP is not found', async () => {
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(true);
            (jwtService.verify as jest.Mock).mockReturnValue({ email: 'test@example.com', otp: 123456 });
            (otpService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(service.resetPassword(emailUpdatePasswordDto, linkId, mockReq)).rejects.toThrow(
                new UnauthorizedException(AUTH_ERROR.INVALID_LINK),
            );

            expect(otpService.findOneWhere).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if OTP is not verified', async () => {
            // Arrange

            const linkId = 'validLinkId';
            const mockReq = { headers: {} };
            const mockTokenRecord = {
                access_token: 'validToken',
            };

            const decodedUser = {
                email: 'test@example.com',
                otp: 123456,
            };

            const mockOtpRecord = {
                email: 'test@example.com',
                otp: 123456,
                is_verified: false,
                expire_at: new Date(Date.now() + 10000),
                user: {
                    id: 'userId',
                    email: 'test@example.com',
                },
            };

            tokenService.findTokenRecord = jest.fn().mockResolvedValue(mockTokenRecord);
            tokenService.validateToken = jest.fn().mockResolvedValue(true);
            jwtService.verify = jest.fn().mockResolvedValue(decodedUser);
            otpService.findOneWhere = jest.fn().mockResolvedValue(mockOtpRecord);
            otpService.validateOtp = jest.fn().mockResolvedValue(false); // OTP not verified

            // Act & Assert
            await expect(service.resetPassword(emailUpdatePasswordDto, linkId, mockReq)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.resetPassword(emailUpdatePasswordDto, linkId, mockReq)).rejects.toThrow(
                AUTH_ERROR.INVALID_LINK,
            );

            expect(tokenService.findTokenRecord).toHaveBeenCalledWith(linkId, ActivityType.FORGOT_PASSWORD);
            expect(tokenService.validateToken).toHaveBeenCalledWith('validToken', TokenTypeEnum.ACCESS);
            expect(jwtService.verify).toHaveBeenCalledWith('validToken', { secret: undefined });
            expect(otpService.findOneWhere).toHaveBeenCalledWith({
                where: {
                    email: decodedUser.email,
                    otp: decodedUser.otp,
                    type: VerificationType.FORGOT_PASSWORD,
                },
                relations: ['user'],
            });
            expect(otpService.validateOtp).toHaveBeenCalledWith(mockOtpRecord.user, mockOtpRecord.otp);
        });

        it('should throw UnauthorizedException if OTP is expired', async () => {
            const expiredOtpRecord = { ...mockOtpRecord, expire_at: new Date(new Date().getTime() - 10000) };
            (tokenService.findTokenRecord as jest.Mock).mockResolvedValue(mockTokenRecord);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(true);
            (jwtService.verify as jest.Mock).mockReturnValue({ email: 'test@example.com', otp: 123456 });
            (otpService.findOneWhere as jest.Mock).mockResolvedValue(expiredOtpRecord);

            await expect(service.resetPassword(emailUpdatePasswordDto, linkId, mockReq)).rejects.toThrow(
                new UnauthorizedException(AUTH_ERROR.LINK_EXPIRED),
            );

            expect(otpService.findOneWhere).toHaveBeenCalled();
        });
    });
    describe('logout', () => {
        it('should successfully log out the user', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

            (tokenService.findOneWhere as jest.Mock)
                .mockResolvedValueOnce(mockToken.access_token)
                .mockResolvedValueOnce(mockToken.refresh_token);

            await service.logout(mockReq);

            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: mockReq.user.id },
                relations: ['role'],
            });
            expect(tokenService.findOneWhere).toHaveBeenCalledTimes(2);
            expect(tokenService.invalidateToken).toHaveBeenCalledTimes(2);
            expect(deviceInformationService.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if the user is not found', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(undefined);

            await expect(service.logout(mockReq)).rejects.toThrow(NotFoundException);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: mockReq.user.id },
                relations: ['role'],
            });
            expect(tokenService.findOneWhere).not.toHaveBeenCalled();
            expect(deviceInformationService.create).not.toHaveBeenCalled();
        });

        it('should not invalidate tokens if no access/refresh tokens are found', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

            (tokenService.findOneWhere as jest.Mock).mockResolvedValueOnce(null);
            (tokenService.findOneWhere as jest.Mock).mockResolvedValueOnce(null);

            await service.logout(mockReq);

            expect(tokenService.invalidateToken).not.toHaveBeenCalled();
            expect(deviceInformationService.create).toHaveBeenCalled();
        });
    });

    describe('refreshToken', () => {
        it('should successfully refresh tokens', async () => {
            // Arrange
            const refreshTokenDto: RefreshTokenDto = { refresh_token: 'validRefreshToken' };

            // Mocking dependencies
            (jwtService.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (tokenService.findOneWhere as jest.Mock).mockResolvedValue(mockToken);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(true);
            (commonFunctions.generateTokens as jest.Mock) = jest.fn().mockReturnValue(mockTokens);

            // Act
            const result = await service.refreshToken(refreshTokenDto);

            // Assert
            expect(jwtService.verify).toHaveBeenCalledWith(refreshTokenDto.refresh_token, {
                secret: undefined,
            });
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: mockDecodedToken.id },
                relations: ['role'],
            });
            expect(tokenService.findOneWhere).toHaveBeenCalledWith({
                where: { user: { id: mockUser.id }, refresh_token: refreshTokenDto.refresh_token },
            });
            expect(tokenService.validateToken).toHaveBeenCalledWith(mockToken.refresh_token, TokenTypeEnum.REFRESH);
            expect(tokenService.invalidateToken).toHaveBeenCalledWith(mockToken, TokenTypeEnum.REFRESH);
            expect(tokenService.create).toHaveBeenCalledWith({
                entity: mockUser,
                access_token: mockTokens.accessToken,
                refresh_token: mockTokens.refreshToken,
                access_token_expiry: mockTokens.accessTokenExpiryTime,
                refresh_token_expiry: mockTokens.refreshTokenExpiryTime,
            });
            expect(result).toEqual({
                access_token: mockToken.access_token,
                refresh_token: mockToken.refresh_token,
            });
        });

        it('should throw NotFoundException if the user is not found', async () => {
            // Arrange
            const refreshTokenDto: RefreshTokenDto = { refresh_token: 'validRefreshToken' };

            // Mocking dependencies
            (jwtService.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (userService.findOneWhere as jest.Mock).mockResolvedValue(undefined); // User not found

            // Act & Assert
            await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(NotFoundException);
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { id: mockDecodedToken.id },
                relations: ['role'],
            });
            expect(tokenService.findOneWhere).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if the token is not found', async () => {
            const refreshTokenDto: RefreshTokenDto = { refresh_token: 'validRefreshToken' };

            (jwtService.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (tokenService.findOneWhere as jest.Mock).mockResolvedValue(undefined);

            await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(BadRequestException);
            expect(tokenService.findOneWhere).toHaveBeenCalledWith({
                where: { user: { id: mockUser.id }, refresh_token: refreshTokenDto.refresh_token },
            });
        });

        it('should throw BadRequestException if the refresh token is invalid', async () => {
            const refreshTokenDto: RefreshTokenDto = { refresh_token: 'validRefreshToken' };

            (jwtService.verify as jest.Mock).mockReturnValue(mockDecodedToken);
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (tokenService.findOneWhere as jest.Mock).mockResolvedValue(mockToken);
            (tokenService.validateToken as jest.Mock).mockResolvedValue(false); // Invalid token

            await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(BadRequestException);
            expect(tokenService.validateToken).toHaveBeenCalledWith(mockToken.refresh_token, TokenTypeEnum.REFRESH);
            expect(tokenService.invalidateToken).not.toHaveBeenCalled();
        });
    });

    describe('phoneSignup', () => {
        it('should throw BadRequestException if user is blocked', async () => {
            const mockphoneSignupDto = new PhoneSignupDto();
            const mockUser = { status: UserStatus.BLOCKED } as User;
            (userService.findByContactNumber as jest.Mock).mockResolvedValue(mockUser);

            await expect(service.phoneSignup(mockphoneSignupDto, mockReq)).rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException if user with a valid status already exists', async () => {
            const phoneSignupDto = new PhoneSignupDto();
            (userService.findByContactNumber as jest.Mock).mockResolvedValue({
                ...mockUser,
                status: UserStatus.VERIFIED,
            });

            await expect(service.phoneSignup(phoneSignupDto, mockReq)).rejects.toThrow(ConflictException);
        });

        it('should handle unverified user and send OTP', async () => {
            const phoneSignupDto = new PhoneSignupDto();

            const mockUserWithStatus = { ...mockUser, status: UserStatus.UNVERIFIED };

            (userService.findByContactNumber as jest.Mock).mockResolvedValue(mockUserWithStatus);

            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue('mockOtp');

            await service.phoneSignup(phoneSignupDto, mockReq);

            expect(otpService.handleOtpGeneration).toHaveBeenCalledWith(
                mockUserWithStatus,
                mockUser.contact_number,
                VerificationType.SIGNUP,
                phoneSignupDto.country_code,
            );

            expect(deviceInformationService.create).toHaveBeenCalled();
        });

        it('should create a new user if no duplicate exists', async () => {
            const phoneSignupDto = new PhoneSignupDto();
            (userService.findByContactNumber as jest.Mock).mockResolvedValue(null);
            (roleService.findOneWhere as jest.Mock).mockResolvedValue(mockRole);
            (userService.create as jest.Mock).mockResolvedValue(mockUser);
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue('mockOtp');

            await service.phoneSignup(phoneSignupDto, mockReq);

            expect(roleService.findOneWhere).toHaveBeenCalledWith({ where: { role_name: 'user' } });
            expect(userService.create).toHaveBeenCalledWith({
                ...phoneSignupDto,
                role: mockRole,
                image: DefaultImage.user,
                base_url: process.env.AWS_ASSETS_PATH,
                internal_path: `${MediaFolder.default}/`,
                external_path: `${MediaFolder.default}/`,
            });
            expect(otpService.handleOtpGeneration).toHaveBeenCalled();
            expect(deviceInformationService.create).toHaveBeenCalled();
        });
    });

    describe('verifyPhoneSignupOtp', () => {
        const mockRequest = {
            headers: {
                'user-agent': 'test-agent',
            },
            ip: '127.0.0.1',
        };

        const mockPhoneVerifyDto = {
            country_code: '91',
            contact_number: '1234567890',
            otp: 123456,
        };

        const mockUser = {
            id: '1',
            contact_number: '1234567890',
            status: UserStatus.UNVERIFIED,
            role: { role_name: 'user' },
        };

        it('should throw UnauthorizedException if user is not found', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(service.verifyPhoneSignupOtp(mockPhoneVerifyDto, mockRequest)).rejects.toThrow(
                UnauthorizedException,
            );
            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { contact_number: mockPhoneVerifyDto.contact_number, status: UserStatus.UNVERIFIED },
                relations: ['role'],
            });
        });

        it('should throw BadRequestException if OTP is invalid', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(false);

            await expect(service.verifyPhoneSignupOtp(mockPhoneVerifyDto, mockRequest)).rejects.toThrow(
                BadRequestException,
            );
            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, mockPhoneVerifyDto.otp);
        });

        it('should generate tokens and return them if OTP is valid', async () => {
            const mockDeviceInfo = { id: 'device1' };
            const mockTokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                accessTokenExpiryTime: new Date(),
                refreshTokenExpiryTime: new Date(),
            };

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(true);
            (deviceInformationService.create as jest.Mock).mockResolvedValue(mockDeviceInfo);
            (tokenService.create as jest.Mock).mockResolvedValue(undefined); // Token creation mock
            (generateTokens as jest.Mock).mockReturnValue(mockTokens);

            const result = await service.verifyPhoneSignupOtp(mockPhoneVerifyDto, mockRequest);

            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, mockPhoneVerifyDto.otp);
            expect(deviceInformationService.create).toHaveBeenCalledWith(expect.any(Object));
            expect(tokenService.create).toHaveBeenCalledWith({
                entity: mockUser,
                access_token: mockTokens.accessToken,
                access_token_expiry: mockTokens.accessTokenExpiryTime,
                refresh_token_expiry: mockTokens.refreshTokenExpiryTime,
                refresh_token: mockTokens.refreshToken,
                type: TokenTypeEnum.ACCESS,
                device: mockDeviceInfo,
            });
            expect(result).toEqual({
                id: mockUser.id,
                contactNumber: mockUser.contact_number,
                access_token: mockTokens.accessToken,
                refresh_token: mockTokens.refreshToken,
            });
        });

        it('should update user status to VERIFIED after successful OTP validation', async () => {
            const mockTokens = {
                accessToken: 'mockAccessToken',
                refreshToken: 'mockRefreshToken',
                accessTokenExpiryTime: new Date(),
                refreshTokenExpiryTime: new Date(),
            };

            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(true);
            (generateTokens as jest.Mock).mockReturnValue(mockTokens);

            await service.verifyPhoneSignupOtp(mockPhoneVerifyDto, mockRequest);

            expect(userService.update).toHaveBeenCalledWith(mockUser.id, { status: UserStatus.VERIFIED });
        });
    });
    describe('phoneLogin', () => {
        const phoneLoginDto = new PhoneLoginDto();
        it('should handle verified user and generate OTP', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

            const mockOtp = '123456';
            (otpService.handleOtpGeneration as jest.Mock).mockResolvedValue(mockOtp);

            await service.phoneLogin(phoneLoginDto);

            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { contact_number: phoneLoginDto.contact_number, status: UserStatus.VERIFIED },
                relations: ['role'],
            });

            expect(otpService.handleOtpGeneration).toHaveBeenCalledWith(
                mockUser,
                mockUser.contact_number,
                VerificationType.LOGIN,
                phoneLoginDto.country_code,
            );

            // expect(otpService.sendOtpSms).toHaveBeenCalledWith(
            //     mockUser,
            //     phoneLoginDto.country_code,
            //     mockOtp
            // );
        });

        it('should throw UnauthorizedException if user does not exist', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(service.phoneLogin(phoneLoginDto)).rejects.toThrow(UnauthorizedException);

            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { contact_number: phoneLoginDto.contact_number, status: UserStatus.VERIFIED },
                relations: ['role'],
            });

            expect(otpService.handleOtpGeneration).not.toHaveBeenCalled();
        });
    });

    describe('verifyPhoneLoginOtp', () => {
        const phoneVerifyDto = new PhoneVerifyDto();
        it('should verify OTP, generate tokens, and return result for valid user', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);
            (otpService.validateOtp as jest.Mock).mockResolvedValue(true);
            (deviceInformationService.create as jest.Mock).mockResolvedValue({ id: 'mockDeviceId' });

            const result = await service.verifyPhoneLoginOtp(phoneVerifyDto, mockReq);

            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { contact_number: phoneVerifyDto.contact_number },
                relations: ['role'],
            });

            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, phoneVerifyDto.otp);

            expect(deviceInformationService.logoutAllDevice).toHaveBeenCalledWith(mockUser);
            expect(tokenService.create).toHaveBeenCalled();

            expect(result).toEqual({
                id: mockUser.id,
                contactNumber: mockUser.contact_number,
                access_token: mockTokens.accessToken,
                refresh_token: mockTokens.refreshToken,
            });
        });

        it('should throw UnauthorizedException if user does not exist', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(null);

            await expect(service.verifyPhoneLoginOtp(phoneVerifyDto, mockReq)).rejects.toThrow(UnauthorizedException);

            expect(userService.findOneWhere).toHaveBeenCalledWith({
                where: { contact_number: phoneVerifyDto.contact_number },
                relations: ['role'],
            });

            expect(otpService.validateOtp).not.toHaveBeenCalled();
            expect(deviceInformationService.logoutAllDevice).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if OTP is invalid', async () => {
            (userService.findOneWhere as jest.Mock).mockResolvedValue(mockUser);

            (otpService.validateOtp as jest.Mock).mockResolvedValue(false);

            await expect(service.verifyPhoneLoginOtp(phoneVerifyDto, mockReq)).rejects.toThrow(BadRequestException);

            expect(otpService.validateOtp).toHaveBeenCalledWith(mockUser, phoneVerifyDto.otp);

            expect(deviceInformationService.logoutAllDevice).not.toHaveBeenCalled();
            expect(tokenService.create).not.toHaveBeenCalled();
        });
    });
});
