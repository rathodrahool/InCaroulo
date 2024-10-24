import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllTables1729753544128 implements MigrationInterface {
    name = 'AllTables1729753544128';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."otp_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(
            `CREATE TYPE "public"."otp_type_enum" AS ENUM('signup', 'verify', 'login', 'forgot_password', 'update_email', 'update_phone', 'social_auth')`,
        );
        await queryRunner.query(
            `CREATE TABLE "otp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "status" "public"."otp_status_enum" NOT NULL DEFAULT 'active', "otp" integer NOT NULL, "country_code" character varying(5), "contact_number" character varying(15), "email" text, "type" "public"."otp_type_enum" NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "expire_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid, CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "admins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role_id" uuid, CONSTRAINT "UQ_051db7d37d478a69a7432df1479" UNIQUE ("email"), CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."device_information_device_type_enum" AS ENUM('ios', 'android', 'web')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."device_information_activity_type_enum" AS ENUM('signup', 'signup_verification', 'login', 'logout', 'reset_password', 'forgot_password', 'update_profile', 'update_email', 'update_phone', 'social_auth', 'verify_email_update', 'verify_phone_update', 'delete_account', 'view_profile')`,
        );
        await queryRunner.query(
            `CREATE TABLE "device_information" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "device_id" character varying, "device_name" character varying NOT NULL, "device_ip" character varying NOT NULL, "app_version" character varying, "device_type" "public"."device_information_device_type_enum", "activity_type" "public"."device_information_activity_type_enum" NOT NULL, "timezone" character varying DEFAULT 'UTC+05:30', "is_active" boolean NOT NULL DEFAULT true, "last_active_at" TIMESTAMP WITH TIME ZONE, "registered_at" TIMESTAMP WITH TIME ZONE, "link_id" uuid, "user_id" uuid, CONSTRAINT "PK_235e7a73c361a9e80d4a2d1c1ab" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE TYPE "public"."tokens_access_token_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(
            `CREATE TYPE "public"."tokens_refresh_token_status_enum" AS ENUM('active', 'inactive')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."tokens_type_enum" AS ENUM('access', 'refresh', 'reset', 'verify')`,
        );
        await queryRunner.query(
            `CREATE TABLE "tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "access_token_status" "public"."tokens_access_token_status_enum" NOT NULL DEFAULT 'active', "refresh_token_status" "public"."tokens_refresh_token_status_enum" NOT NULL DEFAULT 'active', "access_token" text NOT NULL, "refresh_token" text, "firebase_token" text, "access_token_expiry" TIMESTAMP WITH TIME ZONE, "refresh_token_expiry" TIMESTAMP WITH TIME ZONE, "type" "public"."tokens_type_enum" NOT NULL DEFAULT 'verify', "user_id" uuid, "admin_id" uuid, "device_id" uuid, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_status_enum" AS ENUM('blocked', 'pending', 'suspended', 'verified', 'unverified', 'deactivated')`,
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "full_name" character varying(255), "email" character varying(255), "password" character varying(255), "base_url" character varying, "internal_path" character varying, "external_path" character varying, "image" character varying, "block_reason" character varying, "google_id" text, "status" "public"."users_status_enum" NOT NULL DEFAULT 'unverified', "role_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "role_name" character varying NOT NULL, CONSTRAINT "UQ_ac35f51a0f17e3e1fe121126039" UNIQUE ("role_name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "permission_name" character varying NOT NULL, CONSTRAINT "UQ_b990eff1fc3540798960d80e452" UNIQUE ("permission_name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "section_name" character varying NOT NULL, CONSTRAINT "UQ_6469301866d8a2426faf8aacc1b" UNIQUE ("section_name"), CONSTRAINT "PK_f9749dd3bffd880a497d007e450" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "role_section_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "role_id" uuid, "section_id" uuid, "permission_id" uuid, CONSTRAINT "PK_50158ed4cff82b89edb53728666" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE TYPE "public"."country_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(
            `CREATE TABLE "country" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "name" character varying NOT NULL, "iso_code" character varying NOT NULL, "flag" character varying NOT NULL, "phone_code" character varying NOT NULL, "currency" character varying NOT NULL, "latitude" character varying NOT NULL, "longitude" character varying NOT NULL, "status" "public"."country_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "todo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_device_ip" character varying(256) NOT NULL, "updated_device_ip" character varying(256), "deleted_device_ip" character varying(256), "title" character varying NOT NULL, "description" character varying NOT NULL, "isCompleted" boolean NOT NULL DEFAULT false, "user_id" uuid, CONSTRAINT "PK_d429b7114371f6a35c5cb4776a7" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "otp" ADD CONSTRAINT "FK_258d028d322ea3b856bf9f12f25" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "admins" ADD CONSTRAINT "FK_5733c73cd81c566a90cc4802f96" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "device_information" ADD CONSTRAINT "FK_db57c78ba8e67ecdfb15c5148ce" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD CONSTRAINT "FK_c075e8f0607cdaa90baca7c2f17" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD CONSTRAINT "FK_02ce56b918434c9c92d3c4f55a4" FOREIGN KEY ("device_id") REFERENCES "device_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "role_section_permissions" ADD CONSTRAINT "FK_83cb256558ddd9faa49254e58a1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "role_section_permissions" ADD CONSTRAINT "FK_624542228cf5a711c9f7390b2fe" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "role_section_permissions" ADD CONSTRAINT "FK_e499109c1b3982cbc6e5495e689" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "todo" ADD CONSTRAINT "FK_9cb7989853c4cb7fe427db4b260" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todo" DROP CONSTRAINT "FK_9cb7989853c4cb7fe427db4b260"`);
        await queryRunner.query(
            `ALTER TABLE "role_section_permissions" DROP CONSTRAINT "FK_e499109c1b3982cbc6e5495e689"`,
        );
        await queryRunner.query(
            `ALTER TABLE "role_section_permissions" DROP CONSTRAINT "FK_624542228cf5a711c9f7390b2fe"`,
        );
        await queryRunner.query(
            `ALTER TABLE "role_section_permissions" DROP CONSTRAINT "FK_83cb256558ddd9faa49254e58a1"`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_02ce56b918434c9c92d3c4f55a4"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_c075e8f0607cdaa90baca7c2f17"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`);
        await queryRunner.query(`ALTER TABLE "device_information" DROP CONSTRAINT "FK_db57c78ba8e67ecdfb15c5148ce"`);
        await queryRunner.query(`ALTER TABLE "admins" DROP CONSTRAINT "FK_5733c73cd81c566a90cc4802f96"`);
        await queryRunner.query(`ALTER TABLE "otp" DROP CONSTRAINT "FK_258d028d322ea3b856bf9f12f25"`);
        await queryRunner.query(`DROP TABLE "todo"`);
        await queryRunner.query(`DROP TABLE "country"`);
        await queryRunner.query(`DROP TYPE "public"."country_status_enum"`);
        await queryRunner.query(`DROP TABLE "role_section_permissions"`);
        await queryRunner.query(`DROP TABLE "sections"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tokens_refresh_token_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tokens_access_token_status_enum"`);
        await queryRunner.query(`DROP TABLE "device_information"`);
        await queryRunner.query(`DROP TYPE "public"."device_information_activity_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."device_information_device_type_enum"`);
        await queryRunner.query(`DROP TABLE "admins"`);
        await queryRunner.query(`DROP TABLE "otp"`);
        await queryRunner.query(`DROP TYPE "public"."otp_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."otp_status_enum"`);
    }
}
