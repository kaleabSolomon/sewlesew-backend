import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      return data ? undefined : null;
    }

    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
