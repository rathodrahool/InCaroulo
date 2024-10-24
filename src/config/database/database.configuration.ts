import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonSubscriber } from '@shared/entities/default.entity';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('database.host'),
                port: configService.get('database.port'),
                username: configService.get('database.username'),
                password: configService.get('database.password'),
                database: configService.get('database.name'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                migrationsTableName: 'typeorm_migrations',
                migrations: ['dist/migrations/*{.ts,.js}'],
                autoLoadEntities: true,
                synchronize: false,
                subscribers: [CommonSubscriber],
            }),
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseModule {}
