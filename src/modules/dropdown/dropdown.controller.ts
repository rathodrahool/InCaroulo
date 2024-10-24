import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { DropdownService } from './dropdown.service';

import response from '@shared/helpers/response';
import { Response } from 'express';
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { JoiValidationPipe } from '@pipes/joi-validation.pipe';
import { FindAllSchema } from '@shared/schema/find.all.schema';
import { FindAllQuery } from '@shared/interfaces/interfaces';

@Controller('dropdown')
export class DropdownController {
    constructor(private readonly dropdownService: DropdownService) {}

    @Get('/countries')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] }, { role: 'user', permission: [] })
    async findAll(@Query(new JoiValidationPipe(FindAllSchema)) query: FindAllQuery, @Res() res: Response) {
        const { search, order } = query;
        const [list, count] = await this.dropdownService.findAllCountries(search, order);
        return response.successResponse(
            res,
            count > 0 ? SUCCESS.RECORD_FOUND('countries') : ERROR.NO_RESULT_FOUND,
            list,
        );
    }
}
