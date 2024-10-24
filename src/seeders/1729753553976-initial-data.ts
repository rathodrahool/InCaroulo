import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialData1729753553976 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert permissions
        await queryRunner.query(
            `INSERT INTO "permissions" (id, created_device_ip, permission_name) 
                               VALUES 
                               ('bda016c6-a304-483b-b018-569cf1e77d5f', '127.0.0.1', 'create'),
                               ('5ea6597f-8536-4474-8356-b34779d2a625', '127.0.0.1', 'view'), 
                               ('cda016c6-a304-483b-b018-569cf1e77d1f', '127.0.0.1', 'delete'),
                               ('986acd8e-d73f-4677-9ba7-f7bd8ff7db4b', '127.0.0.1', 'update');`,
        );

        // Insert sections
        await queryRunner.query(
            `INSERT INTO "sections" (id, created_device_ip, section_name) 
                                 VALUES 
                                ('68ad9e4a-8a89-4c2a-986f-928f58bad774', '127.0.0.1', 'dashboard');`,
        );

        // Insert roles
        await queryRunner.query(
            `INSERT INTO "roles" (id, created_device_ip, role_name) 
                               VALUES 
                               ('c913b0f9-34f6-48bd-9f0c-15fc0b138d97', '127.0.0.1', 'user'),
                               ('a3d99a1b-43a6-4f3b-a51e-69a5b9a4d39e', '127.0.0.1', 'admin');`,
        );

        // Insert role section permissions for 'user' role
        await queryRunner.query(
            `INSERT INTO role_section_permissions (id, created_device_ip, role_id, section_id, permission_id) 
                                VALUES
                                ('7e82bc7c-4354-44c7-b88e-e7cedd05b170', '127.0.0.1', 'c913b0f9-34f6-48bd-9f0c-15fc0b138d97', '68ad9e4a-8a89-4c2a-986f-928f58bad774', 'bda016c6-a304-483b-b018-569cf1e77d5f'),
                                ('4c27a4b1-3002-4211-9b4d-d4784adcb010', '127.0.0.1', 'c913b0f9-34f6-48bd-9f0c-15fc0b138d97', '68ad9e4a-8a89-4c2a-986f-928f58bad774', '5ea6597f-8536-4474-8356-b34779d2a625'),
                                ('641edb09-cdd7-4394-be5b-1d1ccb474575', '127.0.0.1', 'c913b0f9-34f6-48bd-9f0c-15fc0b138d97', '68ad9e4a-8a89-4c2a-986f-928f58bad774', 'cda016c6-a304-483b-b018-569cf1e77d1f'),
                                ('86216f41-1c9d-48d6-b3ad-49d94e3fce04', '127.0.0.1', 'c913b0f9-34f6-48bd-9f0c-15fc0b138d97', '68ad9e4a-8a89-4c2a-986f-928f58bad774', '986acd8e-d73f-4677-9ba7-f7bd8ff7db4b');`,
        );

        // Insert role section permissions for 'admin' role
        await queryRunner.query(
            `INSERT INTO role_section_permissions (id, created_device_ip, role_id, section_id, permission_id) 
                                VALUES
                                ('5e82bc7c-4354-44c7-b88e-e7cedd05b171', '127.0.0.1', 'a3d99a1b-43a6-4f3b-a51e-69a5b9a4d39e', '68ad9e4a-8a89-4c2a-986f-928f58bad774', 'bda016c6-a304-483b-b018-569cf1e77d5f'),
                                ('6c27a4b1-3002-4211-9b4d-d4784adcb011', '127.0.0.1', 'a3d99a1b-43a6-4f3b-a51e-69a5b9a4d39e', '68ad9e4a-8a89-4c2a-986f-928f58bad774', '5ea6597f-8536-4474-8356-b34779d2a625'),
                                ('741edb09-cdd7-4394-be5b-1d1ccb474576', '127.0.0.1', 'a3d99a1b-43a6-4f3b-a51e-69a5b9a4d39e', '68ad9e4a-8a89-4c2a-986f-928f58bad774', 'cda016c6-a304-483b-b018-569cf1e77d1f'),
                                ('76216f41-1c9d-48d6-b3ad-49d94e3fce05', '127.0.0.1', 'a3d99a1b-43a6-4f3b-a51e-69a5b9a4d39e', '68ad9e4a-8a89-4c2a-986f-928f58bad774', '986acd8e-d73f-4677-9ba7-f7bd8ff7db4b');`,
        );

        // Insert admin user
        await queryRunner.query(
            `INSERT INTO "admins" (id, created_device_ip, first_name,last_name, email, password, role_id) 
                               VALUES 
                               ('d9176dd5-dfbb-46d9-b44a-efe80c23290a', '127.0.0.1', 'super','admin', 'superadmin@gmail.com', '$2b$10$OO9CbzQ5V9Ops0EeCSC1GOsZmVeOCfdTEPmD8rIExrdfYXAhpU0ry', 'a3d99a1b-43a6-4f3b-a51e-69a5b9a4d39e');`,
        );
        await queryRunner.query(
            `INSERT INTO country(id, created_device_ip, name, iso_code, flag, phone_code, currency, latitude, longitude, created_at)
            VALUES
            ('dfbe27e9-8ca5-496a-912f-3f6b232461da', '127.0.0.1', 'India', 'IN', '🇮🇳', '+91', 'INR', '20.00000000', '77.00000000', NOW()),
            ('403b399d-ea22-45d3-8cf3-f32924751a63', '127.0.0.1', 'Albania', 'AL', '🇦🇱', '+355', 'ALL', '41.00000000', '20.00000000', NOW()),
            ('41c403e6-2161-472e-9675-949a64ca8b0c', '127.0.0.1', 'Aland Islands', 'AX', '🇦🇽', '+358-18', 'EUR', '60.11666700', '19.90000000', NOW()),
            ('553a8c49-effe-4195-9ca2-33a6c64b5a12', '127.0.0.1', 'Andorra', 'AD', '🇦🇩', '+376', 'EUR', '42.50000000', '1.50000000', NOW()),
            ('25bb9167-867d-476b-bf77-a09ad158d861', '127.0.0.1', 'Armenia', 'AM', '🇦🇲', '+374', 'AMD', '40.00000000', '45.00000000', NOW()),
            ('d966ba94-f32a-4d5b-a6b7-54837f9418b1', '127.0.0.1', 'Austria', 'AT', '🇦🇹', '+43', 'EUR', '47.33333333', '13.33333333', NOW()),
            ('3705e29e-5fc5-4a22-9613-90404ff4a19d', '127.0.0.1', 'Azerbaijan', 'AZ', '🇦🇿', '+994', 'AZN', '40.50000000', '47.50000000', NOW()),
            ('446e204c-948c-4139-885d-33f1238e8c6d', '127.0.0.1', 'Belarus', 'BY', '🇧🇾', '+375', 'BYN', '53.00000000', '28.00000000', NOW()),
            ('17c52ca4-421c-422b-a0df-dc727f777f7f', '127.0.0.1', 'Belgium', 'BE', '🇧🇪', '+32', 'EUR', '50.83333333', '4.00000000', NOW()),
            ('3d3754bf-8c07-43ad-a368-f0978529ea2b', '127.0.0.1', 'Bosnia and Herzegovina', 'BA', '🇧🇦', '387', 'BAM', '44.00000000', '18.00000000', NOW()),
            ('cc5cf6e6-c0c2-4d20-aa37-7780138c308d', '127.0.0.1', 'Bulgaria', 'BG', '🇧🇬', '+359', 'BGN', '43.00000000', '25.00000000', NOW()),
            ('2818ba79-851e-4524-ae0d-bf8a357fd91c', '127.0.0.1', 'Croatia', 'HR', '🇭🇷', '+385', 'HRK', '45.16666666', '15.50000000', NOW()),
            ('c794e878-a82e-4b8e-9abd-02a0baa8a39e', '127.0.0.1', 'Cyprus', 'CY', '🇨🇾', '+357', 'EUR', '35.00000000', '33.00000000', NOW()),
            ('02477574-9d92-4fc4-a48d-ea01bbea1d7a', '127.0.0.1', 'Czech Republic', 'CZ', '🇨🇿', '420', 'CZK', '49.75000000', '15.50000000', NOW()),
            ('85e2d026-43dc-4165-925e-9629e316f3de', '127.0.0.1', 'Denmark', 'DK', '🇩🇰', '+45', 'DKK', '56.00000000', '10.00000000', NOW()),
            ('26e2ff7d-799a-4451-8a82-a7f7fbda8897', '127.0.0.1', 'Estonia', 'EE', '🇪🇪', '+372', 'EUR', '59.00000000', '26.00000000', NOW()),
            ('63791ae3-2f36-4b3f-9caf-0e558cf1aa9c', '127.0.0.1', 'Finland', 'FI', '🇫🇮', '+358', 'EUR', '64.00000000', '26.00000000', NOW()),
            ('2adb17e6-c506-4ed1-b9f3-59ffe29fc56e', '127.0.0.1', 'Gibraltar', 'GI', '🇬🇮', '+350', 'GIP', '36.13333333', '-5.35000000', NOW()),
            ('d53093b3-7245-4fb9-a090-622a936005b4', '127.0.0.1', 'Hungary', 'HU', '🇭🇺', '+36', 'HUF', '47.00000000', '20.00000000', NOW()),
            ('eac71bab-3b92-4883-8cea-0e2ef455cafe', '127.0.0.1', 'Portugal', 'PT', '🇵🇹', '+351', 'EUR', '39.50000000', '-8.00000000', NOW()),
            ('fae003c7-34e1-412e-b9a8-4ce13aeb0283', '127.0.0.1', 'Romania', 'RO', '🇷🇴', '+40', 'RON', '46.00000000', '25.00000000', NOW()),
            ('e3959b8a-3ff2-4198-8243-bc0cf3a7b60a', '127.0.0.1', 'Serbia', 'RS', '🇷🇸', '+381', 'RSD', '44.00000000', '21.00000000', NOW()),
            ('a0340130-7c80-439e-937b-f0c2c4cb6431', '127.0.0.1', 'Slovakia', 'SK', '🇸🇰', '+421', 'EUR', '48.66666666', '19.50000000', NOW()),
            ('e1ae51bd-55c3-4533-8a31-9a9fbde6f4fa', '127.0.0.1', 'France', 'FR', '🇫🇷', '+33', 'EUR', '46.00000000', '2.00000000', NOW()),
            ('6fd93c8b-a2b1-41cc-a48a-be942be2d6d4', '127.0.0.1', 'Greece', 'GR', '🇬🇷', '+30', 'EUR', '39.00000000', '22.00000000', NOW()),
            ('191af3e7-7e53-4c63-b65e-b437d8520012', '127.0.0.1', 'Iceland', 'IS', '🇮🇸', '+354', 'ISK', '65.00000000', '-18.00000000', NOW()),
            ('4a5e4e3b-041b-4373-a4f0-630549077047', '127.0.0.1', 'Ireland', 'IE', '🇮🇪', '+353', 'EUR', '53.00000000', '-8.00000000', NOW()),
            ('9912c1a0-1918-4673-9419-cf38eb4b625a', '127.0.0.1', 'Italy', 'IT', '🇮🇹', '+39', 'EUR', '42.83333333', '12.83333333', NOW()),
            ('1f91e9b1-a53b-4fc2-a82d-d2951bc87fe7', '127.0.0.1', 'Kazakhstan', 'KZ', '🇰🇿', '7', 'KZT', '48.00000000', '68.00000000', NOW()),
            ('b1870506-393a-471e-a8f4-9a7423129cd2', '127.0.0.1', 'Kosovo', 'XK', '🇽🇰', '+383', 'EUR', '42.58333333', '21.00000000', NOW()),
            ('35e6ec03-b1f7-4312-b62c-26b031f7cb4a', '127.0.0.1', 'Latvia', 'LV', '🇱🇻', '+371', 'EUR', '57.00000000', '25.00000000', NOW()),
            ('f0a56478-84d7-40d7-9a63-4a72b1f38201', '127.0.0.1', 'Liechtenstein', 'LI', '🇱🇮', '+423', 'CHF', '47.26666666', '9.53333333', NOW()),
            ('204ad93e-24d6-4717-b5bc-57f3527f31c6', '127.0.0.1', 'Lithuania', 'LT', '🇱🇹', '+370', 'EUR', '56.00000000', '24.00000000', NOW()),
            ('7bbff848-0d9f-48f0-b3fe-b823c6ec6403', '127.0.0.1', 'Luxembourg', 'LU', '🇱🇺', '+352', 'EUR', '49.75000000', '6.16666666', NOW()),
            ('001f208e-9b5d-44f5-a15f-679b870203c5', '127.0.0.1', 'Malta', 'MT', '🇲🇹', '+356', 'EUR', '35.83333333', '14.58333333', NOW()),
            ('453c67ab-274d-40a6-9c98-e3e39e7f6cf3', '127.0.0.1', 'Moldova', 'MD', '🇲🇩', '+373', 'MDL', '47.00000000', '29.00000000', NOW()),
            ('a1019944-4c97-4506-bf3c-6e32e4ebd54f', '127.0.0.1', 'Monaco', 'MC', '🇲🇨', '+377', 'EUR', '43.73333333', '7.40000000', NOW()),
            ('cf4f3ad0-a211-48f2-aace-02d0f48df1d5', '127.0.0.1', 'Montenegro', 'ME', '🇲🇪', '+382', 'EUR', '42.50000000', '19.30000000', NOW()),
            ('8a01c46e-f88c-4fa0-a230-8cb07d1c2f5e', '127.0.0.1', 'Netherlands', 'NL', '🇳🇱', '+31', 'EUR', '52.50000000', '5.75000000', NOW()),
            ('f203df03-4407-4f3b-87c2-318d1aa0a2e2', '127.0.0.1', 'North Macedonia', 'MK', '🇲🇰', '+389', 'MKD', '41.83333333', '22.00000000', NOW()),
            ('981d8b85-5c48-4c63-b42b-e678385d983e', '127.0.0.1', 'Norway', 'NO', '🇳🇴', '+47', 'NOK', '62.00000000', '10.00000000', NOW()),
            ('82076fbb-e1a2-47a6-9ab5-55ed8de8d30f', '127.0.0.1', 'Poland', 'PL', '🇵🇱', '+48', 'PLN', '52.00000000', '20.00000000', NOW()),
            ('4cbfbcbf-b9db-4e8c-8b7b-7d77506fe13c', '127.0.0.1', 'San Marino', 'SM', '🇸🇲', '+378', 'EUR', '43.76666666', '12.41666666', NOW()),
            ('9d5c788b-cf53-44f8-9856-c77e1f2e5318', '127.0.0.1', 'Slovenia', 'SI', '🇸🇮', '+386', 'EUR', '46.00000000', '15.00000000', NOW()),
            ('4a02fc29-9cf8-4d1b-b38d-43f8b60cc732', '127.0.0.1', 'Spain', 'ES', '🇪🇸', '+34', 'EUR', '40.00000000', '-4.00000000', NOW()),
            ('a52fb4e8-906e-4e75-8e6b-d907c1b11607', '127.0.0.1', 'Sweden', 'SE', '🇸🇪', '+46', 'SEK', '62.00000000', '15.00000000', NOW()),
            ('d8c635fa-a036-4b5a-84f8-6bfc4e72a752', '127.0.0.1', 'Switzerland', 'CH', '🇨🇭', '+41', 'CHF', '47.00000000', '8.00000000', NOW()),
            ('eeccfc09-e0de-4ad6-a7fe-3382b3c745f2', '127.0.0.1', 'Ukraine', 'UA', '🇺🇦', '+380', 'UAH', '49.00000000', '32.00000000', NOW()),
            ('a80eb2a6-9189-47df-b109-eccbc5d14417', '127.0.0.1', 'United Kingdom', 'GB', '🇬🇧', '+44', 'GBP', '54.00000000', '-2.00000000', NOW()),
            ('88c2174f-a268-4d8b-aec0-74ae346215c6', '127.0.0.1', 'Faroe Islands', 'FO', '🇫🇴', '+298', 'DKK', '62.00000000', '-7.00000000', NOW()),
            ('3e6c1b07-64f6-4014-b524-2c5d45c4293e', '127.0.0.1', 'Svalbard', 'SJ', '🇸🇯', '+47', 'NOK', '78.00000000', '20.00000000', NOW())
            ON CONFLICT DO NOTHING`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM "admins";');
        await queryRunner.query('DELETE FROM "role_section_permissions";');
        await queryRunner.query('DELETE FROM "roles";');
        await queryRunner.query('DELETE FROM "sections";');
        await queryRunner.query('DELETE FROM "permissions";');
    }
}
