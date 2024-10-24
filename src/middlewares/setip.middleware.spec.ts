import { DefaultEntity } from '@shared/entities/default.entity';
import { Request, Response, NextFunction } from 'express';
import { SetIpMiddleware } from './setip.middlewere';

describe('SetIpMiddleware', () => {
    let middleware: SetIpMiddleware;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        middleware = new SetIpMiddleware();
        mockRequest = {
            ip: '127.0.0.1',
        };
        mockResponse = {};
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('use', () => {
        it('should set the ip in DefaultEntity and call next()', () => {
            // Ensure the initial state of DefaultEntity.requestContext.ip is not set
            DefaultEntity.requestContext = { ip: undefined };

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(DefaultEntity.requestContext.ip).toBe('127.0.0.1');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should call next() even if DefaultEntity.requestContext is already set', () => {
            // Set ip in DefaultEntity.requestContext to simulate existing value
            DefaultEntity.requestContext = { ip: '192.168.1.1' };

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

            expect(DefaultEntity.requestContext.ip).toBe('127.0.0.1');
            expect(mockNext).toHaveBeenCalled();
        });
    });
});
