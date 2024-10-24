import { IsOptional, IsString } from 'class-validator';

export class EmailSignupDto {
    // Existing fields
    @IsString()
    name: string;

    @IsString()
    email: string;

    @IsString()
    password: string;

    @IsString()
    confirmPassword: string;

    // New fields
    @IsOptional()
    @IsString()
    deviceId?: string;

    @IsOptional()
    @IsString()
    deviceType?: string;

    @IsOptional()
    @IsString()
    appVersion?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    deviceName?: string;
}
