import { RequestUser } from './request-user.interface';

declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}
