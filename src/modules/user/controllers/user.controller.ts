import { UserService } from 'src/modules/user/services';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DecryptTokenInterceptor } from 'src/interceptors';
import { UpdateUserLogAndGoalHistoryDto, UserProfileDto } from '../dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(DecryptTokenInterceptor)
  @Post('set-profile')
  @ApiOperation({ summary: 'The API that creates/updates user profile' })
  @ApiResponse({
    status: 201,
    description: 'User profile created successfully.',
  })
  async create(
    @Request() request: any,
    @Body() userProfileDto: UserProfileDto,
  ) {
    const user = request.user;
    return this.userService.update(user, userProfileDto);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Get('get-profile')
  @ApiOperation({
    summary: 'The API that get user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Request fetched successfully.',
  })
  async getUser(@Request() request: any) {
    const user = request.user;
    return this.userService.getUser(user.id);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Get('add-activity-history')
  @ApiOperation({
    summary: 'The API that creates user activity history',
  })
  @ApiResponse({
    status: 200,
    description: 'Streak updated successfully',
  })
  async updateUserStreak(@Request() request: any) {
    const user = request.user;
    return this.userService.updateStreak(user.id);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Get('get-activity-history')
  @ApiOperation({
    summary: 'The API that get user activity history',
  })
  @ApiResponse({
    status: 200,
    description: 'Streak fetched successfully',
  })
  async getSpecificUserActivity(@Request() request: any) {
    const user = request.user;
    return this.userService.getUsersActivityRecords(user.id, 'user_record');
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Get('leaderboard')
  @ApiOperation({
    summary: 'The API that get leaderboard records',
  })
  @ApiResponse({
    status: 200,
    description: 'Records fetched successfully',
  })
  async getLeaderBoardData(@Request() request: any) {
    const user = request.user;
    return this.userService.getUsersActivityRecords(user.id, 'all');
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Delete('delete-user')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'User not found.' })
  deleteUser(@Request() request: any) {
    const user = request.user;
    return this.userService.deleteUser(user.id);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Get('user-log-goal')
  @ApiOperation({ summary: 'Get current user log and goal history' })
  @ApiResponse({ status: 400, description: 'User not found' })
  async getMyLogAndGoalHistory(@Request() req: any) {
    const userId = req.user.id;
    return this.userService.getUserLogAndGoalHistory(userId);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Patch('user-log-goal')
  @ApiOperation({ summary: 'Update current user log and goal history' })
  @ApiResponse({ status: 400, description: 'User not found' })
  async updateMyLogAndGoalHistory(
    @Request() req: any,
    @Body() dto: UpdateUserLogAndGoalHistoryDto,
  ) {
    const userId = req.user.id;
    return this.userService.updateloghistory(userId, dto);
  }
}
