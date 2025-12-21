import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('deviceId') deviceId: string,
    @Body('userId') userId: string
  ) {
    return this.authService.logout(userId, deviceId);
  }
}
