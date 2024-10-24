import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenTypeEnum } from '@shared/constants/enum';
import { AUTH_ERROR } from '@shared/constants/messages';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { TokenService } from '@modules/token/token.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private tokenService: TokenService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException(AUTH_ERROR.TOKEN_NOT_FOUND);
        }
        try {
            const payload: any = jwt.verify(token, process.env.JWT_SECRET);
            const matchedToken = await this.tokenService.findOneWhere({
                where: { access_token: token },
            });
            const isValid = await this.tokenService.validateToken(matchedToken.access_token, TokenTypeEnum.ACCESS);
            if (!isValid) {
                throw new UnauthorizedException(AUTH_ERROR.TOKEN_EXPIRED);
            }
            request.token = matchedToken.access_token;
            request.user = payload;
        } catch (error) {
            this.handleJwtError(error);
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return null;
        }
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            return null;
        }
        return token;
    }

    private handleJwtError(error: Error): void {
        if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedException(AUTH_ERROR.INVALID_TOKEN);
        }
        throw new UnauthorizedException(AUTH_ERROR.UNAUTHORIZED);
    }
}
