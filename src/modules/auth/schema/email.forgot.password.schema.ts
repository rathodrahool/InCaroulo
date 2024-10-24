import * as Joi from 'joi';
import { email } from '@root/src/shared/helpers/common.validation';

export const emailForgotPasswordJoiSchema = Joi.object({
    email: email.required(),
});
