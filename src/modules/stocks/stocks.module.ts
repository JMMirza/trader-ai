// stock.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { Stock, StockSchema } from './schema';
import { StockController } from './controllers';
import { StockService } from './services';
import { Analysis, AnalysisSchema } from '../openai/schema';
import { OpenAiService } from '../openai/services';
import { OpenAIModule } from '../openai';
import { FirebaseStorageService } from 'src/services';
import { UserLogAndGoalHistory, UserLogAndGoalHistorySchema } from '../user/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Stock.name, schema: StockSchema },
      { name: Analysis.name, schema: AnalysisSchema },
      { name: UserLogAndGoalHistory.name, schema: UserLogAndGoalHistorySchema },
    ]),
    OpenAIModule,
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [StockController],
  providers: [StockService, OpenAiService, FirebaseStorageService],
})
export class StockModule {}
