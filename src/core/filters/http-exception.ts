import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import logger from '@middlewares/logger';

import { Response, Request } from 'express';
import { ErrorResponse } from '@shared/constants/types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        let status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        let errorResponse: ErrorResponse;

        // Handle specific exceptions like ForbiddenException
        if (exception instanceof ForbiddenException) {
            errorResponse = {
                status: 0,
                message: 'Resource not found',
            };
        } else {
            const exceptionResponse =
                exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

            // If the exception response is an object, extract its properties
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                errorResponse = {
                    status: 0,
                    message: (exceptionResponse as { message?: string }).message || 'Internal server error',
                };
            } else {
                errorResponse = {
                    status: 0,
                    message: exceptionResponse as string,
                };
            }
        }

        // General error logging for all exceptions except BadRequestException and HttpException with status 200
        if (
            !(exception instanceof BadRequestException) &&
            !(exception instanceof HttpException && exception.getStatus() === HttpStatus.OK)
        ) {
            const timestamp = new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
            });

            const logMessage = `${timestamp} - METHOD: [${request.method}] - PATH: [${request.url}] - STATUS: [${status}] - MESSAGE: [${exception instanceof Error ? exception.message : 'Unknown error'}]`;

            logger.error(logMessage);
        }

        // Additional handling for specific error codes (e.g., database errors)
        if (
            exception instanceof Error &&
            'code' in exception &&
            ['23505'].includes((exception as { code: string }).code)
        ) {
            status = HttpStatus.BAD_REQUEST;
            errorResponse.message = 'Record already exists';
        }

        // Remove `statusCode` and `error` from the response if they exist
        delete errorResponse.statusCode;
        delete errorResponse.error;

        response.status(status).json(errorResponse);
    }
}
