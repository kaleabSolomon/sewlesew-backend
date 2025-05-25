import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { NO_AUTH_KEY } from 'src/common/decorators';
import { OPTIONAL_AUTH_KEY } from 'src/common/decorators/optionalAuth.decorator';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOptionalAuth) {
      try {
        // Convert the result to a Promise and await it
        const result = await super.canActivate(context);
        return result as boolean;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // If authentication fails, that's okay for optional auth
        return true;
      }
    }
    const noAuth = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (noAuth) {
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
