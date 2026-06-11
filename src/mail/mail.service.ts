import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  sendResetPasswordEmail(email: string, recoveryUrl: string): void {
    this.logger.log(`Reset password email for ${email}: ${recoveryUrl}`);
  }
}
