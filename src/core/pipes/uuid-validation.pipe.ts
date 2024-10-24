import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class UUIDValidationPipe implements PipeTransform<string> {
    private readonly schema: Joi.StringSchema;

    constructor() {
        this.schema = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });
    }

    transform(value: string): string {
        const { error } = this.schema.validate(value);
        if (error) {
            throw new BadRequestException('Invalid UUID format');
        }
        return value;
    }
}
