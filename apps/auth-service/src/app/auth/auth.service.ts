import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { HashingService } from './hashing/hashing.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService
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

    await this.userService.updateLastLogin(user.id);

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      accessToken: await this.jwtService.signAsync(tokenPayload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        status: user.status,
        lastLogin: user.lastLogin,
      },
    };
  }
}
