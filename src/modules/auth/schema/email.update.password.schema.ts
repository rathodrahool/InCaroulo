import * as Joi from 'joi';
import { email, password } from '@root/src/shared/helpers/common.validation';
import { VALIDATION } from '@root/src/shared/constants/messages';

export const emailUpdatePasswordJoiSchema = Joi.object({
    email: email,
    new_password: password.required(),
    confirm_password: password
        .valid(Joi.ref('new_password'))
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Confirm Password'),
            'any.required': VALIDATION.REQUIRED('Confirm Password'),
            'any.only': VALIDATION.PASSWORD_CONFIRM_MATCH,
        }),
}).with('new_password', 'confirm_password');
