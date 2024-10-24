import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Response } from 'express';
import { AUTH_SUCCESS, SUCCESS } from '@shared/constants/messages';
import { HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { EmailUpdateProfileDto } from '../auth/dto/email.update.profile.dto';
import { EmailVerifyDto } from '../auth/dto/email.verify.dto';
import { UpdatePhoneDto } from '../auth/dto/update.phone.dto';

describe('UserController', () => {
    let controller: UserController;
    let userService: UserService;
    let mockResponse: Partial<Response>;

    const mockRequest = {
        headers: {
            'user-agent': 'test-agent',
        },
        ip: '127.0.0.1',
        user: { id: '1' },
        token: 'mockAccessToken',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                        verifyOtp: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('getUserProfile', () => {
        it('should return a User Profile successfully', async () => {
            const mockResult = new User();
            userService.getUserProfile = jest.fn().mockResolvedValue(mockResult);
            await controller.getUserProfile(mockRequest, mockResponse as Response);
            expect(userService.getUserProfile).toHaveBeenCalledWith(mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_FETCHED('Profile'),
                data: mockResult,
            });
        });
    });

    describe('updateUserProfile', () => {
        it('should update a profile successfully', async () => {
            const emailUpdateProfileDto = new EmailUpdateProfileDto();

            userService.updateUserProfile = jest.fn().mockResolvedValue(true);

            await controller.updateUserProfile(mockRequest, emailUpdateProfileDto, mockResponse as Response);

            expect(userService.updateUserProfile).toHaveBeenCalledWith(emailUpdateProfileDto, mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_UPDATED('Profile'),
            });
        });
    });
    describe('sendEmailChangeOtp', () => {
        it('should successfully send otp ', async () => {
            userService.sendEmailChangeOtp = jest.fn().mockResolvedValue(true);

            await controller.sendEmailChangeOtp(mockRequest, mockResponse as Response);

            expect(userService.sendEmailChangeOtp).toHaveBeenCalledWith(mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.OTP_SENT,
            });
        });
    });
    describe('verifyOtp', () => {
        it('should successfully verify otp ', async () => {
            const emailVerifyDto = new EmailVerifyDto();
            userService.verifyOtp = jest.fn().mockResolvedValue(true);

            await controller.verifyOtp(mockRequest, emailVerifyDto, mockResponse as Response);

            expect(userService.verifyOtp).toHaveBeenCalledWith(emailVerifyDto, mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.EMAIL_UPDATED,
            });
        });
    });

    describe('deleteUserAccount', () => {
        it('should successfully deleteUserAccount ', async () => {
            userService.deleteUserAccount = jest.fn().mockResolvedValue(true);

            await controller.deleteUserAccount(mockRequest, mockResponse as Response);

            expect(userService.deleteUserAccount).toHaveBeenCalledWith(mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: SUCCESS.RECORD_DELETED('Profile'),
            });
        });
    });
    describe('sendPhoneChangeOtp', () => {
        it('should successfully send otp for Phone Change ', async () => {
            userService.sendPhoneChangeOtp = jest.fn().mockResolvedValue(true);

            await controller.sendPhoneChangeOtp(mockRequest, mockResponse as Response);

            expect(userService.sendPhoneChangeOtp).toHaveBeenCalledWith(mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.OTP_SENT,
            });
        });
    });
    describe('updatePhoneNo', () => {
        it('should successfully update phone number ', async () => {
            const updatePhoneDto = new UpdatePhoneDto();
            userService.updatePhoneNo = jest.fn().mockResolvedValue(true);

            await controller.updatePhoneNo(updatePhoneDto, mockRequest, mockResponse as Response);

            expect(userService.updatePhoneNo).toHaveBeenCalledWith(updatePhoneDto, mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 1,
                message: AUTH_SUCCESS.PHONE_NO_UPDATED,
            });
        });
    });
});
