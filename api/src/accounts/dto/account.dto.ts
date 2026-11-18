import { ApiProperty } from '@nestjs/swagger';
import { AccountType, Currency } from '@prisma/client';

export class AccountDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'MB-1001-0001' })
  accountNumber!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  type!: AccountType;

  @ApiProperty({ enum: Currency, example: Currency.USD })
  currency!: Currency;

  @ApiProperty({
    example: '12500.00',
    description: 'Decimal string with 2 places',
  })
  balance!: string;
}
