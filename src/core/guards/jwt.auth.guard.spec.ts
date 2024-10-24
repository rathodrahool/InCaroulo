import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { TokenService } from '@modules/token/token.service';
import * as jwt from 'jsonwebtoken';
import { AUTH_ERROR } from '@shared/constants/messages';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt.auth.guard';

jest.mock('jsonwebtoken');

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let tokenService: TokenService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtAuthGuard,
                {
                    provide: TokenService,
                    useValue: {
                        findOneWhere: jest.fn(),
                        validateToken: jest.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<JwtAuthGuard>(JwtAuthGuard);
        tokenService = module.get<TokenService>(TokenService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw UnauthorizedException if token is missing', async () => {
        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: {},
                }),
            }),
        } as any;

        await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException(AUTH_ERROR.TOKEN_NOT_FOUND));
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
        const invalidToken = 'invalid_token';
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new jwt.JsonWebTokenError('invalid token');
        });

        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: { authorization: `Bearer ${invalidToken}` },
                }),
            }),
        } as any;

        await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException(AUTH_ERROR.UNAUTHORIZED));
    });
    it('should throw UnauthorizedException if token is expired', async () => {
        const token = 'valid_token';
        const payload = { userId: 1 };
        (jwt.verify as jest.Mock).mockReturnValue(payload);
        (tokenService.findOneWhere as jest.Mock).mockResolvedValue({ access_token: token });
        (tokenService.validateToken as jest.Mock).mockResolvedValue(false); // Expired token

        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: { authorization: `Bearer ${token}` },
                }),
            }),
        } as any;

        await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException(AUTH_ERROR.UNAUTHORIZED));
    });
    it('should pass if token is valid', async () => {
        const token = 'valid_token';
        const payload = { userId: '1' };
        (jwt.verify as jest.Mock).mockReturnValue(payload);
        (tokenService.findOneWhere as jest.Mock).mockResolvedValue({ access_token: token });
        (tokenService.validateToken as jest.Mock).mockResolvedValue(true); // Valid token

        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: { authorization: `Bearer ${token}` },
                }),
            }),
        } as any;

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
    });
    it('should throw UnauthorizedException if authorization header does not start with Bearer', async () => {
        const token = 'valid_token';

        const context: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: { authorization: `Token ${token}` }, // Incorrect format
                }),
            }),
        } as any;

        await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException(AUTH_ERROR.TOKEN_NOT_FOUND));
    });
});
