import { SignupDto, SignUpUserDto } from 'src/modules/auth/dto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RefreshToken,
  RefreshTokenDocument,
  User,
  UserLogAndGoalHistory,
} from 'src/modules/user/schemas';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SocialSignupDto } from '../dto/socialSignUp.dto';
import { FirebaseStorageService, OpenAIService } from 'src/services';
import { SignUpUser } from 'src/modules/user/schemas/signupUsers.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(SignUpUser.name) private signupUserModel: Model<SignUpUser>,
    @InjectModel(UserLogAndGoalHistory.name)
    private userlogAndGoalHistoryModel: Model<UserLogAndGoalHistory>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private readonly firebaseStorageService: FirebaseStorageService,
  ) {}

  private createToken(user: any): string {
    const payload: JwtPayloadDto = {
      id: user._id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  generateOTP(digits: number): string {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp.toString().padStart(digits, '0');
  }

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

  async seedUser(signupDto: SignupDto) {
    const { email, password } = signupDto;
    const role = 'admin';
    const checkEmail = await this.getUser(undefined, email);
    if (checkEmail) {
      throw new BadRequestException(['User already exist']);
    }
    const referralCode = crypto.randomBytes(4).toString('hex');
    return await this.userModel.create({
      email: email.toLowerCase(),
      password,
      referralLink: referralCode,
      role,
      profileSetup: true,
    });
  }

  async socialLogin(body: SocialSignupDto) {
    const { email, socialId, socialType, signupUserId } = body;

    // ✅ Check if social ID already exists
    const userCheck: any = await this.userModel.findOne({ socialId });
    if (userCheck) {
      if (userCheck.socialType !== socialType) {
        throw new BadRequestException(['Social type mismatch.']);
      }

      const { accessToken, refreshToken } = await this.generateTokens(
        userCheck?._id,
        undefined,
        userCheck,
      );
      return {
        token: accessToken,
        refreshToken,
        user: await this.getUser(userCheck._id),
      };
    }

    // ✅ Check if email exists (link existing account)
    if (email) {
      const emailCheck: any = await this.userModel.findOne({
        email: email.toLowerCase(),
      });
      if (emailCheck) {
        if (emailCheck.socialType === socialType) {
          emailCheck.socialId = socialId;
          await emailCheck.save();
          const { accessToken, refreshToken } = await this.generateTokens(
            emailCheck?._id,
            undefined,
            emailCheck,
          );
          return {
            token: accessToken,
            refreshToken,
            user: await this.getUser(emailCheck._id),
          };
        } else {
          throw new BadRequestException([
            'Account already exists with different login method.',
          ]);
        }
      }
    }

    // ✅ Ensure user completed pre-signup onboarding
    if (!signupUserId) {
      throw new BadRequestException(['Please complete signup first.']);
    }

    const signupUser = await this.signupUserModel.findById(signupUserId);
    if (!signupUser) {
      throw new BadRequestException(['Please complete signup first.']);
    }

    // ✅ Generate referral code for the new user
    const referralCode = crypto.randomBytes(4).toString('hex');

    // ✅ Create a new user based on SignUpUser data
    const user: any = await this.userModel.create({
      email: email?.toLowerCase(),
      socialId,
      socialType,
      referralCode,
      role: 'customer',

      // --- Trading-related fields ---
      experience: signupUser.experience,
      tradingFrequency: signupUser.tradingFrequency,
      hearAboutUs: signupUser.hearAboutUs,
      tradingGoal: signupUser.tradingGoal,
      riskTolerance: signupUser.riskTolerance,
      investmentBudget: signupUser.investmentBudget,
      resultWaitTime: signupUser.resultWaitTime,
      tradingChallenge: signupUser.tradingChallenge,
      goal: signupUser.goal,
      isHelpRequired: signupUser.isHelpRequired,
      pushNotification: signupUser.pushNotification,

      // --- Referral and profile ---
      referredBy: signupUser.referredBy,
    });

    // ✅ Referral bonus handling
    if (signupUser.referredBy) {
      const referral = await this.userModel.findById(signupUser.referredBy);
      if (!referral) {
        throw new BadRequestException(['Invalid referral code']);
      }

      const bonus = Number(process.env.REFERRAL_BONUS || 0);
      if (isNaN(bonus)) {
        throw new Error(
          'REFERRAL_BONUS environment variable must be a valid number',
        );
      }

      referral.referralBonus += bonus;
      referral.referredUsers.push(user._id);
      await referral.save();
    }

    await this.userlogAndGoalHistoryModel.create({
      userId: user._id,
      currentBalance: 0,
      goalBalance: 0,
      cloak: '',
    })
    // ✅ Return token + user data
    const { accessToken, refreshToken } = await this.generateTokens(
      user?._id,
      undefined,
      user,
    );
    return {
      token: accessToken,
      refreshToken,
      user: await this.getUser(user._id),
    };
  }

  async create(body: SignUpUserDto) {
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
    } = body;

    let referredUser = null;

    // Validate referral code (if provided)
    if (referralCode) {
      const referral = await this.userModel.findOne({ referralCode });
      if (!referral) {
        throw new BadRequestException(['Invalid referral code']);
      }
      referredUser = referral._id;
    }

    const signUpUser = await this.signupUserModel.create({
      experience,
      tradingFrequency,
      hearAboutUs,
      tradingGoal,
      riskTolerance,
      investmentBudget,
      resultWaitTime,
      tradingChallenge,
      goal,
      isHelpRequired: isHelpRequired || false,
      pushNotification: pushNotification || false,
      referralCode: referralCode || '',
      referredBy: referredUser,
    });

    return signUpUser;
  }

  async generateTokens(userId: any, ipAddress?: string, user?: any) {
    // Generate access token
    const accessToken = this.createToken(user);

    // Generate refresh token
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');

    // Save refresh token to database
    const refreshToken = new this.refreshTokenModel({
      token: refreshTokenValue,
      userId,
      ipAddress,
    });

    await refreshToken.save();

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async refreshTokens(refreshTokenValue: string, ipAddress?: string) {
    // Find the refresh token in database
    const refreshToken = await this.refreshTokenModel.findOne({
      token: refreshTokenValue,
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user details
    const user = await this.userModel.findById(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke the current refresh token
    refreshToken.isRevoked = true;
    await refreshToken.save();

    // Generate new tokens
    return this.generateTokens(user._id.toString(), ipAddress, user);
  }
}
