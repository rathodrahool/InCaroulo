import { Controller, Body, Get, Patch, Delete, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { JoiValidationPipe } from '@pipes/joi-validation.pipe';
import { ApiTags } from '@nestjs/swagger';
import { emailUpdateProfileJoiSchema } from '@modules/auth/schema/email.update.profile.schema';
import { emailVerifyJoiSchema } from '@modules/auth/schema/email.verify.schema';

// DTO (Data Transfer Objects)
import { EmailUpdateProfileDto } from '@modules/auth/dto/email.update.profile.dto';
import { EmailVerifyDto } from '@modules/auth/dto/email.verify.dto';

// Guards
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import response from '@shared/helpers/response';
import { AUTH_SUCCESS, SUCCESS } from '@shared/constants/messages';

@ApiTags('users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getUserProfile(@Req() req, @Res() res: Response) {
        const result = await this.userService.getUserProfile(req);
        return response.successResponse(res, SUCCESS.RECORD_FETCHED('Profile'), result);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateUserProfile(
        @Req() req,
        @Body(new JoiValidationPipe(emailUpdateProfileJoiSchema)) emailUpdateProfileDto: EmailUpdateProfileDto,
        @Res() res: Response,
    ) {
        await this.userService.updateUserProfile(emailUpdateProfileDto, req);
        return response.successResponse(res, SUCCESS.RECORD_UPDATED('Profile'));
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile/change-email/verify-otp')
    async verifyOtp(
        @Req() req,
        @Body(new JoiValidationPipe(emailVerifyJoiSchema)) emailVerifyDto: EmailVerifyDto,
        @Res() res: Response,
    ) {
        await this.userService.verifyOtp(emailVerifyDto, req);
        return response.successResponse(res, AUTH_SUCCESS.EMAIL_UPDATED);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('profile')
    async deleteUserAccount(@Req() req, @Res() res: Response) {
        await this.userService.deleteUserAccount(req);
        return response.successResponse(res, SUCCESS.RECORD_DELETED('Profile'));
    }
}
