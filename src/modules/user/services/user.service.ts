import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserActivityHistory, UserLogAndGoalHistory } from '../schemas';
import { UpdateUserLogAndGoalHistoryDto, UserProfileDto } from '../dto';
import { FirebaseStorageService } from 'src/services';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserActivityHistory.name)
    private userActivityRecordModel: Model<UserActivityHistory>,
    @InjectModel(UserLogAndGoalHistory.name)
    private userlogAndGoalHistoryModel: Model<UserLogAndGoalHistory>,
    private readonly firebaseStorageService: FirebaseStorageService,
  ) {}

  async getUser(userId?: string, email?: string) {
    // Choose query based on provided parameter
    const query = email
      ? this.userModel.findOne({ email: email.toLowerCase() })
      : this.userModel.findById(userId);

    // Exclude sensitive or unnecessary fields
    const result: any = await query
      .select(
        '-password -socialId -isDeleted -referredUsers -__v -createdAt -updatedAt -fcmTokens',
      )
      .lean()
      .exec();

    if (!result) {
      throw new NotFoundException(['User not found']);
    }

    // ✅ Generate signed URL for profile picture (if available)
    if (result.profilePicture && result.profilePicture.uuid) {
      const profilePicLink = await this.firebaseStorageService.getSignedUrl(
        `users/${result.profilePicture.uuid}`,
      );
      result.profilePicture.link = profilePicLink;
    }

    // ✅ You can still compute referral stats if needed later
    // e.g. count of referred users or total referral bonus
    result.totalReferrals = result.referredUsers?.length || 0;

    // ✅ (Optional) Include referral info or clean-up if needed
    if (result.referredBy) {
      const referrer = await this.userModel
        .findById(result.referredBy)
        .select('name email referralCode')
        .lean();
      result.referredBy = referrer || null;
    }

    return result;
  }

  async update(user: any, body: UserProfileDto) {
    const userCheck = await this.userModel.findById(user.id);
    if (!userCheck) {
      throw new BadRequestException(['No user found']);
    }

    const {
      experience,
      tradingFrequency,
      hearAboutUs,
      tradingGoal,
      riskTolerance,
      investmentBudget,
      resultWaitTime,
      tradingChallenge,
      goal,
      isHelpRequired,
      pushNotification,
      referralCode,
      fcmToken,
    } = body;

    // ✅ Handle referral
    let referral: any;
    if (referralCode) {
      referral = await this.userModel.findOne({ referralCode });
      if (!referral) {
        throw new BadRequestException(['Invalid referral code']);
      }

      const bonus = Number(process.env.REFERRAL_BONUS || 0);
      if (isNaN(bonus)) {
        throw new Error('REFERRAL_BONUS environment variable must be a valid number');
      }

      referral.referralBonus += bonus;
      referral.referredUsers.push(user.id);
      await referral.save();
    }

    // ✅ Handle FCM Tokens
    let fcmTokens = userCheck?.fcmTokens?.length > 0 ? [...userCheck.fcmTokens] : [];
    if (fcmToken && !fcmTokens.includes(fcmToken)) {
      fcmTokens.push(fcmToken);
    }

    // ✅ Update user
    await this.userModel.findByIdAndUpdate(
      userCheck._id,
      {
        experience,
        tradingFrequency,
        hearAboutUs,
        tradingGoal,
        riskTolerance,
        investmentBudget,
        resultWaitTime,
        tradingChallenge,
        goal,
        isHelpRequired,
        fcmTokens,
        referredBy: referralCode ? referral._id : userCheck.referredBy,
        pushNotification: pushNotification ?? userCheck.pushNotification,
        profileSetup: true,
      },
      { new: true },
    );

    // ✅ Return updated user with signed URLs, etc.
    return await this.getUser(user.id);
  }

  async updateLastSeen(userId) {
    return this.userModel.findByIdAndUpdate(userId, {
      lastSeen: new Date(Date.now()),
    });
  }

  async checkUsersIds(userIds, field) {
    const users = [];
    let flag = false;
    await Promise.all(
      userIds.map(async (user) => {
        const userCheck = await this.getUser(user);

        if (!userCheck) {
          flag = true;
        } else {
          if (!users.includes(user)) {
            users.push(user);
          }
        }
      }),
    );

    if (flag) {
      throw new BadRequestException([`One of the ${field} is invalid`]);
    }
    return users;
  }

  async deleteUser(userId) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(['User not found']);
    }
    await user.deleteOne();
    return { message: 'User deleted successfully' };
  }

  async updateStreak(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(['User not found']);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastUserCheckInRecord: any =
      await this.userActivityRecordModel.findOne({ userId: user?._id });
    if (lastUserCheckInRecord) {
      const lastDate = new Date(lastUserCheckInRecord.lastActivityDate || 0);
      console.log(lastUserCheckInRecord.lastActivityDate, lastDate);
      lastDate.setHours(0, 0, 0, 0);
      const diff =
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        lastUserCheckInRecord.streakCount += 1;
      } else if (diff > 1) {
        lastUserCheckInRecord.streakCount = 1;
      }

      lastUserCheckInRecord.totalDaysPracticed += 1;
      lastUserCheckInRecord.lastActivityDate = new Date();
      lastUserCheckInRecord.activityHistory.push(new Date());

      await lastUserCheckInRecord.save();
    } else {
      const newRecord = new this.userActivityRecordModel({
        userId: user._id,
        streakCount: 1,
        totalDaysPracticed: 1,
        lastActivityDate: new Date(),
        activityHistory: [new Date()],
      });
      await newRecord.save();
    }
    return 'Streak updated successfully';
  }

  async getUsersActivityRecords(userId, type: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(['User not found']);
    }
    if (type == 'all') {
      return await this.userActivityRecordModel
        .find()
        .populate({
          path: 'userId',
          select: 'name', // only include 'name' field
        })
        .sort({ streakCount: -1 })
        .limit(10);
    }
    return await this.userActivityRecordModel.findOne({ userId: user._id });
  }

  async getUserLogAndGoalHistory(userId) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(['User not found']);
    }
    return await this.userlogAndGoalHistoryModel.findOne({ userId: user._id });
  }

  async updateloghistory(userId:any, dto: UpdateUserLogAndGoalHistoryDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(['User not found']);
    }
    const { currentBalance, goalBalance, cloak } = dto;
    const history = await this.userlogAndGoalHistoryModel.findOne({
      userId: user._id,
    })
    const prevHistory = history ? history.currentBalance : 0
    await this.userlogAndGoalHistoryModel.findOneAndUpdate(
      { userId: user._id },
      {
        currentBalance,
        goalBalance,
        cloak,
        prevBalance: prevHistory
      },
      { upsert: true, new: true },
    );

    return await this.userlogAndGoalHistoryModel.findOne({ userId: user._id });
  }
}
