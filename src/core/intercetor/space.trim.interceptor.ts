import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class GlobalTrimInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        if (request.body) {
            this.trimStringFields(request.body);
        }

        return next.handle().pipe(
            map((data) => {
                return data;
            }),
        );
    }

    private trimStringFields(obj: any) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
                obj[key] = obj[key].replace(/\s+/g, ' ');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.trimStringFields(obj[key]);
            }
        }
    }
}
