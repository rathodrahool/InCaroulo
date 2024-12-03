import { MigrationInterface, QueryRunner } from 'typeorm';

export class Test1733208232184 implements MigrationInterface {
    name = 'Test1733208232184';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "scraped_data" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "content" text NOT NULL, CONSTRAINT "PK_fc39554941a49ab420d28b1093b" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
