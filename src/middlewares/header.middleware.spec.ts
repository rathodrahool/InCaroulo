import { BadRequestException } from '@nestjs/common';
import { VALIDATION } from '@shared/constants/messages';
import { DeviceType } from '@shared/constants/enum';
import { Request, Response, NextFunction } from 'express';
import { DeviceInformationMiddleware } from './header.middleware';

describe('DeviceInformationMiddleware', () => {
    let middleware: DeviceInformationMiddleware;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        middleware = new DeviceInformationMiddleware();
        mockRequest = {
            headers: {},
        };
        mockResponse = {};
        mockNext = jest.fn();
    });

    describe('use', () => {
        it('should call next() when validation passes for iOS device type', () => {
            mockRequest.headers = {
                'device-type': DeviceType.IOS,
                'device-id': 'some-device-id',
                'device-name': 'iPhone',
                'app-version': '1.0.0',
            };

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should call next() when validation passes for WEB device type (no device-id, device-name, app-version)', () => {
            mockRequest.headers = {
                'device-type': DeviceType.WEB,
                timezone: 'UTC',
            };

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should throw BadRequestException if device-type is missing', () => {
            mockRequest.headers = {
                'device-id': 'some-device-id',
                'device-name': 'iPhone',
                'app-version': '1.0.0',
            };

            try {
                middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe(VALIDATION.REQUIRED('Device Type'));
            }

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if device-id is missing for non-WEB device-type', () => {
            mockRequest.headers = {
                'device-type': DeviceType.IOS,
                'device-name': 'iPhone',
                'app-version': '1.0.0',
            };

            try {
                middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe(VALIDATION.REQUIRED('Device Id'));
            }

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if device-name is missing for non-WEB device-type', () => {
            mockRequest.headers = {
                'device-type': DeviceType.ANDROID,
                'device-id': 'some-device-id',
                'app-version': '1.0.0',
            };

            try {
                middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe(VALIDATION.REQUIRED('Device Name'));
            }

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if app-version is missing for non-WEB device-type', () => {
            mockRequest.headers = {
                'device-type': DeviceType.ANDROID,
                'device-id': 'some-device-id',
                'device-name': 'Android Phone',
            };

            try {
                middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe(VALIDATION.REQUIRED('App Version'));
            }

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should allow optional timezone field in headers', () => {
            mockRequest.headers = {
                'device-type': DeviceType.IOS,
                'device-id': 'some-device-id',
                'device-name': 'iPhone',
                'app-version': '1.0.0',
                timezone: 'UTC',
            };

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
