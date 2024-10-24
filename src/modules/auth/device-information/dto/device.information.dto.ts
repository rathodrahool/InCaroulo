import { User } from '@modules/user/entities/user.entity';

import { Admin } from '@modules/admin/entities/admin.entity';
import { ActivityType, DeviceType } from '@shared/constants/enum';

export class DeviceInformationDto {
    device_id: string;
    device_name: string;
    device_ip: string;
    app_version?: string;
    device_type: DeviceType;
    timezone: string;
    activity_type: ActivityType;
    user?: User;
    admin?: Admin;
    registered_at?: Date;
    is_active?: boolean;
    last_active_at?: Date;
    link_id?: string;
}
