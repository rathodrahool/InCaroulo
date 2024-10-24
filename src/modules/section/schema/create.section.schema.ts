import * as Joi from 'joi';
import { VALIDATION } from '@shared/constants/messages';

export const createSectionJoiSchema = Joi.object({
    section_name: Joi.string()
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Section Name'),
        }),
});
