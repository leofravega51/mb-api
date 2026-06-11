import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PlatformAdmin } from '@/database/entities/platform-admin.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(PlatformAdmin)
    private readonly adminRepo: Repository<PlatformAdmin>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPlatformAdmin();
  }

  async seedPlatformAdmin(): Promise<void> {
    const count = await this.adminRepo.count();
    if (count > 0) return;

    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@mybusiness.com');
    const password = this.config.get<string>('ADMIN_PASSWORD', 'admin123');
    const name = this.config.get<string>('ADMIN_NAME', 'Platform Admin');
    const passwordHash = await bcrypt.hash(password, 10);

    await this.adminRepo.save(
      this.adminRepo.create({
        email: email.toLowerCase(),
        passwordHash,
        name,
      }),
    );

    this.logger.log(`Platform admin seeded: ${email}`);
  }
}
