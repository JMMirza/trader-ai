import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from '../services';
import { CreateChatDto } from '../dto';
import { DecryptTokenInterceptor } from 'src/interceptors';
import { FormDataRequest } from 'nestjs-form-data';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseInterceptors(DecryptTokenInterceptor)
  @Post()
  @FormDataRequest()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Send message, receive OpenAI reply' })
  create(@Request() request: any, @Body() dto: CreateChatDto) {
    const user = request.user;
    return this.chatService.create(user.id, dto);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Get()
  @ApiOperation({ summary: 'Get full conversation history' })
  findByUser(@Request() request: any) {
    const user = request.user;
    return this.chatService.findByUser(user.id);
  }

  @UseInterceptors(DecryptTokenInterceptor)
  @Patch(':id/report')
  @ApiOperation({ summary: 'Mark a chat message as reported' })
  report(@Param('id') id: string) {
    return this.chatService.report(id);
  }
}
