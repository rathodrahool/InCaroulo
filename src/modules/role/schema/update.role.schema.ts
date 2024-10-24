import * as Joi from 'joi';
import { VALIDATION } from '@shared/constants/messages';

export const updateRoleJoiSchema = Joi.object({
    permissions: Joi.array()
        .min(1)
        .items(
            Joi.object({
                section: Joi.string()
                    .required()
                    .messages({
                        'string.empty': VALIDATION.REQUIRED('Section'),
                    }),
                section_permission: Joi.array().items(Joi.string().required()).required(),
            }),
        )
        .required()
        .messages({
            'array.base': VALIDATION.REQUIRED('Permissions'),
        }),
});
