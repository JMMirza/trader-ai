// create-chat.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsFileSizeValid } from 'src/commons/dto/file-size.dto';

export class CreateChatDto {

  @ApiProperty({ example: 'How do I improve my focus?' })
  @IsString()
  content: string;


  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Item picture to upload',
    required: false,
  })
  @IsOptional()
  @IsFileSizeValid({
    message: 'File size exceeds the maximum allowed limit of 35 MB',
  })
  readonly image: string;
}
