import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DefaultEntity } from '@shared/entities/default.entity';

@Injectable()
export class SetIpMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        DefaultEntity.requestContext.ip = req.ip;
        next();
    }
}
