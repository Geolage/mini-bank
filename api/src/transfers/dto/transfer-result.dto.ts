import { ApiProperty } from '@nestjs/swagger';

export type TransferResultStatus =
  'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED' | 'CANCELLED';

export class TransferResultDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'TXN-9c1e2d3c-4b5a-6987-8d4e-4b6f3f2b8c1a' })
  reference!: string;

  @ApiProperty({
    enum: ['COMPLETED', 'PENDING_APPROVAL', 'REJECTED', 'CANCELLED'],
    example: 'COMPLETED',
  })
  status!: TransferResultStatus;
}
