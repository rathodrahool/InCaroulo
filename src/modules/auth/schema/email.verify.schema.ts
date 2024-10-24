import * as Joi from 'joi';
import { email, otp } from '@root/src/shared/helpers/common.validation';

export const emailVerifyJoiSchema = Joi.object({
    email: email,
    otp: otp.required(),
});
