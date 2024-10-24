import { JwtPayload, RolePermission } from '@shared/interfaces/interfaces';
import { DeviceType, expiryTimeEnum } from '@shared/constants/enum';
import * as jwt from 'jsonwebtoken';
import { DeviceInformationDto } from '@modules/auth/device-information/dto/device.information.dto';
import { Repository } from 'typeorm';
import { RoleSectionPermission } from '@shared/entities/role.section.permission.entity';

import { deviceInfoOptions } from '@shared/interfaces/interfaces';

export function responseData(secure_url: string, folder: string, public_id: string) {
    try {
        const uploadFile = {
            base: secure_url.substring(0, secure_url.indexOf(folder)),
            internal_path: folder.concat('/'),
            image: secure_url.split('/').pop(),
            public_id: public_id,
        };
        return uploadFile;
    } catch (error) {
        throw new Error(error);
    }
}

export function generateTokens(payload: JwtPayload) {
    try {
        const accessTokenExpiryTime = new Date();
        const refreshTokenExpiryTime = new Date();

        // Generate access and refresh tokens
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: `${expiryTimeEnum.ONE_HOUR}m`,
        });

        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: `${expiryTimeEnum.TEN_DAY}m`,
        });

        accessTokenExpiryTime.setMinutes(accessTokenExpiryTime.getMinutes() + expiryTimeEnum.ONE_HOUR); // 10 minutes
        refreshTokenExpiryTime.setMinutes(refreshTokenExpiryTime.getMinutes() + expiryTimeEnum.TEN_DAY); // in minutes

        return { accessToken, refreshToken, accessTokenExpiryTime, refreshTokenExpiryTime };
    } catch (error) {
        throw new Error(error.message);
    }
}
export const parseSearchKeyword = (searchString: string) => {
    const sqlKeywordsRegex = /\b(UPDATE|DELETE|INSERT|DROP|ALTER|TRUNCATE|EXEC|DECLARE|XP_CMDSHELL|RESTORE|BACKUP)\b/gi;

    const sanitizedString = searchString
        .replace(/'/g, "''") // Escape single quotes
        .replace(/;/g, '') // Remove semicolons (could terminate SQL statements)
        .replace(/--/g, '') // Remove SQL comment markers
        .replace(/%/g, '') // Remove percentage signs (used in LIKE clauses)
        .replace(/=/g, '') // Remove equal signs
        .replace(sqlKeywordsRegex, ''); // Remove SQL keywords

    return sanitizedString;
};

export async function hasPermission(
    roleSectionPermissionRepository: Repository<RoleSectionPermission>,
    requiredRoles: RolePermission[],
    roleId: string,
): Promise<boolean> {
    for (const requiredRole of requiredRoles) {
        const permissions = requiredRole.permission;
        // Allow roles with no specific permissions (like admin or superuser)
        if (permissions && permissions.length === 0) {
            return true;
        }

        // Query the RoleSectionPermission table to check if the user has the required role and permission
        const dbPermissions = await roleSectionPermissionRepository
            .createQueryBuilder('rsp')
            .leftJoinAndSelect('rsp.role', 'role')
            .innerJoin('rsp.permission', 'permission')
            .where('role.id = :roleId', { roleId })
            .andWhere('permission.permission_name IN (:...permissions)', { permissions })
            .getMany();

        // If no matching permissions are found in the database, deny access
        if (!dbPermissions || dbPermissions.length !== permissions.length) {
            return false;
        }

        dbPermissions.forEach((data) => {
            return requiredRole.role !== data.role.role_name;
        });
    }

    return true;
}

export function extractDeviceInfo(options: deviceInfoOptions): DeviceInformationDto {
    const { request, activity_type, user, is_active, last_active_at, registered_at, link_id } = options;
    const deviceType = request.headers['device-type'] as DeviceType;
    const deviceName =
        deviceType === DeviceType.WEB
            ? request.headers['user-agent']?.toLowerCase() || null
            : (request.headers['device-name'] as string) || null;
    return {
        device_id: (request.headers['device-id'] as string) || null,
        device_type: deviceType,
        device_name: deviceName,
        device_ip: request.ip,
        app_version: (request.headers['app-version'] as string) || null,
        timezone: (request.headers['timezone'] as string) || null,
        activity_type: activity_type,
        user: user,
        registered_at: registered_at,
        is_active: is_active,
        last_active_at: last_active_at,
        link_id: link_id,
    };
}
