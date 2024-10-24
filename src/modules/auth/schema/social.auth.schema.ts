import * as Joi from 'joi';
import { email } from '@root/src/shared/helpers/common.validation';

export const socialAuthJoiSchema = Joi.object({
    email: email.required(),
    google_id: Joi.string().optional(),
    apple_id: Joi.string().optional(),
});
