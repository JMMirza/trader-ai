import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsFileSizeValid } from 'src/commons/dto/file-size.dto';

export class AnalyzeStockDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Item picture to upload',
  })
  @IsNotEmpty()
  @IsFileSizeValid({
    message: 'File size exceeds the maximum allowed limit of 35 MB',
  })
  readonly image: string;
}

export class AnalysisResponseDto {
  @ApiProperty({ description: 'Estimated annual return %' })
  estimatedReturnPercent: number;

  @ApiProperty({ description: 'Success probability % (0-100)' })
  successChancePercent: number;

  @ApiPropertyOptional({ description: 'If symbol given: current price' })
  currentPrice?: number;

  @ApiPropertyOptional({ description: 'If symbol given: 1Y target price' })
  targetPrice1Y?: number;

  @ApiPropertyOptional({ description: 'If symbol given: 4Y target price' })
  targetPrice4Y?: number;

  @ApiPropertyOptional({ description: 'Recommendation' })
  recommendation?: string;

  @ApiProperty({ description: 'Risk-adjusted confidence score' })
  confidence: number;
}
