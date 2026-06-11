import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../application/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
  headers: Request["headers"] & { authorization?: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }
    const payload = this.auth.verifyAccessToken(token);
    request.user = { id: payload.sub };
    return true;
  }
}
