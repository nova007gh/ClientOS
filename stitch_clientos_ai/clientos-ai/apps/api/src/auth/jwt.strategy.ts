import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@clientos/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret-change-me'),
    });
  }

  async validate(payload: { sub: string; org?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    let organization = null;
    let role = null;

    if (payload.org) {
      const member = await prisma.organizationMember.findFirst({
        where: { userId: user.id, organizationId: payload.org, status: 'ACTIVE' },
        include: { organization: true },
      });
      if (member) {
        organization = member.organization;
        role = member.role;
      }
    }

    return { ...user, organization, role };
  }
}
