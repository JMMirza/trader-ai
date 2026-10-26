import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DashboardDto {
@ApiPropertyOptional({
  example: '2025-12-02',
  description: 'Transaction/date filter - format: YYYY-MM-DD',
})
@IsOptional()
@IsDateString({ strict: true })
readonly date?: string;
}