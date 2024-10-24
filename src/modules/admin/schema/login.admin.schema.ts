import * as Joi from 'joi';
import { email } from '@shared/helpers/common.validation';
import { VALIDATION } from '@shared/constants/messages';
export const createLoginJoiSchema = Joi.object({
    email: email.required(),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Password'),
            'any.required': VALIDATION.REQUIRED('Password'),
        }),
});
