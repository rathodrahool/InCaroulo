import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as Joi from 'joi';
import { VALIDATION } from '@shared/constants/messages';
import { DeviceType } from '@shared/constants/enum';
import { device_type } from '../shared/helpers/common.validation';

@Injectable()
export class DeviceInformationMiddleware implements NestMiddleware {
    private readonly schema = Joi.object({
        'device-type': device_type.required().messages({
            'string.empty': VALIDATION.REQUIRED('Device Type'),
            'any.required': VALIDATION.REQUIRED('Device Type'),
        }),
        'device-id': Joi.string().when('device-type', {
            is: DeviceType.WEB,
            then: Joi.string().optional(),
            otherwise: Joi.string()
                .required()
                .messages({
                    'string.empty': VALIDATION.REQUIRED('Device Id'),
                    'any.required': VALIDATION.REQUIRED('Device Id'),
                }),
        }),
        'device-name': Joi.string().when('device-type', {
            is: DeviceType.WEB,
            then: Joi.string().optional(),
            otherwise: Joi.string()
                .required()
                .messages({
                    'string.empty': VALIDATION.REQUIRED('Device Name'),
                    'any.required': VALIDATION.REQUIRED('Device Name'),
                }),
        }),
        'app-version': Joi.string().when('device-type', {
            is: DeviceType.WEB,
            then: Joi.string().optional(),
            otherwise: Joi.string()
                .required()
                .messages({
                    'string.empty': VALIDATION.REQUIRED('App Version'),
                    'any.required': VALIDATION.REQUIRED('App Version'),
                }),
        }),
        timezone: Joi.string().optional(),
    });

    use(req: Request, res: Response, next: NextFunction) {
        const { error } = this.schema.validate(req.headers, { allowUnknown: true, abortEarly: false });

        if (error) {
            const errorMessage = error.details[0].message.replace(/['"]/g, '');
            throw new BadRequestException(errorMessage);
        }

        next();
    }
}
