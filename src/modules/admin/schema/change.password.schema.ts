import * as Joi from 'joi';
import { VALIDATION } from '@shared/constants/messages';
import { password } from '@root/src/shared/helpers/common.validation';

export const changePasswordJoiSchema = Joi.object({
    old_password: Joi.string()
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Old Password'),
        }),
    new_password: password.required(),
});
