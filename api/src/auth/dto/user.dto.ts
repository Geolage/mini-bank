import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserDto {
  @ApiProperty({ example: '6f1c2f5e-5f1e-4c43-9a4e-2f5b8a1c9d01' })
  id!: string;

  @ApiProperty({ example: 'admin' })
  username!: string;

  @ApiProperty({ example: 'Admin' })
  name!: string;

  @ApiProperty({ example: 'admin@minibank.dev' })
  email!: string;

  @ApiProperty({ enum: Role, example: Role.OPERATOR })
  role!: Role;
}
