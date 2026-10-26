// stock.schema.ts (FINAL + NEW FIELDS)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { Base, BaseSchema } from 'src/commons/schemas/abstract.schema';

export type StockDocument = HydratedDocument<Stock>;

class StockPriceHistory {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  price: number;

  @Prop()
  change?: number;

  @Prop()
  changePercent?: number;

  @Prop({ required: true })  // Volume per day in history
  volume: number;
}

@Schema({ timestamps: true })
export class Stock extends Base {
  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  exchange: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  type: string;

  // Current live data
  @Prop({ required: true })
  price: number;

  @Prop()
  change?: number;

  @Prop()
  changePercent?: number;

  @Prop()
  openPrice?: number;

  @Prop()
  highPrice?: number;

  @Prop()
  lowPrice?: number;

  @Prop({ required: true })  // Current day volume
  volume: number;

  @Prop({ required: true })  // Raw volume number (for calculations)
  rawVolume: number;

  @Prop()  // Formatted: "103.5M"
  volumeDisplay?: string;

  @Prop()
  previousClose?: number;

  @Prop()
  marketCap?: number;

  @Prop()
  sector?: string;

  // Full 30-day chart data (exactly like screenshot)
  @Prop({ type: { data: [{ date: String, price: Number }] }, _id: false })
  priceChart: {
    data: { date: string; price: number }[];
  };

  // Daily historical prices (last 30 days)
  @Prop({ type: [StockPriceHistory], default: [] })
  priceHistory: StockPriceHistory[];
}

export const StockSchema = SchemaFactory.createForClass(Stock);
StockSchema.add(BaseSchema);

// Indexes
StockSchema.index({ symbol: 1 });
StockSchema.index({ price: -1 }); // for trending
StockSchema.index({ 'priceHistory.date': -1 });
StockSchema.index({ symbol: 1, 'priceHistory.date': 1 }, { unique: true });