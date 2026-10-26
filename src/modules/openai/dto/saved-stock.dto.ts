import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class FileTypeDto {
  @ApiProperty({ example: 'png' })
  @IsString()
  ext: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  mime: string;
}

class PictureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty()
  @IsString()
  originalName: string;

  @ApiProperty({ type: FileTypeDto })
  @ValidateNested()
  @Type(() => FileTypeDto)
  fileType: FileTypeDto;

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsString()
  encoding: string;

  @ApiProperty()
  @IsString()
  link: string;
}

class StockInfoDto {
  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiProperty()
  @IsString()
  name: string;
}

class KeyInsightsDto {
  @ApiProperty({ example: 'Neutral' })
  @IsString()
  trend: string;

  @ApiProperty({ example: 'Wait' })
  @IsString()
  signal: string;

  @ApiProperty({ example: 'Medium' })
  @IsString()
  riskLevel: string;

  @ApiProperty({ example: 'Medium' })
  @IsString()
  volume: string;
}

class GamePlanDto {
  @ApiProperty()
  @IsString()
  overview: string;

  @ApiProperty()
  @IsString()
  entryExitStrategy: string;

  @ApiProperty()
  @IsString()
  riskRewardAssessment: string;
}

class MarketSentimentItemDto {
  @ApiProperty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsNumber()
  bullishRating: number;

  @ApiProperty()
  @IsString()
  sentimentStatus: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  newsSentiment: string;

  @ApiProperty()
  @IsNumber()
  analysisRating: number;
}

class MarketSentimentDto {
  @ApiProperty({ type: MarketSentimentItemDto })
  @ValidateNested()
  @Type(() => MarketSentimentItemDto)
  twitter: MarketSentimentItemDto;

  @ApiProperty({ type: MarketSentimentItemDto })
  @ValidateNested()
  @Type(() => MarketSentimentItemDto)
  news: MarketSentimentItemDto;

  @ApiProperty({ type: MarketSentimentItemDto })
  @ValidateNested()
  @Type(() => MarketSentimentItemDto)
  analysts: MarketSentimentItemDto;
}

class DetailedAnalysisDto {
  @ApiProperty()
  @IsString()
  technicalIndicators: string;

  @ApiProperty()
  @IsString()
  marketContext: string;

  @ApiProperty()
  @IsString()
  aiInsight: string;
}

export class CreateAnalysisDto {
  @ApiProperty({ type: PictureDto })
  @ValidateNested()
  @Type(() => PictureDto)
  picture: PictureDto;

  @ApiProperty({ type: StockInfoDto })
  @ValidateNested()
  @Type(() => StockInfoDto)
  stockInfo: StockInfoDto;

  @ApiProperty({ type: KeyInsightsDto })
  @ValidateNested()
  @Type(() => KeyInsightsDto)
  keyInsights: KeyInsightsDto;

  @ApiProperty()
  @IsNumber()
  supportLevel: number;

  @ApiProperty()
  @IsNumber()
  resistanceLevel: number;

  @ApiProperty()
  @IsNumber()
  score: number;

  @ApiProperty()
  @IsNumber()
  confidence: number;

  @ApiProperty()
  @IsNumber()
  estimatedReturnPercent: number;

  @ApiProperty()
  @IsNumber()
  currentPrice: number;

  @ApiProperty()
  @IsString()
  scoreStatus: string;

  @ApiProperty({ type: GamePlanDto })
  @ValidateNested()
  @Type(() => GamePlanDto)
  gamePlan: GamePlanDto;

  @ApiProperty({ type: MarketSentimentDto })
  @ValidateNested()
  @Type(() => MarketSentimentDto)
  marketSentiment: MarketSentimentDto;

  @ApiProperty({ type: DetailedAnalysisDto })
  @ValidateNested()
  @Type(() => DetailedAnalysisDto)
  detailedAnalysis: DetailedAnalysisDto;

  @ApiProperty()
  @IsString()
  analysisSummary: string;
}