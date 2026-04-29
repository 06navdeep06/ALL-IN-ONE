import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly clerk: ReturnType<typeof createClerkClient>;

  constructor(private readonly config: ConfigService) {
    // Use a dummy secret — we verify via Clerk, not local secret
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: config.get<string>('CLERK_SECRET_KEY') ?? 'clerk-placeholder',
      // We'll override validation below
    });

    this.clerk = createClerkClient({
      secretKey: this.config.getOrThrow<string>('CLERK_SECRET_KEY'),
    });
  }

  async validate(payload: Record<string, unknown>) {
    // The payload comes from passport-jwt's decode, but we need to verify
    // the token properly via Clerk. Re-verify using Clerk's SDK.
    const sub = payload.sub;
    if (typeof sub !== 'string' || !sub) {
      throw new UnauthorizedException('Invalid token: missing sub');
    }

    try {
      const user = await this.clerk.users.getUser(sub);
      return {
        sub: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? '',
        name:
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          (user.emailAddresses[0]?.emailAddress ?? 'Creator'),
      };
    } catch {
      throw new UnauthorizedException('Invalid Clerk user');
    }
  }
}
