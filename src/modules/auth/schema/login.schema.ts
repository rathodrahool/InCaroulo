import * as Joi from 'joi';
import { email, password } from '@shared/helpers/common.validation';

export const createLoginJoiSchema = Joi.object({
    email: email,
    password: password,
});
