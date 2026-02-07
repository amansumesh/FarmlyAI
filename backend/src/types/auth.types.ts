import { Request } from 'express';

export interface TokenPayload {
  userId: string;
  phoneNumber: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}
