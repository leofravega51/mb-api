import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  @IsString()
  @IsOptional()
  DB_HOST?: string;

  @IsNumber()
  @IsOptional()
  DB_PORT?: number;

  @IsString()
  @IsOptional()
  DB_USER?: string;

  @IsString()
  @IsOptional()
  DB_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_NAME?: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsNumber()
  @IsOptional()
  COOKIE_MAX_AGE: number = 604800000;

  @IsString()
  ADMIN_JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  ADMIN_JWT_EXPIRES_IN: string = '8h';

  @IsString()
  @IsOptional()
  ADMIN_EMAIL: string = 'admin@mybusiness.com';

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD: string = 'admin123';

  @IsString()
  @IsOptional()
  ADMIN_NAME: string = 'Platform Admin';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:5173';
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated as unknown as Record<string, unknown>;
}
