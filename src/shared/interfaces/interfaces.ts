import { Admin } from '@modules/admin/entities/admin.entity';
import { DeviceInformation } from '@modules/auth/device-information/entities/device.information.entity';
import { User } from '@modules/user/entities/user.entity';
import { TokenTypeEnum, ActivityType } from '@shared/constants/enum';

import { Request } from 'express';

export interface DecodedUser {
    id: string;
    email: string;
    otp: number;
    role_id: string;
}
export interface Data<T> {
    message?: string;
    data: T;
}

export interface List<T> {
    message?: string;
    total: number;
    limit: number;
    offset: number;
    data: T[];
}
export interface Pagination<T> {
    total: number;
    limit: number;
    offset: number;
    data: T[];
}
export interface JwtPayload {
    email?: string;
    id: string;
    contactNumber?: string;
    roleName?: string;
    otp?: number;
}
export interface MailOptions {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
    cc?: string | Array<string>;
    bcc?: string | Array<string>;
    attachments?: {
        filename?: string | false | undefined;
        content?: string | Buffer | undefined;
        path?: string | undefined;
        href?: string | undefined;
        folder?: string;
        contentType?: string | undefined;
    }[];
    dynamicTemplateData?: { [key: string]: any } | undefined;
}

export interface RolePermission {
    role: string;
    permission: string[];
}

export interface TokenCreationOptions {
    entity: User | Admin;
    access_token: string;
    access_token_expiry: Date;
    refresh_token_expiry?: Date;
    refresh_token?: string;
    uid?: string;
    type?: TokenTypeEnum;
    device?: DeviceInformation;
}
export interface deviceInfoOptions {
    request: Request;
    activity_type: ActivityType;
    user: User;
    registered_at?: Date;
    is_active?: boolean;
    last_active_at?: Date;
    link_id?: string;
}

export interface FindAllQuery {
    limit?: number;
    offset?: number;
    search?: string;
    order?: { [key: string]: 'ASC' | 'DESC' };
}

export interface GoogleUser {
    email: string;
    name: string;
    picture: string;
    sub: string;
}

export interface AuthenticatedRequest extends Request {
    user?: GoogleUser;
}
