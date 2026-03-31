import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { UserDocument } from '../schemas/user.schema';
import { UsersRepository } from '../repositories/user.repository';

@Injectable()
export class UsersService extends BaseService<UserDocument> {
  constructor(private usersRepository: UsersRepository) {
    super(usersRepository);
  }

  async getMe(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const { password: _, ...profile } = (user as any).toObject();
    return { success: true, data: profile };
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByUsername(username: string) {
    return username;
  }
}
