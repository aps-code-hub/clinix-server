import {
  Post,
  Body,
  Request,
  HttpCode,
  UseGuards,
  HttpStatus,
  Controller,
  Get,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from '../users/dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

import { JwtAuthGuard } from '@clinix/shared/auth';

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

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: { userId: string; deviceId: string }) {
    const { userId, deviceId } = req;
    return this.authService.logout(userId, deviceId);
  }
}
