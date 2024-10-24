import { applyDecorators, Type } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiResponseSchema(description: string) {
    return applyDecorators(
        ApiResponse({ status: 200, description }),
        ApiResponse({ status: 400, description: 'Bad Request' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 500, description: 'Internal Server Error' }),
    );
}

export function ApiCreateOperation(summary: string, bodyType: Type<object>, message: string, example: object) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiResponse({
            status: 201,
            description: `${message}  Created Successfully`,
            example: {
                status: 1,
                message: `${message} Created Successfully`,
                value: example,
            },
        }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiBody({
            type: bodyType,
            description: `JSON Structure of ${bodyType.name}`,
        }),
        ApiBearerAuth('JWT-auth'),
    );
}

export function ApiGetAllOperation(summary: string, message: string, example: object) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiResponse({
            status: 200,
            description: `${message} Found Successfully`,
            example: {
                status: 1,
                message: `${message} Found Successfully`,
                total: 2,
                limit: 10,
                offset: 10,
                data: example,
            },
        }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiBearerAuth('JWT-auth'),
    );
}

export function ApiGetOneOperation(summary: string, message: string, example: object) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiResponse({
            status: 200,
            description: `${message} Found Successfully`,
            example: {
                status: 1,
                message: `${message} Found Successfully`,
                data: example,
            },
        }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiBearerAuth('JWT-auth'),
    );
}
export function ApiUpdateOperation(summary: string, bodyType: Type<object>, message: string, example: object) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiResponse({
            status: 200,
            description: `${message} Updated Successfully`,
            example: {
                status: 1,
                message: `${message} Updated Successfully`,
                value: example,
            },
        }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiBody({
            type: bodyType,
            description: `JSON Structure of ${bodyType.name}`,
        }),
    );
}
export function ApiDeleteOperation(summary: string, message: string) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiResponse({
            status: 200,
            description: `${message} Deleted Successfully`,
            example: {
                status: 1,
                message: `${message} Deleted Successfully`,
                data: {},
            },
        }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiBearerAuth('JWT-auth'),
    );
}

export function ApiBatchUpdateOperation(summary: string, bodyType: Type<object>[], message: string, example: object) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiResponse({
            status: 200,
            description: `${message} Batch Updated Successfully`,
            example: {
                status: 1,
                message: `${message} Updated Successfully`,
                data: example,
            },
        }),
        ApiResponse({ status: 400, description: 'Bad Request' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiBody({
            isArray: true,
            description: `Array of ${bodyType.map((type) => type.name).join(', ')} objects`,
            examples: {
                example: {
                    value: example,
                },
            },
        }),
        ApiBearerAuth('JWT-auth'),
    );
}
export const ApiBatchDeleteOperation = (summary: string, message: string) => {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiResponse({ status: 200, description: `${message} deleted successfully` }),
        ApiResponse({ status: 400, description: 'Bad Request' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiResponse({ status: 404, description: `${message} not found` }),
        ApiResponse({ status: 500, description: 'Internal Server Error' }),
        ApiBody({
            type: [String],
            description: `Array of ${message} IDs to be deleted`,
            examples: {
                example: {
                    value: ['30f65798-467f-4d75-b5ec-737c4091fb59', '84cd506a-b933-4472-aa92-517be9abc317'],
                },
            },
        }),
        ApiBearerAuth('JWT-auth'),
    );
};
