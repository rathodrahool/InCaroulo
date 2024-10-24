import { UserStatus } from '@shared/constants/enum';

export class CreateUserDto {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    contact_number?: string;
    base_url?: string;
    internal_path?: string;
    external_path?: string;
    image?: string;
    block_reason?: string;
    apple_id?: string;
    google_id?: string;
    status?: UserStatus;
    role_name?: string;
    role_id?: string;
    country_code?: string;
}
