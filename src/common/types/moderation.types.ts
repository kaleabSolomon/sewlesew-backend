import { AdminActions, ModerationTarget } from '@prisma/client';

export type ModReq = {
  adminId: string;
  action: AdminActions;
  target: ModerationTarget;
  targetId: string;
  reason: string;
};
