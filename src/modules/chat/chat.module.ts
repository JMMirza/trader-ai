import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/modules/user/schemas';
import { UserModule } from '../user';
import { FirebaseStorageService, OpenAIService } from 'src/services';
import { ChatService } from './services';
import { ChatController } from './controllers';
import { Chat, ChatSchema } from './schemas';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
    ]),
    NestjsFormDataModule,
    UserModule,
  ],
  controllers: [ChatController],
  providers: [OpenAIService, FirebaseStorageService, ChatService],
  exports: [],
})
export class ChatModule {}
