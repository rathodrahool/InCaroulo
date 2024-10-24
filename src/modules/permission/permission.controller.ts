// NestJS common decorators and utilities
import { Controller, Post, Body, Get, Param, Patch, Delete, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

// Services
import { PermissionService } from './permission.service';

// DTO (Data Transfer Objects)
import { CreatePermissionDto } from './dto/create.permission.dto';
import { UpdatePermissionDto } from './dto/update.permission.dto';

// Validation and Schemas
import { JoiValidationPipe } from '@pipes/joi-validation.pipe';
import { createPermissionJoiSchema } from './schema/create.permission.schema';
import { updatePermissionJoiSchema } from './schema/update.permission.schema';

// Guards and Decorators
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import response from '@shared/helpers/response';
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { FindAllQuery, Pagination } from '@shared/interfaces/interfaces';
import { Permission } from './entities/permission.entity';
import { UUIDValidationPipe } from '@pipes/uuid-validation.pipe';
import { FindAllSchema } from '@shared/schema/find.all.schema';
import { LIMIT, OFFSET } from '@shared/constants/constant';

@ApiTags('permission')
@Controller('permission')
export class PermissionController {
    constructor(private readonly permissionService: PermissionService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async create(
        @Body(new JoiValidationPipe(createPermissionJoiSchema)) createPermissionDto: CreatePermissionDto,
        @Res() res: Response,
    ) {
        const result = await this.permissionService.createPermission(createPermissionDto);
        return response.successCreate(res, SUCCESS.RECORD_CREATED('Permission'), result);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async findAll(@Query(new JoiValidationPipe(FindAllSchema)) query: FindAllQuery, @Res() res: Response) {
        const { search, order, limit = +LIMIT, offset = +OFFSET } = query;
        const pagination: Pagination<Permission> = await this.permissionService.findAllPermission(
            +limit,
            +offset,
            search,
            order,
        );
        const customMessage = pagination.total > 0 ? SUCCESS.RECORD_FOUND('Permissions') : ERROR.NO_RESULT_FOUND;
        return response.successResponseWithPagination(res, customMessage, pagination);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async findOne(@Param('id', UUIDValidationPipe) id: string, @Res() res: Response) {
        const result = await this.permissionService.findOnePermission(id);
        return response.successResponse(res, SUCCESS.RECORD_FOUND('Permission'), result);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async update(
        @Param('id', UUIDValidationPipe) id: string,
        @Body(new JoiValidationPipe(updatePermissionJoiSchema)) updatePermissionDto: UpdatePermissionDto,
        @Res() res: Response,
    ) {
        const result = await this.permissionService.updatePermission(id, updatePermissionDto);
        return response.successResponse(
            res,
            result ? SUCCESS.RECORD_UPDATED('Permission') : SUCCESS.RECORD_NOT_FOUND('Permission'),
        );
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async remove(@Param('id', UUIDValidationPipe) id: string, @Res() res: Response) {
        const result = await this.permissionService.deletePermission(id);
        return response.successResponse(
            res,
            result ? SUCCESS.RECORD_DELETED('Permission') : SUCCESS.RECORD_NOT_FOUND('Permission'),
        );
    }
}
