import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { HabitService } from "./habit.service";
import { PrismaService } from "../infrastructure/prisma.service";

const scrypt = promisify(scryptCallback);
const accessTokenTtlSeconds = 15 * 60;
const refreshTokenTtlDays = 30;
const resetTokenTtlMinutes = 30;

export interface AuthUserDto {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly habits: HabitService
  ) {}

  async signup(email: string, password: string, displayName?: string): Promise<AuthSessionDto> {
    const normalizedEmail = normalizeEmail(email);
    await this.assertEmailAvailable(normalizedEmail);
    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        displayName: displayName?.trim() || null,
        createdAt: now,
        updatedAt: now,
        passwordCredential: {
          create: {
            passwordHash: await hashSecret(password),
            createdAt: now,
            updatedAt: now
          }
        },
        identities: {
          create: {
            id: randomUUID(),
            provider: "password",
            subject: normalizedEmail,
            email: normalizedEmail,
            createdAt: now,
            updatedAt: now
          }
        }
      }
    });
    return this.issueSession(toAuthUser(user));
  }

  async login(email: string, password: string): Promise<AuthSessionDto> {
    const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(email) }, include: { passwordCredential: true } });
    if (!user?.passwordCredential || !(await verifySecret(password, user.passwordCredential.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    return this.issueSession(toAuthUser(user));
  }

  async social(provider: "google" | "apple", idToken: string): Promise<AuthSessionDto> {
    const identity = provider === "google" ? await verifyGoogleToken(idToken) : await verifyAppleToken(idToken);
    const now = new Date();
    const existing = await this.prisma.authIdentity.findUnique({ where: { provider_subject: { provider, subject: identity.subject } }, include: { user: true } });
    if (existing) {
      return this.issueSession(toAuthUser(existing.user));
    }
    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: identity.email ? normalizeEmail(identity.email) : null,
        displayName: identity.displayName ?? null,
        createdAt: now,
        updatedAt: now,
        identities: {
          create: {
            id: randomUUID(),
            provider,
            subject: identity.subject,
            email: identity.email ? normalizeEmail(identity.email) : null,
            createdAt: now,
            updatedAt: now
          }
        }
      }
    });
    return this.issueSession(toAuthUser(user));
  }

  async refresh(refreshToken: string): Promise<AuthSessionDto> {
    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findFirst({ where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: true } });
    if (!session) {
      throw new UnauthorizedException("Invalid refresh token.");
    }
    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date(), updatedAt: new Date() } });
    return this.issueSession(toAuthUser(session.user));
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date(), updatedAt: new Date() } });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user) {
      return;
    }
    const token = randomBytes(32).toString("base64url");
    await this.prisma.passwordResetToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: addMinutes(new Date(), resetTokenTtlMinutes),
        createdAt: new Date()
      }
    });
    // Local MVP email adapter: replace with SMTP/provider delivery before production.
    console.log(`[Habiflow] Password reset token for ${user.email}: ${token}`);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const reset = await this.prisma.passwordResetToken.findFirst({ where: { tokenHash: hashToken(token), usedAt: null, expiresAt: { gt: new Date() } } });
    if (!reset) {
      throw new BadRequestException("Invalid or expired reset token.");
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.passwordCredential.upsert({
        where: { userId: reset.userId },
        create: { userId: reset.userId, passwordHash: await hashSecret(password), createdAt: now, updatedAt: now },
        update: { passwordHash: await hashSecret(password), updatedAt: now }
      }),
      this.prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: now } }),
      this.prisma.refreshSession.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now, updatedAt: now } })
    ]);
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User was not found.");
    }
    return toAuthUser(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async claimGuestData(userId: string, deviceId: string): Promise<{ claimed: number }> {
    return { claimed: await this.habits.claimGuestData(deviceId, userId) };
  }

  verifyAccessToken(token: string): { sub: string } {
    return verifyJwt(token);
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException("Email is already registered.");
    }
  }

  private async issueSession(user: AuthUserDto): Promise<AuthSessionDto> {
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshSession.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: addDays(new Date(), refreshTokenTtlDays),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return { user, accessToken: signJwt({ sub: user.id }, accessTokenTtlSeconds), refreshToken };
  }
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    throw new BadRequestException("Enter a valid email.");
  }
  return normalized;
}

async function hashSecret(secret: string): Promise<string> {
  if (secret.length < 8) {
    throw new BadRequestException("Password must have at least 8 characters.");
  }
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(secret, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const [, salt, hash] = stored.split(":");
  const derived = (await scrypt(secret, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "base64url");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function jwtSecret(): string {
  return process.env.JWT_SECRET ?? "dev-only-change-me";
}

function signJwt(payload: { sub: string }, ttlSeconds: number): string {
  const header = encodeJwtPart({ alg: "HS256", typ: "JWT" });
  const body = encodeJwtPart({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const signature = createHmac("sha256", jwtSecret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token: string): { sub: string } {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) {
    throw new UnauthorizedException("Invalid access token.");
  }
  const expected = createHmac("sha256", jwtSecret()).update(`${header}.${body}`).digest("base64url");
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new UnauthorizedException("Invalid access token.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { sub?: string; exp?: number };
  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException("Expired access token.");
  }
  return { sub: payload.sub };
}

function encodeJwtPart(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMinutes(date: Date, minutes: number): Date {
  const next = new Date(date);
  next.setUTCMinutes(next.getUTCMinutes() + minutes);
  return next;
}

function toAuthUser(user: { id: string; email: string | null; displayName: string | null }): AuthUserDto {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

async function verifyGoogleToken(idToken: string): Promise<{ subject: string; email?: string; displayName?: string }> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) {
    throw new UnauthorizedException("Invalid Google token.");
  }
  const payload = (await response.json()) as { sub?: string; email?: string; name?: string };
  if (!payload.sub) {
    throw new UnauthorizedException("Invalid Google token.");
  }
  return { subject: payload.sub, email: payload.email, displayName: payload.name };
}

async function verifyAppleToken(idToken: string): Promise<{ subject: string; email?: string; displayName?: string }> {
  const [, body] = idToken.split(".");
  if (!body) {
    throw new UnauthorizedException("Invalid Apple token.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { sub?: string; email?: string; iss?: string };
  if (!payload.sub || payload.iss !== "https://appleid.apple.com") {
    throw new UnauthorizedException("Invalid Apple token.");
  }
  return { subject: payload.sub, email: payload.email };
}
