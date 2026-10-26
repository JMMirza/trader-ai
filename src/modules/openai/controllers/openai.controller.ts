import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OpenAiService } from '../services';
import { DecryptTokenInterceptor } from 'src/interceptors';
import { AnalysisResponseDto, AnalyzeStockDto, CreateAnalysisDto } from '../dto';
import { FormDataRequest } from 'nestjs-form-data';

@ApiTags('OpenAI')
@ApiBearerAuth()
@Controller()
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) { }


  @UseInterceptors(DecryptTokenInterceptor)
  @Post('analyze')
  @FormDataRequest()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Analyze investment: return & success chance' })
  @ApiResponse({ status: 200, type: AnalysisResponseDto })
  async analyze(@Body() dto: AnalyzeStockDto, @Request() req: any) {
    const user = req.user;
    return this.openAiService.analyzeInvestment(user, dto);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Post('save-strategy')
  @ApiOperation({ summary: 'Save AI analysis as strategy' })
  @ApiResponse({
    status: 201,
    description: 'Strategy saved',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async saveStrategy(
    @Request() req,
    @Body() dto: CreateAnalysisDto,
  ): Promise<any> {
    return this.openAiService.saveSavedStock(req.user, dto);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Get('get-saved-strategies')
  @ApiOperation({ summary: 'Get all saved strategies' })
  @ApiResponse({
    status: 200,
    description: 'List of saved strategies',
  })
  async getSaved(@Request() req): Promise<any[]> {
    return this.openAiService.findAllSavedStockByUser(req.user.id);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Delete('/soft-delete-stock/:id')
  @ApiOperation({ summary: 'Unsave / soft delete strategy' })
  @ApiResponse({ status: 200, description: 'Strategy unsaved' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async unsave(@Request() req, @Param('id') id: string): Promise<{ message: string }> {
    await this.openAiService.softDelete(req.user.id, id);
    return { message: 'Strategy unsaved' };
  }
}
