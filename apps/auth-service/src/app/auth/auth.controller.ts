import {
  Post,
  Body,
  Request,
  HttpCode,
  UseGuards,
  HttpStatus,
  Controller,
} from '@nestjs/common';

import { JwtAuthGuard } from '@clinix/shared/auth';

import { AuthService } from './auth.service';
import { LoginDto } from '../users/dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    roles: string[];
    deviceId: string;
  };
}

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserPayload: CreateUserDto) {
    return this.authService.registerUser(createUserPayload);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginPayload: LoginDto) {
    return this.authService.login(loginPayload);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenPayload: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenPayload);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: AuthenticatedRequest) {
    const { userId, deviceId } = req.user;
    return this.authService.logout(userId, deviceId);
  }
}
