import { Controller, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SignupDto, SignUpUserDto } from 'src/modules/auth/dto';
import { AuthService } from 'src/modules/auth/services';
import { Body, Post } from '@nestjs/common';
import { SocialSignupDto } from '../dto/socialSignUp.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { RefreshTokenDto } from '../dto/jwt-payload.dto';
@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('seed-admin')
  @ApiExcludeEndpoint() // This specific endpoint will be hidden in Swagger
  async seedAdmin(@Body() signupDto: SignupDto) {
    return await this.authService.seedUser(signupDto);
  }

  @Post('social-login')
  async socialLogin(@Body() body: SocialSignupDto): Promise<any> {
    const userSignup = await this.authService.socialLogin(body);
    return userSignup;
  }

  @Post('signup')
  @ApiOperation({ summary: 'The API that creates/updates user profile' })
  @ApiResponse({
    status: 201,
    description: 'User profile created successfully.',
  })
  async create(@Body() userProfileDto: SignUpUserDto) {
    return this.authService.create(userProfileDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
    description: 'Generate a new access token and refresh token pair using a valid refresh token'
  })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Request() req: any,
  ) {
    const { refreshToken } = body;

    const ipAddress = req.ip || req.connection.remoteAddress;

    return this.authService.refreshTokens(refreshToken, ipAddress);
  }
}
