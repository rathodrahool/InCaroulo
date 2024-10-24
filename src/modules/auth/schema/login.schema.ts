import * as Joi from 'joi';
import { VALIDATION } from '@shared/constants/messages';
import { email } from '@shared/helpers/common.validation';

export const createLoginJoiSchema = Joi.object({
    email: email,
    password: Joi.string()
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Password'),
            'any.required': VALIDATION.REQUIRED('Password'),
        }),
});
