import * as Joi from 'joi';

export const FindAllSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
    search: Joi.string().optional().allow(''),
    order: Joi.object().pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')).default({ created_at: 'ASC' }),
});
