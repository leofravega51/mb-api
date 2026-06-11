import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAdmin } from '@/database/entities/platform-admin.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformAdmin])],
  providers: [SeedService],
})
export class SeedsModule {}
