export type userReq = {
  userId: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
};
