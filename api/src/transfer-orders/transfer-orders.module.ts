import { Module } from '@nestjs/common';
import { TransfersModule } from '../transfers/transfers.module.js';
import { TransferOrdersController } from './transfer-orders.controller.js';
import { TransferOrdersService } from './transfer-orders.service.js';

@Module({
  imports: [TransfersModule],
  controllers: [TransferOrdersController],
  providers: [TransferOrdersService],
})
export class TransferOrdersModule {}
