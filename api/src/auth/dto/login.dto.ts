import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin',
    description: 'Username or email; both are unique and case-insensitive.',
  })
  @IsString()
  @MinLength(3)
  identifier!: string;

  @ApiProperty({ example: '11111111', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
