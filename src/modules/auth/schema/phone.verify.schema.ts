import * as Joi from 'joi';
import { contact_number, country_code, otp } from '@root/src/shared/helpers/common.validation';

export const phoneVerifyJoiSchema = Joi.object({
    country_code: country_code.required(),
    contact_number: contact_number.required(),
    otp: otp.required(),
});
