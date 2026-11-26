import { Module } from '@nestjs/common';
import { TransferLedgerService } from './transfer-ledger.service.js';
import { TransfersController } from './transfers.controller.js';
import { TransfersService } from './transfers.service.js';

@Module({
  controllers: [TransfersController],
  providers: [TransfersService, TransferLedgerService],
  exports: [TransferLedgerService],
})
export class TransfersModule {}
