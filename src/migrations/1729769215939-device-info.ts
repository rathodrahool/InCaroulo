import { MigrationInterface, QueryRunner } from "typeorm";

export class DeviceInfo1729769215939 implements MigrationInterface {
    name = 'DeviceInfo1729769215939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_information" ALTER COLUMN "device_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "device_information" ALTER COLUMN "device_ip" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_information" ALTER COLUMN "device_ip" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "device_information" ALTER COLUMN "device_name" SET NOT NULL`);
    }

}
