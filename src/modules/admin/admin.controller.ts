import { Body, Controller, Patch, Post, UseGuards, Res, Get, Req } from '@nestjs/common';
import { Response } from 'express';
// DTOs (Data Transfer Objects)
import { CreateAdminDto } from './dto/create.admin.dto';
import { LoginAdminDto } from './dto/login.admin.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
// Services and Utilities
import { AdminService } from './admin.service';

// configuration
import { config as dotenvConfig } from 'dotenv';
import { createLoginJoiSchema } from '@modules/auth/schema/login.schema';
import { createAdminJoiSchema } from './schema/create.admin.schema';
import { changePasswordJoiSchema } from './schema/change.password.schema';
import { JoiValidationPipe } from '@pipes/joi-validation.pipe';
import { AssignRoleDto } from './dto/assign.role.dto';
import { RemoveRoleDto } from './dto/remove.role.dto';
import { assignRoleJoiSchema } from './schema/assign.role.schema';
import { removeRoleJoiSchema } from './schema/remove.role.schema';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@decorators/roles.decorator';
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import response from '@shared/helpers/response';
import { AUTH_SUCCESS } from '@shared/constants/messages';

const env = process.env.NODE_ENV || 'development';
dotenvConfig({ path: `.env.${env}` });

@ApiTags('admin')
@Controller('admin')
export class AdminController {
    constructor(private adminService: AdminService) {}

    @Post('signup')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async adminSignUp(
        @Body(new JoiValidationPipe(createAdminJoiSchema))
        createAdminDto: CreateAdminDto,
        @Res() res: Response,
    ) {
        await this.adminService.adminSignUp(createAdminDto);
        return response.successCreate(res, AUTH_SUCCESS.SIGN_UP);
    }

    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Post('login')
    async adminLogin(
        @Body(new JoiValidationPipe(createLoginJoiSchema))
        loginAdminDto: LoginAdminDto,
        @Res() res: Response,
    ) {
        const result = await this.adminService.adminLogin(loginAdminDto);
        return response.successResponse(res, AUTH_SUCCESS.LOGIN, result);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch('change-password')
    @Roles({ role: 'admin', permission: [] })
    async changeAdminPassword(
        @Body(new JoiValidationPipe(changePasswordJoiSchema))
        changePasswordDto: ChangePasswordDto,
        @Req() req,
        @Res() res: Response,
    ) {
        await this.adminService.changeAdminPassword(req.user.id, changePasswordDto);
        return response.successResponse(res, AUTH_SUCCESS.PASSWORD_RESET);
    }
    @Get('logout')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles({ role: 'admin', permission: [] })
    async adminLogout(@Req() req, @Res() res: Response) {
        await this.adminService.adminLogout(req.user.id, req);
        return response.successResponse(res, AUTH_SUCCESS.LOGOUT);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('assign-role')
    @Roles({ role: 'admin', permission: [] })
    async assignRole(
        @Body(new JoiValidationPipe(assignRoleJoiSchema)) assignRoleDto: AssignRoleDto,
        @Res() res: Response,
    ) {
        await this.adminService.assignRole(assignRoleDto);
        return response.successResponse(res, AUTH_SUCCESS.ROLE_ASSIGNED);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('remove-role')
    @Roles({ role: 'admin', permission: [] })
    async removeRole(
        @Body(new JoiValidationPipe(removeRoleJoiSchema)) removeRoleDto: RemoveRoleDto,
        @Res() res: Response,
    ) {
        await this.adminService.removeRole(removeRoleDto);
        return response.successResponse(res, AUTH_SUCCESS.ROLE_REMOVED);
    }
}
