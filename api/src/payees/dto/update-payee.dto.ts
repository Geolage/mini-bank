import { PartialType } from '@nestjs/swagger';
import { CreatePayeeDto } from './create-payee.dto.js';

export class UpdatePayeeDto extends PartialType(CreatePayeeDto) {}
