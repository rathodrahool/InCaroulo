// NestJS common decorators and utilities
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// DTO (Data Transfer Objects)
import { EmailSignupDto } from './dto/email.signup.dto';
import { EmailVerifyDto } from './dto/email.verify.dto';
import { EmailLoginDto } from './dto/email.login.dto';
import { EmailForgetPasswordDto } from './dto/email.forget.password.dto';
import { EmailUpdatePasswordDto } from './dto/email.update.password.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';

// Services and Utilities
import { UserService } from '@modules/user/user.service';
import { EmailService } from '@shared/services/mail/mail.service';
import { OtpService } from './otp/otp.service';
import { RoleService } from '@modules/role/role.service';
import { TokenService } from '@modules/token/token.service';

// Configuration and Helpers
import { extractDeviceInfo, generateTokens } from '@shared/helpers/common.functions';
import { v4 as uuidv4 } from 'uuid';

// Constants and Interfaces
import { AUTH_ERROR, ERROR } from '@shared/constants/messages';
import { DecodedUser, JwtPayload } from '@shared/interfaces/interfaces';
import {
    DefaultImage,
    ActivityType,
    expiryTimeEnum,
    MediaFolder,
    TokenTypeEnum,
    UserStatus,
    VerificationType,
} from '@shared/constants/enum';

