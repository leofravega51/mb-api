import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersWebsocketService {
  isUserSessionRevoked(_userId: string): boolean {
    return false;
  }
}
