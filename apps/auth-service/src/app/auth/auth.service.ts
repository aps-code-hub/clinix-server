import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { LoginDto } from '../users/dto/login.dto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { HashingService } from './hashing/hashing.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly MAX_DEVICES =
    parseInt(this.configService.get('MAX_DEVICES'), 10) || 3;
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async registerUser(createUserPayload: CreateUserDto) {
    // 1. Hash password
    const hashedPassword = await this.hashingService.hash(
      createUserPayload.password
    );

    // 2. Create user with the hased password
    const user = await this.userService.create({
      ...createUserPayload,
      password: hashedPassword,
    });

    //3. return without password
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginPayload: LoginDto) {
    const user = await this.userService.findOneByEmail(loginPayload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingService.compare(
      loginPayload.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.roles,
      loginPayload.deviceId
    );

    const sessionInfo = await this.manageSession(
      user.id,
      loginPayload.deviceId,
      tokens.refreshToken
    );

    await this.userService.updateLastLogin(user.id);

    console.log('Checking Sessions', sessionInfo);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        status: user.status,
        lastLogin: user.lastLogin,
      },
      ...sessionInfo,
    };
  }

  async refreshTokens(refreshTokenPayload: RefreshTokenDto) {
    try {
      // verify incoming refresh token
      const payload = await this.jwtService.verifyAsync(
        refreshTokenPayload.refreshToken,
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        }
      );

      // check if session exists in db
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId: payload.sub,
          deviceId: payload.deviceId,
        },
      });
      if (!session) {
        throw new ForbiddenException('Session not found');
      }

      // Validate Token Hash
      const isTokenVerfified = await this.hashingService.compare(
        refreshTokenPayload.refreshToken,
        session.refreshTokenHash
      );
      if (!isTokenVerfified) {
        // Revoke all sessions for this user as non verified token
        await this.prisma.userSession.deleteMany({
          where: { userId: payload.sub },
        });
        throw new ForbiddenException('Access Denied: invalid refresh token');
      }

      // Rotate Tokens (Issue new ones)
      const user = await this.userService.findOneByEmail(payload.email);
      const newTokens = await this.generateTokens(
        user.id,
        user.email,
        user.roles,
        payload.deviceId
      );

      // Update Session with new Hash
      const newHash = await this.hashingService.hash(newTokens.refreshToken);
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: newHash,
          lastUsedAt: new Date(),
          expiresAt: await this.getRefreshTokenExpiry(),
        },
      });

      return newTokens;
    } catch (_error) {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  async logout(userId: string, deviceId: string) {
    await this.prisma.userSession.deleteMany({
      where: { userId, deviceId },
    });

    return {
      success: true,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles: string[],
    deviceId: string
  ) {
    const tokenPayload = {
      sub: userId,
      email,
      roles,
      deviceId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  private async manageSession(
    userId: string,
    deviceId: string,
    refreshToken: string
  ) {
    const refreshTokenHash = await this.hashingService.hash(refreshToken);
    let deviceRevoked = false;

    const activeSessions = await this.prisma.userSession.findMany({
      where: { userId: userId },
      orderBy: { lastUsedAt: 'asc' }, //oldest first
    });
    const existingSession = activeSessions.find(
      (session) => session.deviceId === deviceId
    );
    if (existingSession) {
      // re-use the session and update token
      await this.prisma.userSession.update({
        where: { id: existingSession.id },
        data: {
          refreshTokenHash,
          lastUsedAt: new Date(),
          expiresAt: await this.getRefreshTokenExpiry(),
        },
      });
    } else {
      if (activeSessions.length >= this.MAX_DEVICES) {
        // limit reached replace old session
        const oldestSession = activeSessions[0];
        await this.prisma.userSession.delete({
          where: { id: oldestSession.id },
        });
        deviceRevoked = true;
      }

      await this.prisma.userSession.create({
        data: {
          userId,
          deviceId,
          refreshTokenHash,
          expiresAt: await this.getRefreshTokenExpiry(),
        },
      });
    }

    return {
      deviceRevoked,
      activeSessions: activeSessions.length,
    };
  }

  private async getRefreshTokenExpiry() {
    const expires = new Date();
    expires.setDate(expires.getDate() + 5);
    return expires;
  }
}
