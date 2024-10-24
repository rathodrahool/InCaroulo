import { DefaultStatus, TokenTypeEnum } from '@shared/constants/enum';

export class UpdateTokenDto {
    access_token_status?: DefaultStatus;
    refresh_token_status?: DefaultStatus;
    access_token?: string;
    refresh_token?: string;
    firebase_token?: string;
    access_token_expiry?: Date;
    refresh_token_expiry?: Date;
    type?: TokenTypeEnum;
}
