import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { PlatformAdmin, Plan, Tenant, User } from './entities';
import { InitialSchema1749650000000 } from './migrations/1749650000000-InitialSchema';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [PlatformAdmin, Plan, Tenant, User],
  migrations: [InitialSchema1749650000000],
  synchronize: false,
});
