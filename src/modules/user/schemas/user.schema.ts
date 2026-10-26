import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, {
  HydratedDocument,
  Types,
  Schema as MongooseSchema,
} from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Base, BaseSchema } from 'src/commons/schemas/abstract.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends Base {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, default: '' })
  password: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: false })
  socialId: string;

  @Prop({ required: false })
  socialType: string;

  // --- New Trading-Related Fields ---

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

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  ])
  referredUsers: User[];

  @Prop({ required: false, default: 0 })
  referralBonus: number;

  @Prop({
    type: {},
    required: false,
    default: null,
  })
  profilePicture: {};

  @Prop({ required: false, default: [] })
  fcmTokens: string[];

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: false })
  isPremium: boolean;

  @Prop({ type: Date, required: false })
  premiumExpiry: Date;

  @Prop({ type: Date, default: Date.now })
  lastSeen: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// --- Hash Password Before Saving ---
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

// --- Password Validation Method ---
UserSchema.methods.validatePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// --- Extend with Base Schema ---
UserSchema.add(BaseSchema);
