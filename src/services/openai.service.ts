import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,
    });
  }

  async generateText(prompt: string): Promise<string> {
    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    return res.choices[0].message.content;
  }

  async chatText(prompt: string): Promise<string> {
    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4', // or 'gpt-3.5-turbo'
      messages: [{ role: 'user', content: prompt }],
    });

    return chatCompletion.choices[0]?.message?.content ?? '';
  }

  async chat(prompt: string, file?: any): Promise<string> {
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are a helpful stock market and finance assistant. Analyze images when provided.',
      },
    ];

    if (file && file.buffer) {
      const base64 = file.buffer.toString('base64');
      const mimeType = file.busBoyMimeType || file.fileType?.mime || 'image/png';

      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt || 'Analyze this image.' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-4o'
      messages,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  async analyzeImage(
    imageUrl: string,
    question: string,
    formatExample: string,
  ): Promise<any> {
    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an image-analysis assistant. ' +
            'Always respond ONLY in valid JSON format. ' +
            'Use camelCase for all keys. ' +
            'For the same question, always return the same JSON structure to ensure consistency for database parsing. ' +
            "For image analysis questions, return a JSON object with 'analysisResult' and 'details' fields. " +
            'Do not include explanations outside the JSON object. ' +
            'Ensure the response is complete and all brackets are closed. ' +
            'This is the model image link whose overall rating would be 94 95 please compare the images with this model image' +
            ''+
            `Here is the required JSON response format for this question:\n${formatExample}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: question,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });
    return JSON.parse(chatCompletion.choices[0]?.message?.content ?? '{}');
  }
}
