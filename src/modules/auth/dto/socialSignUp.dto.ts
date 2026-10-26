import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';

export enum Type {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export class SocialSignupDto {
  @ApiPropertyOptional({
    example: 'muhammadmubeen12345@gmail.com',
    description: "User's email address (optional for Apple login)",
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  readonly email?: string;

  @ApiProperty({
    type: String,
    example: 'XXXXXXXXXXXXXXXX',
    description: 'Unique identifier returned by Google or Apple',
  })
  @IsString({ message: 'Social ID must be a string' })
  @IsNotEmpty({ message: 'Social ID is required' })
  readonly socialId: string;

  @ApiPropertyOptional({
    type: String,
    example: '683f3492bc696f3687325a77',
    description: 'Signup user ID (used if linked to a pre-signup record)',
  })
  @IsOptional()
  @IsString({ message: 'Signup user ID must be a string' })
  readonly signupUserId?: string;

  @ApiProperty({
    example: 'google',
    enum: Type,
    description: 'Type of social login (google or apple)',
  })
  @IsEnum(Type, { message: 'Invalid login type (must be google or apple)' })
  readonly socialType: Type;
}
