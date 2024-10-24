import * as Joi from 'joi';
import { VALIDATION } from '@shared/constants/messages';

export const createPermissionJoiSchema = Joi.object({
    permission_name: Joi.string()
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Permission Name'),
        }),
});
