import * as Joi from 'joi';
import { VALIDATION } from '@shared/constants/messages';

export const createRoleJoiSchema = Joi.object({
    role_name: Joi.string()
        .required()
        .messages({
            'string.empty': VALIDATION.REQUIRED('Role Name'),
        }),
    permissions: Joi.array()
        .min(1)
        .items(
            Joi.object({
                section: Joi.string()
                    .required()
                    .messages({
                        'string.empty': VALIDATION.REQUIRED('Section'),
                    }),
                section_permission: Joi.array().min(1).items(Joi.string().required()).messages({
                    'array.min': 'At least one section permission is required for the section.',
                    'string.empty': 'Section permission cannot be empty.',
                    'any.required': 'Section permission is required.',
                }),
            }),
        )
        .required()
        .messages({
            'array.base': VALIDATION.REQUIRED('Permissions'),
            'array.min': 'At least one permission is required.',
        }),
});
