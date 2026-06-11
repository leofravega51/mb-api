import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { UserRepository } from './domain/repositories/user.repository';
import { UsersWebsocketService } from './application/services/users-websocket.service';
import { TeamUsersService } from './team-users.service';
import { TeamUsersController } from './team-users.controller';
import { PlansModule } from '@/plans/plans.module';
import { RoleModule } from '@/role/role.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => PlansModule), RoleModule],
  controllers: [TeamUsersController],
  providers: [UserRepository, UsersWebsocketService, TeamUsersService],
  exports: [UserRepository, UsersWebsocketService],
})
export class UsersModule {}
