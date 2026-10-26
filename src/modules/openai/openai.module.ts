import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/modules/user/schemas';
import { UserModule } from '../user';
import { FirebaseStorageService, OpenAIService } from 'src/services';
import { OpenAiService } from './services';
import { OpenAiController } from './controllers';
import { Stock, StockSchema } from 'src/modules/stocks/schema';
import { Analysis, AnalysisSchema } from './schema';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Stock.name, schema: StockSchema },
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
    NestjsFormDataModule,
    UserModule,
  ],
  controllers: [OpenAiController],
  providers: [OpenAIService, FirebaseStorageService, OpenAiService, FirebaseStorageService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
