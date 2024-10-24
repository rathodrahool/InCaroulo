import { BadRequestException } from '@nestjs/common';
import { UUIDValidationPipe } from './uuid-validation.pipe';
describe('UUIDValidationPipe', () => {
    let pipe: UUIDValidationPipe;

    beforeEach(async () => {
        pipe = new UUIDValidationPipe();
    });

    describe('transform', () => {
        it('should return the value if it is a valid UUID', () => {
            const validUUID = '550e8400-e29b-41d4-a716-446655440000';
            expect(pipe.transform(validUUID)).toBe(validUUID);
        });

        it('should throw BadRequestException if the value is not a valid UUID', () => {
            const invalidUUIDs = [
                '1234', // Too short
                'abcd1234-5678-90ab-cdef-1234567890ab', // Invalid format
                '550e8400-e29b-41d4-a716-44665544000z', // Invalid character
            ];

            invalidUUIDs.forEach((invalidUUID) => {
                try {
                    pipe.transform(invalidUUID);
                } catch (error) {
                    expect(error).toBeInstanceOf(BadRequestException);
                    expect(error.message).toBe('Invalid UUID format');
                }
            });
        });

        it('should handle empty values and other non-UUID strings', () => {
            const nonUUIDValues = ['', 'not-a-uuid', '1234-5678-90ab-cdef-1234567890ab'];

            nonUUIDValues.forEach((value) => {
                try {
                    pipe.transform(value);
                } catch (error) {
                    expect(error).toBeInstanceOf(BadRequestException);
                    expect(error.message).toBe('Invalid UUID format');
                }
            });
        });
    });
});
