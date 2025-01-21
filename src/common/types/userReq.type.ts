import { Role } from '../enums';

export type userReq = {
  userId: string;
  email: string;
  isVerified?: boolean;
  isActive: boolean;
  refreshToken?: string;
  role: Role;
};
