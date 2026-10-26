import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Base, BaseSchema } from 'src/commons/schemas/abstract.schema';

export type AnalysisDocument = HydratedDocument<Analysis>;

@Schema()
export class FileType {
  @Prop({ required: false }) ext: string;
  @Prop({ required: false }) mime: string;
}

@Schema()
export class Picture {
  @Prop({ required: false }) uuid: string;
  @Prop({ required: false }) originalName: string;
  @Prop({ type: FileType, required: false }) fileType: FileType;
  @Prop({ required: false }) size: number;
  @Prop({ required: false }) encoding: string;
  @Prop({ required: false }) link: string;
}

@Schema()
export class StockInfo {
  @Prop({ required: false }) symbol: string;
  @Prop({ required: false }) name: string;
}

@Schema()
export class KeyInsights {
  @Prop({ required: false }) trend: string;
  @Prop({ required: false }) signal: string;
  @Prop({ required: false }) riskLevel: string;
  @Prop({ required: false }) volume: string;
}

@Schema()
export class GamePlan {
  @Prop({ required: false }) overview: string;
  @Prop({ required: false }) entryExitStrategy: string;
  @Prop({ required: false }) riskRewardAssessment: string;
}

@Schema()
export class MarketSentimentItem {
  @Prop({ required: false }) source: string;
  @Prop({ required: false }) bullishRating: number;
  @Prop({ required: false }) sentimentStatus: string;
  @Prop({ required: false }) newsSentiment: string;
  @Prop({ required: false }) analysisRating: number;
}

@Schema()
export class MarketSentiment {
  @Prop({ type: MarketSentimentItem, required: false }) twitter: MarketSentimentItem;
  @Prop({ type: MarketSentimentItem, required: false }) news: MarketSentimentItem;
  @Prop({ type: MarketSentimentItem, required: false }) analysts: MarketSentimentItem;
}

@Schema()
export class DetailedAnalysis {
  @Prop({ required: false }) technicalIndicators: string;
  @Prop({ required: false }) marketContext: string;
  @Prop({ required: false }) aiInsight: string;
}

@Schema({ timestamps: true })
export class Analysis extends Base {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId: Types.ObjectId;

  @Prop({ type: Picture, required: false })
  picture: Picture;

  @Prop({ type: StockInfo, required: false })
  stockInfo: StockInfo;

  @Prop({ type: KeyInsights, required: false })
  keyInsights: KeyInsights;

  @Prop({ required: false })
  supportLevel: number;

  @Prop({ required: false })
  resistanceLevel: number;

  @Prop({ required: false })
  score: number;

  @Prop({ required: false })
  currentPrice: number;

  @Prop({ required: false })
  estimatedReturnPercent: number;

  @Prop({ required: false })
  confidence: number;

  @Prop({ required: false })
  scoreStatus: string;

  @Prop({ type: GamePlan, required: false })
  gamePlan: GamePlan;

  @Prop({ type: MarketSentiment, required: false })
  marketSentiment: MarketSentiment;

  @Prop({ type: DetailedAnalysis, required: false })
  detailedAnalysis: DetailedAnalysis;

  @Prop({ required: false })
  analysisSummary: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
AnalysisSchema.add(BaseSchema);
AnalysisSchema.index({ userId: 1, createdAt: -1 });