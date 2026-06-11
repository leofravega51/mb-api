import { Module } from '@nestjs/common';
import { RoleRepository } from './domain/repositories/role.repository';

@Module({
  providers: [RoleRepository],
  exports: [RoleRepository],
})
export class RoleModule {}
