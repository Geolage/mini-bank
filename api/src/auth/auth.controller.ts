import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AuthService } from './auth.service.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UserDto } from './dto/user.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Exchange a username or email and password for a JWT',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      username: { value: { identifier: 'admin', password: '11111111' } },
      email: {
        value: { identifier: 'admin@minibank.dev', password: '11111111' },
      },
    },
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated user' })
  @ApiOkResponse({ type: UserDto })
  me(@Req() request: Request & { user: AuthenticatedUser }): UserDto {
    const { id, username, name, email, role } = request.user;
    return { id, username, name, email, role };
  }
}
