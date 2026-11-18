import { Module } from '@nestjs/common';
import { PayeesController } from './payees.controller.js';
import { PayeesService } from './payees.service.js';

@Module({
  controllers: [PayeesController],
  providers: [PayeesService],
})
export class PayeesModule {}
