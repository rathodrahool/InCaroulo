// NestJS common decorators and utilities
import { Controller, Post, Body, Get, Param, Patch, Delete, Query, Res, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

// Services
import { RoleService } from './role.service';

// DTO (Data Transfer Objects)
import { CreateRoleDto } from './dto/create.role.dto';
import { UpdateRoleDto } from './dto/update.role.dto';

// Entities
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';

// TypeORM
import { Repository } from 'typeorm';

// Validation and Schemas
import { JoiValidationPipe } from '@pipes/joi-validation.pipe';
import { createRoleJoiSchema } from './schema/create.role.schema';
import { updateRoleJoiSchema } from './schema/update.role.schema';

// Guards and Decorators
import { Roles } from '@decorators/roles.decorator';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { ERROR, SUCCESS } from '@shared/constants/messages';
import { FindAllQuery, Pagination } from '@shared/interfaces/interfaces';
import { Role } from './entities/role.entity';
import response from '@shared/helpers/response';
import { UUIDValidationPipe } from '@pipes/uuid-validation.pipe';
import { FindAllSchema } from '@shared/schema/find.all.schema';
import { LIMIT, OFFSET } from '@shared/constants/constant';

@ApiTags('role')
@Controller('role')
export class RoleController {
    constructor(
        private readonly roleService: RoleService,
        @InjectRepository(RoleSectionPermission)
        private readonly roleSectionPermissionRepository: Repository<RoleSectionPermission>,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async create(@Body(new JoiValidationPipe(createRoleJoiSchema)) createRoleDto: CreateRoleDto, @Res() res: Response) {
        const result = await this.roleService.createRole(createRoleDto);
        return response.successCreate(res, SUCCESS.RECORD_CREATED('Role'), result);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async findAll(@Query(new JoiValidationPipe(FindAllSchema)) query: FindAllQuery, @Res() res: Response) {
        const { search, order, offset = +OFFSET, limit = +LIMIT } = query;
        const pagination: Pagination<Role> = await this.roleService.findAllRole(+limit, +offset, search, order);
        const customMessage = pagination.total > 0 ? SUCCESS.RECORD_FOUND('Roles') : ERROR.NO_RESULT_FOUND;
        return response.successResponseWithPagination(res, customMessage, pagination);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async findOne(@Param('id', UUIDValidationPipe) id: string, @Res() res: Response) {
        const result = await this.roleService.findOneRole(id);
        return response.successResponse(res, SUCCESS.RECORD_FOUND('Role'), result);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async update(
        @Param('id', UUIDValidationPipe) id: string,
        @Body(new JoiValidationPipe(updateRoleJoiSchema)) updateRoleDto: UpdateRoleDto,
        @Res() res: Response,
    ) {
        await this.roleService.updateRole(id, updateRoleDto);
        return response.successResponse(res, SUCCESS.RECORD_UPDATED('Role'));
    }
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async remove(@Param('id', UUIDValidationPipe) id: string, @Res() res: Response) {
        await this.roleService.removeRole(id);
        return response.successResponse(res, SUCCESS.RECORD_DELETED('Role'));
    }
}
