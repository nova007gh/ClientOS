import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@clientos/database';
import type { RegisterInput, LoginInput } from '@clientos/validation';
import { registerSchema, loginSchema } from '@clientos/validation';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(input: RegisterInput) {
    const parsed = registerSchema.parse(input);

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);

    const user = await prisma.user.create({
      data: {
        email: parsed.email.toLowerCase(),
        passwordHash,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        status: 'ACTIVE',
      },
    });

    const org = await prisma.organization.create({
      data: {
        name: `${parsed.firstName}'s Workspace`,
        slug: `${parsed.firstName.toLowerCase()}-${parsed.lastName.toLowerCase()}-${Date.now().toString(36).slice(-4)}`,
        ownerId: user.id,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    const tokens = await this.generateTokens(user.id, org.id);

    return {
      user: this.sanitizeUser(user),
      organization: org,
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const parsed = loginSchema.parse(input);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const member = await prisma.organizationMember.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { organization: true },
    });

    const tokens = await this.generateTokens(user.id, member?.organizationId);

    return {
      user: this.sanitizeUser(user),
      organization: member?.organization ?? null,
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-secret-change-me'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException('User not found');

      const member = await prisma.organizationMember.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { organization: true },
      });

      const tokens = await this.generateTokens(user.id, member?.organizationId);

      return {
        user: this.sanitizeUser(user),
        organization: member?.organization ?? null,
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) return;

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'reset' },
      { expiresIn: '1h' },
    );

    // In production: send email with reset link
    // For now: return token (dev only)
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, password: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-secret-change-me'),
      });

      if (payload.type !== 'reset') {
        throw new BadRequestException('Invalid token type');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });

      return { message: 'Password reset successfully' };
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const memberships = await prisma.organizationMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { organization: true },
    });

    return {
      user: this.sanitizeUser(user),
      organizations: memberships.map((m) => ({
        ...m.organization,
        role: m.role,
      })),
    };
  }

  private async generateTokens(userId: string, orgId?: string) {
    const payload = { sub: userId, org: orgId };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, ...rest } = user;
    return rest;
  }
}
