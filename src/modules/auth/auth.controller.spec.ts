// auth.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailSignupDto } from './dto/email.signup.dto';
import { Response } from 'express';
import { AUTH_SUCCESS, EMAIL } from '@shared/constants/messages';
import { EmailLoginDto } from './dto/email.login.dto';
import { EmailVerifyDto } from './dto/email.verify.dto';
import { EmailForgetPasswordDto } from './dto/email.forget.password.dto';
import { EmailUpdatePasswordDto } from './dto/email.update.password.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { SocialAuthDto } from './dto/social.auth.dto';
import { PhoneSignupDto } from './dto/phone.signup.dto';
import { PhoneVerifyDto } from './dto/phone.verify.dto';
import { PhoneLoginDto } from './dto/phone.login.dto';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;
    let mockResponse: Response;

    const mockReq = {
        headers: {
            deviceId: 'deviceId123',
            deviceType: 'web',
            deviceName: 'browser',
            appVersion: '1.0',
            timezone: 'UTC',
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        signUp: jest.fn(),
                        verifySignup: jest.fn(),
                        login: jest.fn(),
                        verifyLogin: jest.fn(),
                        forgotPassword: jest.fn(),
                        resetPassword: jest.fn(),
                        refreshToken: jest.fn(),
                        logout: jest.fn(),
                        socialAuthRedirect: jest.fn(),
                        phoneSignup: jest.fn(),
                        verifyPhoneSignupOtp: jest.fn(),
                        phoneLogin: jest.fn(),
                        verifyPhoneLoginOtp: jest.fn(),
                    },
                },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);

        // Mocking response object
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;
    });

    describe('signUp', () => {
        const emailSignupDto: EmailSignupDto = {
            email: 'test@example.com',
            password: 'testPassword',
            confirm_password: 'testPassword',
        };

        it('should call authService.signUp with headers and return success response', async () => {
            // Arrange
            (authService.signUp as jest.Mock).mockResolvedValue(undefined); // mock the service

            // Act
            await authController.signUp(mockReq, emailSignupDto, mockResponse);

            // Assert
            expect(authService.signUp).toHaveBeenCalledWith(emailSignupDto, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.VERIFICATION_LINK_SENT,
            });
        });

        it('should handle errors thrown by authService.signUp', async () => {
            // Arrange
            const error = new Error('Sign up failed');
            (authService.signUp as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.signUp(mockReq, emailSignupDto, mockResponse)).rejects.toThrow(
                'Sign up failed',
            );

            // Assert
            expect(authService.signUp).toHaveBeenCalledWith(emailSignupDto, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('verifySignup', () => {
        const mockUid = 'some-unique-id';
        const mockResult = { verified: true };

        it('should call authService.verifySignup with uid and req, and return success response', async () => {
            // Arrange
            (authService.verifySignup as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await authController.verifySignup(mockUid, mockResponse, mockReq);

            // Assert
            expect(authService.verifySignup).toHaveBeenCalledWith(mockUid, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.SIGN_UP,
                data: mockResult,
            });
        });

        it('should handle errors thrown by authService.verifySignup', async () => {
            // Arrange
            const error = new Error('Verification failed');
            (authService.verifySignup as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.verifySignup(mockUid, mockResponse, mockReq)).rejects.toThrow(
                'Verification failed',
            );

            // Assert
            expect(authService.verifySignup).toHaveBeenCalledWith(mockUid, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('login', () => {
        const emailLoginDto: EmailLoginDto = {
            email: 'test@example.com',
            password: 'testPassword',
        };

        it('should call authService.login with emailLoginDto and return success response', async () => {
            // Arrange
            (authService.login as jest.Mock).mockResolvedValue(undefined); // mock the service

            // Act
            await authController.login(emailLoginDto, mockResponse);

            // Assert
            expect(authService.login).toHaveBeenCalledWith(emailLoginDto);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.OTP_SENT,
            });
        });

        it('should handle errors thrown by authService.login', async () => {
            // Arrange
            const error = new Error('Login failed');
            (authService.login as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.login(emailLoginDto, mockResponse)).rejects.toThrow('Login failed');

            // Assert
            expect(authService.login).toHaveBeenCalledWith(emailLoginDto);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('verify', () => {
        const emailVerifyDto: EmailVerifyDto = {
            email: 'test@example.com',
            otp: 123456,
        };

        const mockResult = { verified: true };

        it('should call authService.verifyLogin with emailVerifyDto and req, and return success response', async () => {
            // Arrange
            (authService.verifyLogin as jest.Mock).mockResolvedValue(mockResult); // mock the service

            // Act
            await authController.verify(emailVerifyDto, mockReq, mockResponse);

            // Assert
            expect(authService.verifyLogin).toHaveBeenCalledWith(emailVerifyDto, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.LOGIN,
                data: mockResult,
            });
        });

        it('should handle errors thrown by authService.verifyLogin', async () => {
            // Arrange
            const error = new Error('Verification failed');
            (authService.verifyLogin as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.verify(emailVerifyDto, mockReq, mockResponse)).rejects.toThrow(
                'Verification failed',
            );

            // Assert
            expect(authService.verifyLogin).toHaveBeenCalledWith(emailVerifyDto, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('forgotPassword', () => {
        const emailForgetPasswordDto: EmailForgetPasswordDto = {
            email: 'test@example.com',
        };

        it('should call authService.forgotPassword with emailForgetPasswordDto and req, and return success response', async () => {
            // Arrange
            (authService.forgotPassword as jest.Mock).mockResolvedValue(undefined); // mock the service

            // Act
            await authController.forgotPassword(emailForgetPasswordDto, mockReq, mockResponse);

            // Assert
            expect(authService.forgotPassword).toHaveBeenCalledWith(emailForgetPasswordDto, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: EMAIL.SENT,
            });
        });

        it('should handle errors thrown by authService.forgotPassword', async () => {
            // Arrange
            const error = new Error('Forgot password failed');
            (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.forgotPassword(emailForgetPasswordDto, mockReq, mockResponse)).rejects.toThrow(
                'Forgot password failed',
            );

            // Assert
            expect(authService.forgotPassword).toHaveBeenCalledWith(emailForgetPasswordDto, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('resetPassword', () => {
        const uid = 'some-unique-id';
        const emailUpdatePasswordDto: EmailUpdatePasswordDto = {
            email: 'test@example.com',
            new_password: 'newPassword',
            confirm_password: 'newPassword',
        };

        it('should call authService.resetPassword with emailUpdatePasswordDto, uid, and req, and return success response', async () => {
            // Arrange
            (authService.resetPassword as jest.Mock).mockResolvedValue(undefined); // mock the service

            // Act
            await authController.resetPassword(uid, emailUpdatePasswordDto, mockReq, mockResponse);

            // Assert
            expect(authService.resetPassword).toHaveBeenCalledWith(emailUpdatePasswordDto, uid, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.PASSWORD_RESET,
            });
        });

        it('should handle errors thrown by authService.resetPassword', async () => {
            // Arrange
            const error = new Error('Password reset failed');
            (authService.resetPassword as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(
                authController.resetPassword(uid, emailUpdatePasswordDto, mockReq, mockResponse),
            ).rejects.toThrow('Password reset failed');

            // Assert
            expect(authService.resetPassword).toHaveBeenCalledWith(emailUpdatePasswordDto, uid, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('refreshToken', () => {
        const refreshTokenDto: RefreshTokenDto = {
            refresh_token: 'some-refresh-token',
        };
        const mockResult = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

        it('should call authService.refreshToken with refreshTokenDto and return success response', async () => {
            // Arrange
            (authService.refreshToken as jest.Mock).mockResolvedValue(mockResult); // mock the service

            // Act
            await authController.refreshToken(refreshTokenDto, mockResponse);

            // Assert
            expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.TOKEN_REFRESHED,
                data: mockResult,
            });
        });

        it('should handle errors thrown by authService.refreshToken', async () => {
            // Arrange
            const error = new Error('Token refresh failed');
            (authService.refreshToken as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.refreshToken(refreshTokenDto, mockResponse)).rejects.toThrow(
                'Token refresh failed',
            );

            // Assert
            expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('logout', () => {
        it('should call authService.logout with req and return success response', async () => {
            // Arrange
            (authService.logout as jest.Mock).mockResolvedValue(undefined); // mock the service

            // Act
            await authController.logout(mockReq, mockResponse);

            // Assert
            expect(authService.logout).toHaveBeenCalledWith(mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.LOGOUT,
            });
        });

        it('should handle errors thrown by authService.logout', async () => {
            // Arrange
            const error = new Error('Logout failed');
            (authService.logout as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.logout(mockReq, mockResponse)).rejects.toThrow('Logout failed');

            // Assert
            expect(authService.logout).toHaveBeenCalledWith(mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('socialAuthRedirect', () => {
        const socialAuthDto: SocialAuthDto = {
            email: 'mailto:social@example.com',
            google_id: 'google',
        };
        const mockResult = { success: true };

        it('should call authService.socialAuthRedirect with socialAuthDto and req, and return success response', async () => {
            // Arrange
            (authService.socialAuthRedirect as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await authController.socialAuthRedirect(socialAuthDto, mockReq, mockResponse);

            // Assert
            expect(authService.socialAuthRedirect).toHaveBeenCalledWith(socialAuthDto, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.LOGIN,
                data: mockResult,
            });
        });

        it('should handle errors thrown by authService.socialAuthRedirect', async () => {
            // Arrange
            const error = new Error('Social auth failed');
            (authService.socialAuthRedirect as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.socialAuthRedirect(socialAuthDto, mockReq, mockResponse)).rejects.toThrow(
                'Social auth failed',
            );

            // Assert
            expect(authService.socialAuthRedirect).toHaveBeenCalledWith(socialAuthDto, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('phoneSignup', () => {
        const phoneSignupDto: PhoneSignupDto = {
            country_code: '+91',
            contact_number: '1234567890',
        };

        it('should call authService.phoneSignup with phoneSignupDto and req, and return success create response', async () => {
            // Arrange
            (authService.phoneSignup as jest.Mock).mockResolvedValue(undefined);

            // Act
            await authController.phoneSignup(phoneSignupDto, mockReq, mockResponse);

            // Assert
            expect(authService.phoneSignup).toHaveBeenCalledWith(phoneSignupDto, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.OTP_SENT,
            });
        });

        it('should handle errors thrown by authService.phoneSignup', async () => {
            // Arrange
            const error = new Error('Phone signup failed');
            (authService.phoneSignup as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.phoneSignup(phoneSignupDto, mockReq, mockResponse)).rejects.toThrow(
                'Phone signup failed',
            );

            // Assert
            expect(authService.phoneSignup).toHaveBeenCalledWith(phoneSignupDto, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('verifyPhoneSignupOtp', () => {
        const phoneVerifyDto: PhoneVerifyDto = {
            country_code: '+91',
            contact_number: '1234567890',
            otp: 123456,
        };

        const mockResult = { verified: true };

        it('should call authService.verifyPhoneSignupOtp with phoneVerifyDto and req, and return success response', async () => {
            // Arrange
            (authService.verifyPhoneSignupOtp as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await authController.verifyPhoneSignupOtp(phoneVerifyDto, mockReq, mockResponse);

            // Assert
            expect(authService.verifyPhoneSignupOtp).toHaveBeenCalledWith(phoneVerifyDto, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.SIGN_UP,
                data: mockResult,
            });
        });

        it('should handle errors thrown by authService.verifyPhoneSignupOtp', async () => {
            // Arrange
            const error = new Error('OTP verification failed');
            (authService.verifyPhoneSignupOtp as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.verifyPhoneSignupOtp(phoneVerifyDto, mockReq, mockResponse)).rejects.toThrow(
                'OTP verification failed',
            );

            // Assert
            expect(authService.verifyPhoneSignupOtp).toHaveBeenCalledWith(phoneVerifyDto, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('phoneLogin', () => {
        const phoneLoginDto: PhoneLoginDto = {
            country_code: '+91',
            contact_number: '+1234567890',
        };

        it('should call authService.phoneLogin with phoneLoginDto and return success response', async () => {
            // Arrange
            (authService.phoneLogin as jest.Mock).mockResolvedValue(undefined); // Mock the service

            // Act
            await authController.phoneLogin(phoneLoginDto, mockReq, mockResponse);

            // Assert
            expect(authService.phoneLogin).toHaveBeenCalledWith(phoneLoginDto);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.OTP_SENT,
            });
        });

        it('should handle errors thrown by authService.phoneLogin', async () => {
            // Arrange
            const error = new Error('Phone login failed');
            (authService.phoneLogin as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.phoneLogin(phoneLoginDto, mockReq, mockResponse)).rejects.toThrow(
                'Phone login failed',
            );

            // Assert
            expect(authService.phoneLogin).toHaveBeenCalledWith(phoneLoginDto);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });

    describe('verifyPhoneLoginOtp', () => {
        const phoneVerifyDto: PhoneVerifyDto = {
            country_code: '+91',
            contact_number: '+1234567890',
            otp: 123456,
        };

        const mockResult = { token: 'some-token' };

        it('should call authService.verifyPhoneLoginOtp with phoneVerifyDto and req, and return success response', async () => {
            // Arrange
            (authService.verifyPhoneLoginOtp as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await authController.verifyPhoneLoginOtp(phoneVerifyDto, mockReq, mockResponse);

            // Assert
            expect(authService.verifyPhoneLoginOtp).toHaveBeenCalledWith(phoneVerifyDto, mockReq);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.LOGIN,
                data: mockResult,
            });
        });

        it('should handle errors thrown by authService.verifyPhoneLoginOtp', async () => {
            // Arrange
            const error = new Error('Phone login OTP verification failed');
            (authService.verifyPhoneLoginOtp as jest.Mock).mockRejectedValue(error);

            // Act
            await expect(authController.verifyPhoneLoginOtp(phoneVerifyDto, mockReq, mockResponse)).rejects.toThrow(
                'Phone login OTP verification failed',
            );

            // Assert
            expect(authService.verifyPhoneLoginOtp).toHaveBeenCalledWith(phoneVerifyDto, mockReq);
            expect(mockResponse.status).not.toHaveBeenCalled(); // No response should be sent when an error is thrown
        });
    });
});
