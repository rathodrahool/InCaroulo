import * as Joi from 'joi';
import { email, full_name, password } from '@root/src/shared/helpers/common.validation';

export const createAdminJoiSchema = Joi.object({
    full_name: full_name.required(),
    email: email.required(),
    password: password.required(),
});