// entity
import { User } from '@modules/user/entities/user.entity';
import { DeviceInformationService } from './device-information/device.information.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly otpService: OtpService,
        private readonly emailService: EmailService,
        private readonly tokenService: TokenService,
        private readonly jwtService: JwtService,
        private readonly deviceInformationService: DeviceInformationService,
        private readonly configService: ConfigService,
    ) {}

    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(password, salt);
    }

    async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
        const result = await bcrypt.compare(password, hashedPassword);
        return result;
    }

    async signUp(emailSignupDto: EmailSignupDto, request): Promise<void> {
        const existingUser: User = await this.userService.findByEmail(emailSignupDto.email, true);
        const linkId = uuidv4();
        if (existingUser) {
            switch (existingUser.status) {
                case UserStatus.BLOCKED:
                    throw new BadRequestException(AUTH_ERROR.ACCOUNT_BLOCKED_MESSAGE);
                case UserStatus.UNVERIFIED:
                    const otp = await this.otpService.handleOtpGeneration(
                        existingUser,
                        existingUser.email,
                        VerificationType.SIGNUP,
                    );
                    const { accessToken, accessTokenExpiryTime } = generateTokens({
                        id: existingUser.id,
                        email: existingUser.email,
                        otp,
                    });
                    const deviceInfo = extractDeviceInfo({
                        request: request,
                        activity_type: ActivityType.SIGNUP,
                        user: existingUser,
                        registered_at: new Date(),
                        link_id: linkId,
                    });

                    emailSignupDto.password = await this.hashPassword(emailSignupDto.password);
                    await this.userService.update(existingUser.id, { password: emailSignupDto.password });
                    const isExistDevice = await this.deviceInformationService.findOneWhere({
                        where: { user: existingUser, device_type: deviceInfo.device_type },
                    });

                    if (isExistDevice) {
                        await this.deviceInformationService.update(isExistDevice.id, {
                            link_id: linkId,
                        });
                        const token = await this.tokenService.findOneWhere({
                            where: { user: { id: existingUser.id }, device: { device_type: deviceInfo.device_type } },
                        });
                        await this.tokenService.update(token.id, {
                            access_token: accessToken,
                            access_token_expiry: accessTokenExpiryTime,
                        });
                        return await this.emailService.sendAccountVerificationLink(
                            existingUser,
                            linkId,
                            expiryTimeEnum.FIVE_MIN,
                        );
                    }
                    const deviceData = await this.deviceInformationService.create(deviceInfo);

                    await this.tokenService.create({
                        entity: existingUser,
                        access_token: accessToken,
                        access_token_expiry: accessTokenExpiryTime,
                        type: TokenTypeEnum.VERIFY,
                        device: deviceData,
                    });
                    return await this.emailService.sendAccountVerificationLink(
                        existingUser,
                        linkId,
                        expiryTimeEnum.FIVE_MIN,
                    );
                default:
                    throw new ConflictException(ERROR.ALREADY_EXISTS('Email'));
            }
        }
        emailSignupDto.password = await this.hashPassword(emailSignupDto.password);
        const createObj = Object.assign({}, emailSignupDto, {
            role: await this.roleService.findOneWhere({ where: { role_name: 'user' } }),
            image: DefaultImage.user,
            base_url: process.env.AWS_ASSETS_PATH,
            internal_path: `${MediaFolder.default}/`,
            external_path: `${MediaFolder.default}/`,
        });
        const result = await this.userService.create(createObj);
        const otp = await this.otpService.handleOtpGeneration(result, result.email, VerificationType.SIGNUP);
        const { accessToken, accessTokenExpiryTime } = generateTokens({
            id: result.id,
            email: result.email,
            otp,
        });
        const deviceInfo = extractDeviceInfo({
            request: request,
            activity_type: ActivityType.SIGNUP,
            user: result,
            registered_at: new Date(),
            link_id: linkId,
        });
        const deviceData = await this.deviceInformationService.create(deviceInfo);
        await this.tokenService.create({
            entity: result,
            access_token: accessToken,
            access_token_expiry: accessTokenExpiryTime,
            type: TokenTypeEnum.VERIFY,
            device: deviceData,
        });
        await this.emailService.sendAccountVerificationLink(result, linkId, expiryTimeEnum.FIVE_MIN);
    }

    async verifySignup(linkId: string, req): Promise<object> {
        const tokenRecord = await this.tokenService.findTokenRecord(linkId, ActivityType.SIGNUP);
        if (!tokenRecord) {
            throw new UnauthorizedException(AUTH_ERROR.INVALID_LINK);
        }
        const { user } = tokenRecord.device;

        if (user.status === UserStatus.VERIFIED) {
            throw new BadRequestException(AUTH_ERROR.ALREADY_VERIFIED);
        }
        const token = tokenRecord.access_token;
        const isValid = await this.tokenService.validateToken(token, TokenTypeEnum.ACCESS);
        if (!isValid) {
            throw new UnauthorizedException(AUTH_ERROR.TOKEN_EXPIRED);
        }
        const decodedUser: DecodedUser = (await this.jwtService.verify(token, {
            secret: this.configService.get<string>('jwt.secret'),
        })) as DecodedUser;
        const isExists: User = await this.userService.findOneWhere({
            where: { email: decodedUser.email },
            relations: ['role'],
        });
        if (!isExists) {
            throw new UnauthorizedException(AUTH_ERROR.WRONG_CREDENTIALS);
        }
        const isVerified = await this.otpService.validateOtp(isExists, decodedUser.otp);
        if (!isVerified) {
            throw new UnauthorizedException(AUTH_ERROR.INVALID_LINK);
        }
        const payload: JwtPayload = {
            email: isExists.email,
            id: isExists.id,
            roleName: isExists.role.role_name,
        };
        const {
            accessToken: access_token,
            refreshToken: refresh_token,
            accessTokenExpiryTime,
            refreshTokenExpiryTime,
        } = generateTokens(payload);
        await this.userService.update(isExists.id, { status: UserStatus.VERIFIED });
        await this.deviceInformationService.logoutAllDevice(isExists);
        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.SIGNUP_VERIFICATION,
            user: isExists,
            is_active: true,
        });
        const deviceData = await this.deviceInformationService.create(deviceInfo);
        await this.tokenService.create({
            entity: isExists,
            access_token: access_token,
            access_token_expiry: accessTokenExpiryTime,
            refresh_token_expiry: refreshTokenExpiryTime,
            refresh_token: refresh_token,
            type: TokenTypeEnum.ACCESS,
            device: deviceData,
        });

        const result = {
            id: payload.id,
            email: payload.email,
            access_token,
            refresh_token,
        };
        return result;
    }

    async login(emailLoginDto: EmailLoginDto): Promise<void> {
        const isExists: User = await this.userService.findOneWhere({
            where: { email: emailLoginDto.email },
        });
        if (!isExists) {
            throw new UnauthorizedException(AUTH_ERROR.WRONG_CREDENTIALS);
        }
        if (isExists.status === UserStatus.UNVERIFIED) {
            throw new BadRequestException(AUTH_ERROR.ACCOUNT_NOT_VERIFIED);
        }
        const isValid = await this.validatePassword(emailLoginDto.password, isExists.password);
        if (!isValid) {
            throw new UnauthorizedException(AUTH_ERROR.WRONG_CREDENTIALS);
        }
        const otp = await this.otpService.handleOtpGeneration(isExists, isExists.email, VerificationType.LOGIN);
        await this.emailService.sendOtpEmail(isExists, otp, expiryTimeEnum.FIVE_MIN);
    }

    async verifyLogin(emailVerifyDto: EmailVerifyDto, req): Promise<object> {
        const isExists: User = await this.userService.findOneWhere({
            where: { email: emailVerifyDto.email },
            relations: ['role'],
        });
        if (!isExists) {
            throw new UnauthorizedException(AUTH_ERROR.WRONG_CREDENTIALS);
        }
        const isVerified = await this.otpService.validateOtp(isExists, emailVerifyDto.otp);
        if (!isVerified) {
            throw new BadRequestException(AUTH_ERROR.INVALID_OTP);
        }
        const payload: JwtPayload = {
            email: isExists.email,
            id: isExists.id,
            roleName: isExists.role.role_name,
        };
        const {
            accessToken: access_token,
            refreshToken: refresh_token,
            accessTokenExpiryTime,
            refreshTokenExpiryTime,
        } = generateTokens(payload);
        await this.deviceInformationService.logoutAllDevice(isExists);
        const extractedDeviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.LOGIN,
            user: isExists,
            is_active: true,
        });
        const DeviceInformation = await this.deviceInformationService.create(extractedDeviceInfo);
        await this.tokenService.create({
            entity: isExists,
            access_token: access_token,
            access_token_expiry: accessTokenExpiryTime,
            refresh_token_expiry: refreshTokenExpiryTime,
            refresh_token: refresh_token,
            type: TokenTypeEnum.ACCESS,
            device: DeviceInformation,
        });
        const result = {
            id: payload.id,
            email: payload.email,
            access_token,
            refresh_token,
        };
        return result;
    }

    async forgotPassword(emailForgetPasswordDto: EmailForgetPasswordDto, req): Promise<void> {
        const linkId = uuidv4();
        const isExists: User = await this.userService.findOneWhere({
            where: { email: emailForgetPasswordDto.email },
        });
        if (!isExists) {
            throw new BadRequestException(ERROR.RECORD_NOT_FOUND('User'));
        }
        const otp = await this.otpService.handleOtpGeneration(
            isExists,
            isExists.email,
            VerificationType.FORGOT_PASSWORD,
        );
        // token store
        const { accessToken, accessTokenExpiryTime } = generateTokens({
            id: isExists.id,
            email: isExists.email,
            otp,
        });
        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.FORGOT_PASSWORD,
            user: isExists,
            link_id: linkId,
        });

        const isExistDevice = await this.deviceInformationService.findOneWhere({
            where: {
                user: { id: isExists.id },
                activity_type: deviceInfo.activity_type,
                device_type: deviceInfo.device_type,
            },
        });

        if (isExistDevice) {
            await this.deviceInformationService.update(isExistDevice.id, {
                link_id: linkId,
            });
            const token = await this.tokenService.findOneWhere({
                where: { user: { id: isExists.id }, device: { device_type: deviceInfo.device_type } },
            });
            await this.tokenService.update(token.id, {
                access_token: accessToken,
                access_token_expiry: accessTokenExpiryTime,
            });
            return;
        }

        const deviceData = await this.deviceInformationService.create(deviceInfo);
        await this.tokenService.create({
            entity: isExists,
            access_token: accessToken,
            access_token_expiry: accessTokenExpiryTime,
            type: TokenTypeEnum.RESET,
            device: deviceData,
        });

        await this.emailService.sendPasswordResetLink(isExists, linkId, expiryTimeEnum.FIVE_MIN);
    }

    async resetPassword(emailUpdatePasswordDto: EmailUpdatePasswordDto, linkId: string, req): Promise<void> {
        const tokenRecord = await this.tokenService.findTokenRecord(linkId, ActivityType.FORGOT_PASSWORD);
        if (!tokenRecord) {
            throw new UnauthorizedException(AUTH_ERROR.INVALID_LINK);
        }
        const token = tokenRecord.access_token;
        const isValid = await this.tokenService.validateToken(token, TokenTypeEnum.ACCESS);
        if (!isValid) {
            throw new UnauthorizedException(AUTH_ERROR.TOKEN_EXPIRED);
        }
        const decodedUser: DecodedUser = (await this.jwtService.verify(token, {
            secret: this.configService.get<string>('jwt.secret'),
        })) as DecodedUser;
        const otpRecord = await this.otpService.findOneWhere({
            where: {
                email: decodedUser.email,
                otp: decodedUser.otp,
                type: VerificationType.FORGOT_PASSWORD,
            },
            relations: ['user'],
        });
        if (!otpRecord) {
            throw new UnauthorizedException(AUTH_ERROR.INVALID_LINK);
        }
        if (otpRecord && !otpRecord.is_verified) {
            if (otpRecord.expire_at < new Date()) {
                throw new UnauthorizedException(AUTH_ERROR.LINK_EXPIRED);
            }
        }
        const isVerified = await this.otpService.validateOtp(otpRecord.user, otpRecord.otp);
        if (!isVerified) {
            throw new UnauthorizedException(AUTH_ERROR.INVALID_LINK);
        }
        const hashedPassword = await this.hashPassword(emailUpdatePasswordDto.new_password);
        await this.userService.update(otpRecord.user.id, {
            password: hashedPassword,
        });
        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.RESET_PASSWORD,
            user: otpRecord.user,
        });
        await this.deviceInformationService.create(deviceInfo);
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<object> {
        const { refresh_token } = refreshTokenDto;
        const decodedToken = this.jwtService.verify(refresh_token, {
            secret: this.configService.get<string>('jwt.secret'),
        });
        const user = await this.userService.findOneWhere({
            where: { id: decodedToken.id },
            relations: ['role'],
        });
        if (!user) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('User'));
        }
        const token = await this.tokenService.findOneWhere({
            where: { user: { id: user.id }, refresh_token: refresh_token },
        });
        if (!token) {
            throw new BadRequestException(AUTH_ERROR.INVALID_TOKEN);
        }
        const isValid = await this.tokenService.validateToken(token.refresh_token, TokenTypeEnum.REFRESH);
        if (!isValid) {
            throw new BadRequestException(AUTH_ERROR.INVALID_REFRESH_TOKEN);
        }
        await this.tokenService.invalidateToken(token, TokenTypeEnum.REFRESH);
        const payload: JwtPayload = {
            email: user.email,
            id: user.id,
            roleName: user.role.role_name,
        };
        const {
            accessToken: access_token,
            refreshToken: new_refresh_token,
            accessTokenExpiryTime,
            refreshTokenExpiryTime,
        } = generateTokens(payload);
        await this.tokenService.create({
            entity: user,
            access_token: access_token,
            refresh_token: new_refresh_token,
            access_token_expiry: accessTokenExpiryTime,
            refresh_token_expiry: refreshTokenExpiryTime,
        });
        const data = {
            access_token,
            refresh_token: new_refresh_token,
        };
        return data;
    }

    async logout(req): Promise<void> {
        const lastActive = new Date();
        const user = await this.userService.findOneWhere({
            where: { id: req.user.id },
            relations: ['role'],
        });
        if (!user) {
            throw new NotFoundException(ERROR.RECORD_NOT_FOUND('User'));
        }
        const accessToken = await this.tokenService.findOneWhere({
            where: { user: { id: user.id }, access_token: req.token },
        });
        if (accessToken) {
            await this.tokenService.invalidateToken(accessToken, TokenTypeEnum.ACCESS);
        }
        const refreshToken = await this.tokenService.findOneWhere({
            where: { user: { id: user.id }, refresh_token: req.token },
        });
        if (refreshToken) {
            await this.tokenService.invalidateToken(refreshToken, TokenTypeEnum.REFRESH);
        }
        const deviceInfo = extractDeviceInfo({
            request: req,
            activity_type: ActivityType.LOGOUT,
            user: user,
            is_active: false,
            last_active_at: lastActive,
        });
        await this.deviceInformationService.create(deviceInfo);
    }
}
