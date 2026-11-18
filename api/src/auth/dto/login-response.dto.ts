import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto.js';

export class LoginResponseDto {
  @ApiProperty({ description: 'Bearer token for the Authorization header' })
  accessToken!: string;

  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
