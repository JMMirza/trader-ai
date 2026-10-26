// stock.service.ts (FIXED: No duplicates + Daily history)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stock, StockDocument } from '../schema';
import { Analysis, AnalysisDocument } from 'src/modules/openai/schema';
import { DashboardDto } from '../dto/dashboard.dto';
import { UserLogAndGoalHistory } from 'src/modules/user/schemas';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(UserLogAndGoalHistory.name)
    private userlogAndGoalHistoryModel: Model<UserLogAndGoalHistory>,
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
  ) {}

  async dashboardData(user: any, query: DashboardDto) {
    const { date } = query;
    const logHistory = await this.userlogAndGoalHistoryModel.findOne({
      userId: new Types.ObjectId(user.id),
    });
    // Get all active analyses for the user
    const analyses = await this.analysisModel
      .find({
        userId: user.id,
        isDeleted: false,
        createdAt: {
          $gte: new Date(`${date}T00:00:00.000Z`),
          $lt: new Date(`${date}T23:59:59.999Z`),
        },
      })
      .sort({ createdAt: -1 })
      .lean();
    const top3Stocks = analyses.length > 0 ? analyses.slice(0, 3): [];

    return {
      summary: {
        totalEstimatedValue: Number(logHistory.currentBalance.toFixed(2)),
        estimatedReturnPercent:
          logHistory.prevBalance > 0
            ? Number(
                (
                  ((logHistory.currentBalance - logHistory.prevBalance) /
                    logHistory.prevBalance) *
                  100
                ).toFixed(2),
              )
            : 0,
        holdTime: logHistory.cloak,
        savedStocks: analyses.length,
      },
      top3Stocks,
    };
  }
}
