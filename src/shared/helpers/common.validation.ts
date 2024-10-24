import * as Joi from 'joi';
import { ERROR, VALIDATION } from '../constants/messages';
import { DeviceType } from '../constants/enum';

export const email = Joi.string()
    .email()
    .message(VALIDATION.NOT_VALID)
    .max(255)
    .messages({
        'string.empty': VALIDATION.REQUIRED('Email'),
        'any.required': VALIDATION.REQUIRED('Email'),
    });

export const password = Joi.string()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .message(VALIDATION.PASSWORD_PATTERN)
    .messages({
        'string.empty': VALIDATION.REQUIRED('Password'),
        'string.min': VALIDATION.MIN_LENGTH('Password', '8'),
        'any.required': VALIDATION.REQUIRED('Password'),
    });

export const device_type = Joi.string()
    .valid(DeviceType.IOS, DeviceType.ANDROID, DeviceType.WEB)
    .messages({
        'string.empty': VALIDATION.REQUIRED('Device Type'),
        'any.required': VALIDATION.REQUIRED('Device Type'),
        'any.only': VALIDATION.INVALID('Device Type'),
    });

export const user_id = Joi.string()
    .uuid()
    .messages({
        'string.empty': VALIDATION.REQUIRED('User Id'),
        'string.guid': ERROR.INVALID_DETAIL('User Id'),
    });
export const role_id = Joi.string()
    .uuid()
    .messages({
        'string.empty': VALIDATION.REQUIRED('Role Id'),
        'string.guid': ERROR.INVALID_DETAIL('Role Id'),
    });

export const full_name = Joi.string()
    .min(1)
    .messages({
        'string.empty': VALIDATION.REQUIRED('Full Name'),
        'any.required': VALIDATION.REQUIRED('Full Name'),
    });

export const otp = Joi.number()
    .integer()
    .min(100000)
    .max(999999)
    .messages({
        'number.base': VALIDATION.NUMBER('Otp'),
        'number.min': VALIDATION.LENGTH('Otp', '6'),
        'number.max': VALIDATION.LENGTH('Otp', '6'),
        'any.required': VALIDATION.REQUIRED('Otp'),
    });

export const country_code = Joi.string()
    .regex(/^\+\d+$/)
    .messages({
        'string.empty': VALIDATION.REQUIRED('Country Code'),
        'string.pattern.base': VALIDATION.COUNTRY_CODE,
        'any.required': VALIDATION.REQUIRED('Country Code'),
    });

export const contact_number = Joi.string()
    .regex(/^\d{10,15}$/)
    .messages({
        'string.empty': VALIDATION.REQUIRED('Contact Number'),
        'string.pattern.base': VALIDATION.CONTACT_FORMAT,
        'any.required': VALIDATION.REQUIRED('Contact Number'),
    });
