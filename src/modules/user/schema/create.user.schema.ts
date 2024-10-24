import * as Joi from 'joi';
import { email, password, full_name } from '@root/src/shared/helpers/common.validation';
import { VALIDATION } from '@root/src/shared/constants/messages';

export const createUserJoiSchema = Joi.object({
    full_name: full_name.required(),
    email: email.required(),
    password: password.required(),
    confirm_password: password
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Confirm Password'),
            'any.required': VALIDATION.REQUIRED('Confirm Password'),
            'any.only': VALIDATION.PASSWORD_CONFIRM_MATCH,
        }),
}).with('password', 'confirm_password');
