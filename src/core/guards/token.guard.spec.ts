import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { TokenGuard } from './token.guard';
import { ConfigService } from '@nestjs/config';

describe('TokenGuard', () => {
    let guard: TokenGuard;
    let configService: ConfigService;
    let mockExecutionContext: ExecutionContext;

    const mockRequest = {
        headers: {},
    };

    const mockContext = {
        switchToHttp: jest.fn(() => ({
            getRequest: jest.fn(() => mockRequest),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenGuard,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('token1,token2'),
                    },
                },
            ],
        }).compile();

        guard = module.get<TokenGuard>(TokenGuard);
        configService = module.get<ConfigService>(ConfigService);
        mockExecutionContext = mockContext as unknown as ExecutionContext;
    });

    describe('canActivate', () => {
        it('should return true when token is valid', () => {
            mockRequest.headers['authorization'] = 'Bearer token1';
            const result = guard.canActivate(mockExecutionContext);
            expect(result).toBe(true);
        });

        it('should return false when token is missing', () => {
            mockRequest.headers['authorization'] = undefined;
            const result = guard.canActivate(mockExecutionContext);
            expect(result).toBe(false);
        });

        it('should return false when token is invalid', () => {
            mockRequest.headers['authorization'] = 'Bearer invalidToken';
            const result = guard.canActivate(mockExecutionContext);
            expect(result).toBe(false);
        });

        it('should throw an error if STATIC_TOKEN is not defined', () => {
            (configService.get as jest.Mock).mockReturnValue(null);
            expect(() => new TokenGuard(configService)).toThrow('Environment variable STATIC_TOKEN is not defined.');
        });

        it('should handle case where token is undefined in the request', () => {
            mockRequest.headers = {};
            const result = guard.canActivate(mockExecutionContext);
            expect(result).toBe(false);
        });
    });
});
