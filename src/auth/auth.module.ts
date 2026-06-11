import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '@/users/users.module';
import { RoleModule } from '@/role/role.module';
import { MailModule } from '@/mail/mail.module';
import { TenantsModule } from '@/tenants/tenants.module';
import { PlansModule } from '@/plans/plans.module';
import { JwtPermissionsGuard } from '@/common/guards/jwt-permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@Module({
  imports: [
    UsersModule,
    RoleModule,
    MailModule,
    TenantsModule,
    PlansModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'default-secret-change-me'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtPermissionsGuard, TenantGuard],
  exports: [AuthService, JwtModule, TenantGuard],
})
export class AuthModule {}
