import { IsString } from 'class-validator';

export class EmailSignupDto {
    @IsString()
    name: string;

    @IsString()
    email: string;

    @IsString()
    password: string;

    @IsString()
    confirmPassword: string;
}
