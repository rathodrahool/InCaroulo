// NestJS common decorators and utilities
import { Body, Controller, Post, Get, Req, Res, UseGuards, Param, Render } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

// DTO (Data Transfer Objects)
import { EmailSignupDto } from './dto/email.signup.dto';
import { EmailLoginDto } from './dto/email.login.dto';
import { EmailVerifyDto } from './dto/email.verify.dto';
import { EmailForgetPasswordDto } from './dto/email.forget.password.dto';
import { EmailUpdatePasswordDto } from './dto/email.update.password.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';

// Services and Utilities
import { AuthService } from './auth.service';
import response from '@shared/helpers/response';

// Constants and Interfaces
import { AUTH_SUCCESS, EMAIL } from '@shared/constants/messages';

// Validation and Schemas
import { createLoginJoiSchema } from './schema/login.schema';
import { JoiValidationPipe } from '@pipes/joi-validation.pipe';
import { emailForgotPasswordJoiSchema } from './schema/email.forgot.password.schema';
import { emailVerifyJoiSchema } from './schema/email.verify.schema';
import { createUserJoiSchema } from '@modules/user/schema/create.user.schema';
import { emailUpdatePasswordJoiSchema } from './schema/email.update.password.schema';
import { refreshTokenSchema } from './schema/refresh.token.schema';
import { AUTH_RATE_LIMIT, AUTH_RATE_LIMIT_TTL } from '@shared/constants/constant';

// guards
import { JwtAuthGuard } from '@guards/jwt.auth.guard';
import { UUIDValidationPipe } from '@root/src/core/pipes/uuid-validation.pipe';

@ApiTags('auth')
@Throttle({ default: { limit: AUTH_RATE_LIMIT, ttl: AUTH_RATE_LIMIT_TTL } })
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    @Get('login')
    @Render('login')
    renderLoginPage() {
        return { title: 'Sign Up' };
    }
    @Get('verificationMail')
    @Render('verificationMail')
    renderVerificationMailPage() {
        return { title: 'Sign Up' };
    }
    @Get('forget')
    @Render('forgetPassword')
    renderForgetPage() {
        return { title: 'Sign Up' };
    }

    @Get('signup')
    @Render('signup')
    renderSignupPage(@Req() req) {
        return {
            title: 'Sign Up',
            success: req.successMessage,
            error: req.errorMessages,
        };
    }
    @Post('signup')
    async signUp(
        @Req() req,
        @Body(new JoiValidationPipe(createUserJoiSchema)) validationResult: any,
        @Res() res: Response,
    ) {
        if (!validationResult.valid) {
            return res.render('signup', {
                title: 'Sign Up',
                error: true,
                errorMessages: validationResult.messages,
            });
        }
        const emailSignupDto: EmailSignupDto = validationResult.value;

        try {
            await this.authService.signUp(emailSignupDto, req);
            return res.redirect('verificationMail');
        } catch (error) {
            return res.render('signup', {
                title: 'Sign Up',
                error: true,
                errorMessages: error.response?.message || [error.message],
            });
        }
    }

    @Get('verify-signup/:uid')
    async verifySignup(@Param('uid', UUIDValidationPipe) uid: string, @Res() res: Response, @Req() req) {
        const result = await this.authService.verifySignup(uid, req);
        return response.successResponse(res, AUTH_SUCCESS.SIGN_UP, result);
    }

    @Post('login')
    async login(@Body(new JoiValidationPipe(createLoginJoiSchema)) emailLoginDto: EmailLoginDto, @Res() res: Response) {
        await this.authService.login(emailLoginDto);
        return response.successResponse(res, AUTH_SUCCESS.OTP_SENT);
    }

    @Post('verify-otp')
    async verify(
        @Body(new JoiValidationPipe(emailVerifyJoiSchema)) emailVerifyDto: EmailVerifyDto,
        @Req() req,
        @Res() res: Response,
    ) {
        const result = await this.authService.verifyLogin(emailVerifyDto, req);
        return response.successResponse(res, AUTH_SUCCESS.LOGIN, result);
    }

    @Post('forgot-password')
    async forgotPassword(
        @Body(new JoiValidationPipe(emailForgotPasswordJoiSchema)) emailForgetPasswordDto: EmailForgetPasswordDto,
        @Req() req,
        @Res() res: Response,
    ) {
        await this.authService.forgotPassword(emailForgetPasswordDto, req);
        return response.successResponse(res, EMAIL.SENT);
    }

    @Post('reset-password/:uid')
    async resetPassword(
        @Param('uid') uid: string,
        @Body(new JoiValidationPipe(emailUpdatePasswordJoiSchema)) emailUpdatePasswordDto: EmailUpdatePasswordDto,
        @Req() req,
        @Res() res: Response,
    ) {
        await this.authService.resetPassword(emailUpdatePasswordDto, uid, req);
        return response.successResponse(res, AUTH_SUCCESS.PASSWORD_RESET);
    }

    @Post('refresh-token')
    async refreshToken(
        @Body(new JoiValidationPipe(refreshTokenSchema)) refreshTokenDto: RefreshTokenDto,
        @Res() res: Response,
    ) {
        const result = await this.authService.refreshToken(refreshTokenDto);
        return response.successResponse(res, AUTH_SUCCESS.TOKEN_REFRESHED, result);
    }
    @UseGuards(JwtAuthGuard)
    @Get('logout')
    async logout(@Req() req, @Res() res: Response) {
        await this.authService.logout(req);
        return response.successResponse(res, AUTH_SUCCESS.LOGOUT);
    }
}
