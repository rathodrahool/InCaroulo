import * as Joi from 'joi';
import { role_id, user_id } from '@root/src/shared/helpers/common.validation';
export const assignRoleJoiSchema = Joi.object({
    user_id: user_id,
    role_id: role_id,
});
