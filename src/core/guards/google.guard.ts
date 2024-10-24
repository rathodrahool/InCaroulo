import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedRequest } from '@shared/interfaces/interfaces';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
    private client: OAuth2Client;

    constructor(private configService: ConfigService) {
        this.client = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const idToken = this.extractTokenFromRequest(request);

        if (!idToken) {
            throw new UnauthorizedException('No Google OAuth token found');
        }

        const ticket = await this.client.verifyIdToken({
            idToken,
            audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new UnauthorizedException('Invalid Google token');
        }

        // Attach user data to request
        request.user = {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            sub: payload.sub,
        };

        return true;
    }

    private extractTokenFromRequest(request: AuthenticatedRequest): string | null {
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            return parts[1];
        }

        return null;
    }
}
