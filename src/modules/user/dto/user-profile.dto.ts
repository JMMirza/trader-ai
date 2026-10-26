import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export enum TradingExperience {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
}

export enum RiskTolerance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum InvestmentGoal {
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  PASSIVE_INCOME = 'passive_income',
}

export class UserProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString({ message: 'Name must be a string' })
  readonly name: string;

  @ApiProperty({
    example: 'Long-term wealth building',
    description: 'User’s trading goal',
  })
  @IsNotEmpty()
  @IsString({ message: 'Trading goal must be a string' })
  readonly tradingGoal: string;

  @ApiPropertyOptional({
    example: 'beginner',
    enum: TradingExperience,
    description: 'User trading experience level',
  })
  @IsOptional()
  @IsEnum(TradingExperience, {
    message: 'Experience must be one of beginner, intermediate, expert',
  })
  readonly experience?: TradingExperience;

  @ApiPropertyOptional({
    example: 'weekly',
    description: 'How often user trades (e.g., daily, weekly, monthly)',
  })
  @IsOptional()
  @IsString({ message: 'Trading frequency must be a string' })
  readonly tradingFrequency?: string;

  @ApiPropertyOptional({
    example: 'Instagram Ad',
    description: 'How user heard about us',
  })
  @IsOptional()
  @IsString({ message: 'Hear about us must be a string' })
  readonly hearAboutUs?: string;

  @ApiPropertyOptional({
    example: 'long_term',
    enum: InvestmentGoal,
    description: 'Trading goal of the user',
  })
  @IsOptional()
  @IsEnum(InvestmentGoal, {
    message: 'Goal must be one of short_term, long_term, passive_income',
  })
  readonly goal?: InvestmentGoal;

  @ApiPropertyOptional({
    example: 'medium',
    enum: RiskTolerance,
    description: 'User risk tolerance level',
  })
  @IsOptional()
  @IsEnum(RiskTolerance, {
    message: 'Risk tolerance must be one of low, medium, high',
  })
  readonly riskTolerance?: RiskTolerance;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Investment budget amount in USD',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Investment budget must be a number' })
  readonly investmentBudget?: number;

  @ApiPropertyOptional({
    example: '3 months',
    description: 'How long user is willing to wait for results',
  })
  @IsOptional()
  @IsString({ message: 'Result wait time must be a string' })
  readonly resultWaitTime?: string;

  @ApiPropertyOptional({
    example: 'Struggles to stay consistent',
    description: 'User trading challenge or issue',
  })
  @IsOptional()
  @IsString({ message: 'Trading challenge must be a string' })
  readonly tradingChallenge?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the user needs help or coaching',
  })
  @IsOptional()
  @IsBoolean({ message: 'isHelpRequired must be a boolean value' })
  readonly isHelpRequired?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Allow push notifications for updates',
  })
  @IsOptional()
  @IsBoolean({ message: 'Push notification must be a boolean value' })
  readonly pushNotification?: boolean;

  @ApiPropertyOptional({
    example: 'ABCD1234',
    description: 'Referral code of another user',
  })
  @IsOptional()
  @IsString({ message: 'Referral code must be a string' })
  readonly referralCode?: string;

  @ApiPropertyOptional({
    example: 'fcm_token_12345',
    description: 'FCM token for push notifications',
  })
  @IsOptional()
  @IsString({ message: 'FCM token must be a string' })
  readonly fcmToken?: string;
}
