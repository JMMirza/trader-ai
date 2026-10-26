import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class SignUpUserDto {
  @ApiProperty({ example: 'Beginner', description: 'User’s trading experience level' })
  @IsNotEmpty()
  @IsString({ message: 'Experience must be a string' })
  readonly experience: string;

  @ApiProperty({ example: 'Daily', description: 'How often user trades' })
  @IsNotEmpty()
  @IsString({ message: 'Trading frequency must be a string' })
  readonly tradingFrequency: string;

  @ApiProperty({ example: 'Instagram Ad', description: 'Where the user heard about the platform' })
  @IsNotEmpty()
  @IsString({ message: 'Hear about us must be a string' })
  readonly hearAboutUs: string;

  @ApiProperty({ example: 'Long-term wealth building', description: 'User’s trading goal' })
  @IsNotEmpty()
  @IsString({ message: 'Trading goal must be a string' })
  readonly tradingGoal: string;

  @ApiProperty({ example: 'Moderate', description: 'User’s risk tolerance level' })
  @IsNotEmpty()
  @IsString({ message: 'Risk tolerance must be a string' })
  readonly riskTolerance: string;

  @ApiProperty({ example: '$5,000 - $10,000', description: 'Investment budget range' })
  @IsNotEmpty()
  @IsString({ message: 'Investment budget must be a string' })
  readonly investmentBudget: string;

  @ApiProperty({ example: '3-6 months', description: 'Expected time to see trading results' })
  @IsNotEmpty()
  @IsString({ message: 'Result wait time must be a string' })
  readonly resultWaitTime: string;

  @ApiProperty({ example: 'Sticking to strategy', description: 'Biggest trading challenge' })
  @IsNotEmpty()
  @IsString({ message: 'Trading challenge must be a string' })
  readonly tradingChallenge: string;

  @ApiProperty({ example: 'Achieve consistent profits', description: 'Main personal goal' })
  @IsNotEmpty()
  @IsString({ message: 'Goal must be a string' })
  readonly goal: string;

  @ApiPropertyOptional({ example: true, description: 'Whether user requires help' })
  @IsOptional()
  @IsBoolean({ message: 'isHelpRequired must be a boolean value' })
  readonly isHelpRequired?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Enable or disable push notifications' })
  @IsOptional()
  @IsBoolean({ message: 'Push notification must be a boolean value' })
  readonly pushNotification?: boolean;

  @ApiPropertyOptional({
    example: 'REF12345',
    description: 'Referral code (if provided by another user)',
  })
  @IsOptional()
  @IsString({ message: 'Referral code must be a string' })
  readonly referralCode?: string;
}
