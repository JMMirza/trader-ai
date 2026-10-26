import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserLogAndGoalHistoryDto {
  @ApiPropertyOptional({ example: 1350.5 })
  @IsOptional()
  @IsNumber()
  readonly currentBalance?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  readonly goalBalance?: number;

  @ApiPropertyOptional({ example: 'updated-cloak' })
  @IsOptional()
  @IsString()
  readonly cloak?: string;
}