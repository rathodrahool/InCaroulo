import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

const env = process.env.NODE_ENV || 'development';
dotenvConfig({ path: `.env.${env}` });

if (typeof process.env.DB_PASSWORD !== 'string') {
    throw new Error(`DB_PASSWORD must be a string in .env.${env}`);
}

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/src/migrations/*.js', 'dist/src/seeders/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
