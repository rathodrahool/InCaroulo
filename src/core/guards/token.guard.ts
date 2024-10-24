import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class TokenGuard implements CanActivate {
    private readonly validTokens: string[];

    constructor(private configService: ConfigService) {
        const tokens = this.configService.get<string>('STATIC_TOKEN');
        if (!tokens) {
            throw new Error('Environment variable STATIC_TOKEN is not defined.');
        }
        this.validTokens = tokens.split(',');
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['authorization'];

        if (!token) {
            return false;
        }

        const tokenValue = token.replace('Bearer ', '');
        return this.validTokens.includes(tokenValue);
    }
}
