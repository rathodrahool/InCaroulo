import * as Joi from 'joi';
import { full_name } from '@root/src/shared/helpers/common.validation';

export const emailUpdateProfileJoiSchema = Joi.object({
    full_name: full_name,
});
