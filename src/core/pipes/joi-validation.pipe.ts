import { PipeTransform, Injectable } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private schema: Joi.ObjectSchema) {}

    transform(value: object) {
        const { error } = this.schema.validate(value, { abortEarly: false });

        if (error) {
            return {
                valid: false,
                messages: error.details.map((detail) => detail.message.replace(/['"]/g, '')),
            };
        }

        return { valid: true, value };
    }
}
