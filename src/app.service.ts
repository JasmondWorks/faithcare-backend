import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  welcome() {
    return {
      success: true,
      message: 'Welcome to the FaithCare API',
      version: '1.0',
      docs: '/api/docs',
    };
  }
}
