import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { UserDocument } from '../schemas/user.schema';
import { UsersRepository } from '../repositories/user.repository';
import { Role } from 'src/core/enums/role.enum';

@Injectable()
export class UsersService extends BaseService<UserDocument> {
  constructor(private usersRepository: UsersRepository) {
    super(usersRepository);
  }

  async getMe(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const raw = user.toObject() as Record<string, unknown>;
    const { password: _pw, ...profile } = raw;
    void _pw;

    // Calculate dynamic onboarding status
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      profile.isOnboarded = !!user.organizationId;
    }

    return { success: true, data: profile };
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findByUsername(username: string) {
    return username;
  }
}
