import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Base, BaseSchema } from 'src/commons/schemas/abstract.schema';

export type SignUpUserDocument = HydratedDocument<SignUpUser>;

@Schema()
export class SignUpUser extends Base {
  @Prop({ required: false, default: '' })
  experience: string;

  @Prop({ required: false, default: '' })
  tradingFrequency: string;

  @Prop({ required: false, default: '' })
  hearAboutUs: string;

  @Prop({ required: false, default: '' })
  tradingGoal: string;

  @Prop({ required: false, default: '' })
  riskTolerance: string;

  @Prop({ required: false, default: '' })
  investmentBudget: string;

  @Prop({ required: false, default: '' })
  resultWaitTime: string;

  @Prop({ required: false, default: '' })
  tradingChallenge: string;

  @Prop({ required: false, default: '' })
  goal: string;

  @Prop({ required: false, default: false })
  isHelpRequired: boolean;

  @Prop({ required: false, default: false })
  pushNotification: boolean;

  @Prop({ required: false, default: '' })
  referralCode: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  referredBy: Types.ObjectId;
}

export const SignUpUserSchema = SchemaFactory.createForClass(SignUpUser);

// Extend with BaseSchema for common fields
SignUpUserSchema.add(BaseSchema);
