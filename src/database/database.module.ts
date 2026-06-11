import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlatformAdmin, Plan, Tenant, User } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [PlatformAdmin, Plan, Tenant, User],
        synchronize: false,
        migrationsRun: config.get<string>('RUN_MIGRATIONS_ON_START') === 'true',
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
      }),
    }),
    TypeOrmModule.forFeature([PlatformAdmin, Plan, Tenant, User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
