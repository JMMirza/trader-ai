import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Base, BaseSchema } from 'src/commons/schemas/abstract.schema';
export type UserLogAndGoalHistoryDocument = HydratedDocument<UserLogAndGoalHistory>;

@Schema()
export class UserLogAndGoalHistory extends Base {
  @Prop({ default: 0 })
  currentBalance: number;

  @Prop({ default: 0 })
  prevBalance: number;

  @Prop({ default: 0 })
  goalBalance: number;

  @Prop()
  cloak: String;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Types.ObjectId;
}

export const UserLogAndGoalHistorySchema =
  SchemaFactory.createForClass(UserLogAndGoalHistory);

// Extend with BaseSchema for common fields
UserLogAndGoalHistorySchema.add(BaseSchema);
