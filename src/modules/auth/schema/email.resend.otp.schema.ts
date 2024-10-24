import * as Joi from 'joi';

export const ResendOtpSchema = Joi.object({
    contact_number: Joi.string().required(),
});
