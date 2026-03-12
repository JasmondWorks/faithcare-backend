import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { UserDocument } from '../schemas/user.schema';
import { UsersRepository } from '../repositories/user.repository';

@Injectable()
export class UsersService extends BaseService<UserDocument> {
  constructor(private usersRepository: UsersRepository) {
    super(usersRepository);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }
  async findByUsername(username: string) {
    return username;
  }
}
