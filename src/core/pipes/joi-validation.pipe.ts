import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private readonly schema: Joi.ObjectSchema) {}

    transform(value: any) {
        const { error } = this.schema.validate(value, { abortEarly: true });
        if (error) {
            // Get the error message and clean it
            let errorMessage = error.details[0].message.replace(/['"]/g, '');

            // Custom error message for array type
            if (error.details[0].type === 'array.includesRequiredUnknowns') {
                errorMessage = 'At least one Select';
            }

            // Throw a BadRequestException with the custom message
            throw new BadRequestException(errorMessage);
        }

        // Return validated value if no error
        return value;
    }
}
