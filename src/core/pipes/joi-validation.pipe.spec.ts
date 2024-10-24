import { BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';
import { JoiValidationPipe } from './joi-validation.pipe'; // Adjust the import path as needed

describe('JoiValidationPipe', () => {
    let pipe: JoiValidationPipe;
    let schema: Joi.ObjectSchema;

    beforeEach(async () => {
        schema = Joi.object({
            name: Joi.string().required(),
            age: Joi.number().required(),
            permissions: Joi.array().optional(),
        });

        pipe = new JoiValidationPipe(schema);
    });

    describe('transform', () => {
        it('should return the value if validation passes', () => {
            const validValue = { name: 'John', age: 30 };
            expect(pipe.transform(validValue)).toEqual(validValue);
        });

        it('should throw BadRequestException if validation fails', () => {
            const invalidValue = { name: 'John' }; // Missing age

            try {
                pipe.transform(invalidValue);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe('age is required'); // Adjusted to match Joi's output
            }
        });

        it('should throw BadRequestException if array includes required unknowns', () => {
            const invalidValue = { name: 'and', age: 30, permissions: [] };

            try {
                pipe.transform(invalidValue);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe('At least one Select');
            }
        });

        it('should throw BadRequestException with custom error message', () => {
            const invalidValue = { name: 123, age: 'invalid' }; // Invalid types

            try {
                pipe.transform(invalidValue);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toContain('name must be a string');
            }
        });

        it('should handle empty values', () => {
            const emptyValue = {}; // Missing required fields

            try {
                pipe.transform(emptyValue);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toContain('name is required');
            }
        });
    });
});
