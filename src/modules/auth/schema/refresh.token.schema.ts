import * as Joi from 'joi';

export const refreshTokenSchema = Joi.object({
    refresh_token: Joi.string().required(),
});
