// stock.controller.ts
import {
  Controller,
  Get,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StockService } from '../services';
import { DecryptTokenInterceptor } from 'src/interceptors';
import { DashboardDto } from '../dto/dashboard.dto';

@ApiTags('Stocks')
@ApiBearerAuth()
@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @UseInterceptors(DecryptTokenInterceptor)
  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashbard data' })
  async dashboardData(@Request() req: any, @Query() query: DashboardDto) {
    const user = req.user;
    return this.stockService.dashboardData(user, query);
  }
}
