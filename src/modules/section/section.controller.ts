// NestJS common decorators and utilities
import { Controller, Post, Body, Get, Param, Patch, Delete, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

// Services
import { SectionService } from './section.service';

// DTO (Data Transfer Objects)
import { CreateSectionDto } from './dto/create.section.dto';
import { UpdateSectionDto } from './dto/update.section.dto';

// Validation and Schemas+
import { JoiValidationPipe } from '@pipes/joi-validation.pipe';
import { createSectionJoiSchema } from './schema/create.section.schema';
import { updateSectionJoiSchema } from './schema/update.section.schema';

// Guards and Decorators
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';

import { ERROR, SUCCESS } from '@shared/constants/messages';
import { FindAllQuery, Pagination } from '@shared/interfaces/interfaces';
import { Section } from './entities/section.entity';
import response from '@shared/helpers/response';
import { UUIDValidationPipe } from '@pipes/uuid-validation.pipe';
import { FindAllSchema } from '@shared/schema/find.all.schema';
import { LIMIT, OFFSET } from '@shared/constants/constant';

@ApiTags('section')
@Controller('section')
export class SectionController {
    constructor(private readonly sectionService: SectionService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async create(
        @Body(new JoiValidationPipe(createSectionJoiSchema)) createSectionDto: CreateSectionDto,
        @Res() res: Response,
    ) {
        const result = await this.sectionService.createSection(createSectionDto);
        return response.successCreate(res, SUCCESS.RECORD_CREATED('Section'), result);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async findAll(@Query(new JoiValidationPipe(FindAllSchema)) query: FindAllQuery, @Res() res: Response) {
        const { search, order, limit = +LIMIT, offset = +OFFSET } = query;

        const pagination: Pagination<Section> = await this.sectionService.findAllSection(
            +limit,
            +offset,
            search,
            order,
        );
        const customMessage = pagination.total > 0 ? SUCCESS.RECORD_FOUND('Sections') : ERROR.NO_RESULT_FOUND;
        return response.successResponseWithPagination(res, customMessage, pagination);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async findOne(@Param('id', UUIDValidationPipe) id: string, @Res() res: Response) {
        const result = await this.sectionService.findOneSection(id);
        return response.successResponse(res, SUCCESS.RECORD_FOUND('Section'), result);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async update(
        @Param('id', UUIDValidationPipe) id: string,
        @Body(new JoiValidationPipe(updateSectionJoiSchema)) updateSectionDto: UpdateSectionDto,
        @Res() res: Response,
    ) {
        const result = await this.sectionService.updateSection(id, updateSectionDto);
        return response.successResponse(
            res,
            result ? SUCCESS.RECORD_UPDATED('Section') : SUCCESS.RECORD_NOT_FOUND('Section'),
        );
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async remove(@Param('id', UUIDValidationPipe) id: string, @Res() res: Response) {
        await this.sectionService.deleteSection(id);
        return response.successResponse(res, SUCCESS.RECORD_DELETED('Section'));
    }
}
