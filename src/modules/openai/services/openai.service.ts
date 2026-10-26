import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirebaseStorageService, OpenAIService } from 'src/services';
import { AnalyzeStockDto, CreateAnalysisDto } from '../dto';
import { Stock, StockDocument } from 'src/modules/stocks/schema';
import { Analysis, AnalysisDocument } from '../schema';
import { randomUUID } from 'crypto';

@Injectable()
export class OpenAiService {
  constructor(
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
    private readonly firebaseStorageService: FirebaseStorageService,
    private readonly openAiAPI: OpenAIService,
  ) {}

  async saveSavedStock(user, data: CreateAnalysisDto) {
    const existing = await this.analysisModel.findOne({
      userId: user.id,
      'stockInfo.symbol': data.stockInfo.symbol,
      isDeleted: false,
    });
    if (existing) {
      await existing.deleteOne();
    }
    const savedStock = new this.analysisModel({
      userId: user.id,
      ...data,
    });

    return savedStock.save();
  }

  async findAllSavedStockByUser(userId: string) {
    return this.analysisModel
      .find({ userId, isDeleted: false })
      .sort({ createdAt: -1 });
  }

  async softDelete(userId: string, id: string) {
    const res = await this.analysisModel.deleteOne({ _id: id, userId });
    if (!res) throw new NotFoundException();
    return res;
  }

  private async analyzeStockFromImage(
    link: string,
  ): Promise<any> {
    const prompt = this.getImageAnalysisPrompt();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: link,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    // Check for API errors
    if (data.error) {
      throw new BadRequestException([
        `OpenAI API Error: ${data.error.message}`,
      ]);
    }

    const content = data.choices[0].message.content;
    let parsedResult;

    try {
      parsedResult = this.parseOpenAIResponse(content);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(['Failed to parse AI response as JSON']);
    }

    // Validate required stock information
    if (
      !parsedResult.stockInfo ||
      !parsedResult.stockInfo.symbol ||
      !parsedResult.stockInfo.name
    ) {
      throw new BadRequestException([
        'Unable to extract stock information (symbol and name) from the image. Please ensure the image clearly shows the stock ticker and company name.',
      ]);
    }

    return parsedResult;
  }

  private getImageAnalysisPrompt(): string {
    return `
  You are a senior quantitative analyst analyzing stock price charts. Extract insights from the provided chart image and deliver precise, data-driven analysis in exact JSON format.

  INPUT CONTEXT:
  Analysis Date: ${new Date().toISOString().split('T')[0]}

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 1: CHART TYPE IDENTIFICATION (CRITICAL)
  ═══════════════════════════════════════════════════════════════════════════════

  FIRST, identify the chart type present in the image:
  - Candlestick chart (shows OHLC data with colored candles)
  - Line chart (shows continuous price line)
  - Bar chart (shows OHLC with vertical bars)
  - Area chart (filled area under price line)
  - Mixed/Hybrid chart

  Adapt your analysis method based on chart type detected.

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 2: STOCK IDENTIFICATION (MANDATORY)
  ═══════════════════════════════════════════════════════════════════════════════

  Extract the following basic information directly from visible text in the image:

  REQUIRED FIELDS:
  1. Stock Symbol (ticker): Look for uppercase letters (e.g., TSLA, AAPL, MSFT, NVDA)
    Check: Top header, title area, corner labels, chart legend

  2. Company Name: Look for full company name (e.g., Tesla Inc., Apple Inc.)
    Check: Below symbol, in header, subtitle area

  VALIDATION:
  - If symbol OR name is unclear/missing → Return: {"error": "Stock symbol or name not detectable in image. Please provide a clearer image with visible ticker symbol."}
  - If partially visible → Extract what's available and note uncertainty in confidence score

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 3: PRICE DATA EXTRACTION
  ═══════════════════════════════════════════════════════════════════════════════

  Current Price Detection (Priority Order):
  1. Last visible data point on the chart (rightmost point)
  2. Price labels on Y-axis near the latest point
  3. Numeric indicators showing "Last", "Close", or "Current Price"
  4. Top/bottom of latest candlestick/bar (if applicable)

  Price Range Analysis:
  - Identify Y-axis scale (look for labeled price levels)
  - Determine visible high and low over the chart period
  - Calculate approximate current price based on chart position

  For Non-Candlestick Charts:
  - Line charts: Use the endpoint of the line
  - Area charts: Use the top boundary of filled area at rightmost point
  - Bar charts: Use the closing tick of the last bar

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 4: SUPPORT & RESISTANCE LEVELS
  ═══════════════════════════════════════════════════════════════════════════════

  Support & Resistance Levels (MUST BE ACTUAL PRICE AMOUNTS):
  CRITICAL: Support and Resistance MUST be specific dollar amounts (e.g., $3,010 or $3,180), NOT percentages or descriptive text.

  Detection Priority:
  1. Look for "Support Level" and "Resistance Level" labels with dollar amounts in the image
  2. Horizontal lines drawn on the chart with price labels (e.g., "$3,010", "$3,180")
  3. Price levels where bounces occurred multiple times
  4. Psychological round numbers visible on Y-axis (e.g., $100, $150, $200)
  5. Previous highs/lows visible on the chart with price markers

  Extraction Method:
  - Support Level: Extract the exact dollar amount shown next to "Support Level" label or lowest labeled horizontal line
  - Resistance Level: Extract the exact dollar amount shown next to "Resistance Level" label or highest labeled horizontal line
  - If multiple support/resistance levels visible, use the nearest/most recent ones
  - Format as decimal numbers (e.g., 3010.0, 3180.0) - no dollar signs in JSON output

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 5: MARKET SENTIMENT ANALYSIS
  ═══════════════════════════════════════════════════════════════════════════════

  Sentiment Sources (look for these in the image):

  Twitter/X Sentiment:
  - Look for section labeled "Twitter", "X", or social media icon
  - Extract:
    * bullishRating (0-100): Percentage or score shown
    * sentimentStatus: "Bullish", "Neutral", or "Bearish"
    * newsSentiment: "Above price" or "Below price" if indicated
    * analysisRating (0-100): Technical analysis score for this source

  News Sentiment:
  - Look for "News" section or newspaper icon
  - Extract:
    * bullishRating (0-100): Percentage or score shown
    * sentimentStatus: "Bullish", "Neutral", or "Bearish"
    * newsSentiment: "Above price" or "Below price" if indicated
    * analysisRating (0-100): Technical analysis score for this source

  Analyst Sentiment:
  - Look for "Analysts" section or rating indicators
  - Extract:
    * bullishRating (0-100): Percentage or score shown
    * sentimentStatus: "Bullish", "Neutral", or "Bearish"
    * analysisRating (0-100): Technical analysis score for this source

  CRITICAL - analysisRating Extraction:
  The analysisRating field is CRITICAL and should NEVER be 0 unless truly not visible.
  - Look for numerical scores, percentages, or rating indicators (0-100 scale)
  - May be shown as: "Analysis: 85", "Rating: 72", or as a progress bar/gauge
  - Check for star ratings and convert (e.g., 4/5 stars = 80)
  - Look for text indicators and convert: "Strong" = 80-90, "Moderate" = 60-75, "Weak" = 40-55
  - If multiple sentiment sources visible, each should have its own analysisRating

  If Sentiment Panels Not Visible:
  - Infer from price action and set reasonable ratings:
    * Strong uptrend: bullishRating 70-85, analysisRating 75-85
    * Moderate uptrend: bullishRating 55-70, analysisRating 60-75
    * Sideways: bullishRating 45-55, analysisRating 50-60
    * Downtrend: bullishRating 20-40, analysisRating 40-55

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 6: STOCK SCORE & KEY INSIGHTS EXTRACTION (CRITICAL)
  ═══════════════════════════════════════════════════════════════════════════════

  STOCK SCORE (0-100):
  CRITICAL: Look for a "Score" indicator in the image, typically shown as:
  - "Current State Score: 95" or similar label
  - A numerical score (0-100) representing overall stock strength
  - May be labeled as "Analysis Score", "Stock Score", or just "Score"

  Extraction Priority:
  1. Look for explicit "Score:" label with number (e.g., "Score: 95")
  2. Check for "Current State" section with score indicator
  3. Look for progress bar or gauge with numerical value
  4. If multiple scores visible, use the main/overall score

  If Score Not Visible:
  - Calculate based on combined factors: (Trend strength 40% + Technical indicators 30% + Momentum 20% + Risk level 10%)
  - Strong bullish setup: 80-95
  - Moderate bullish: 60-79
  - Neutral: 40-59
  - Bearish: 20-39
  - Strong bearish: 0-19

  SCORE STATUS:
  Based on the score value, assign a status descriptor:
  - Score 90-100: "Exceptional"
  - Score 80-89: "Very Strong"
  - Score 70-79: "Strong"
  - Score 60-69: "Good"
  - Score 50-59: "Ideal"
  - Score 40-49: "Moderate"
  - Score 30-39: "Weak"
  - Score 20-29: "Poor"
  - Score 0-19: "Very Poor"

  KEY INSIGHTS EXTRACTION (DO NOT CREATE - EXTRACT ONLY):
  CRITICAL: Look for a "Key Insights" section or panel in the image. Extract the EXACT text shown for each field:

  1. TREND:
    - Look for label: "Trend", "Trend Direction", or trend icon
    - MUST be one of these exact values: "Bullish", "Neutral", "Bearish"
    - Extract from visible text or icon indicators (↑ = Bullish, → = Neutral, ↓ = Bearish)
    - If not visible: Determine from chart pattern and use one of the three values

  2. SIGNAL:
    - Look for label: "Signal", "Action", "Strategy", or signal icon
    - MUST be one of these exact values: "Entry", "Avoid", "Wait"
    - Extract from visible text or icon indicators
    - Common variations to map:
      * "Buy", "Enter", "Entry" → "Entry"
      * "Sell", "Exit", "Avoid" → "Avoid"
      * "Hold", "Wait", "Watch" → "Wait"
    - If not visible: Based on trend and risk, assign appropriate signal

  3. RISK LEVEL:
    - Look for label: "Risk Level", "Risk", or risk icon
    - MUST be one of these exact values: "Low", "Medium", "High"
    - Extract exact text shown
    - If variations found, map to closest: "Moderate" → "Medium", "Very High" → "High"
    - If not visible: Calculate based on volatility and trend clarity

  4. VOLUME:
    - Look for label: "Volume", "Volume Status", or volume icon
    - MUST be one of these exact values: "Low", "Medium", "High"
    - Extract from visible volume indicator or description
    - If comparing to average: "Above average" → "High", "Average" → "Medium", "Below average" → "Low"
    - If not visible: Compare visible volume bars - recent bars taller than average = "High"

  VALIDATION RULES:
  - trend: ONLY "Bullish", "Neutral", or "Bearish" - no other values allowed
  - signal: ONLY "Entry", "Avoid", or "Wait" - no other values allowed
  - riskLevel: ONLY "Low", "Medium", or "High" - no other values allowed
  - volume: ONLY "Low", "Medium", or "High" - no other values allowed

  IMPORTANT:
  - These insights should be EXTRACTED from visible text panels when available
  - If Key Insights panel exists, map the visible text to the required exact values
  - If not visible, determine based on chart analysis but MUST use exact values specified above

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 7: RETURN CALCULATION
  ═══════════════════════════════════════════════════════════════════════════════

  Estimated Return Calculation:
  Based on the visible trend, support/resistance levels, and technical indicators, estimate the potential return percentage for the investment.

  Method:
  - Strong uptrend with bullish indicators: 15-30% estimated return
  - Moderate uptrend: 8-15% estimated return
  - Sideways/Neutral: 3-8% estimated return
  - Downtrend: -5% to 5% estimated return
  - Strong downtrend: Negative returns

  Consider:
  - Distance from support to resistance
  - Trend strength and momentum
  - Technical indicator confirmations
  - Overall score and sentiment

  Format: Single decimal number (e.g., 18.5 for 18.5% expected return)

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 8: CONFIDENCE SCORE
  ═══════════════════════════════════════════════════════════════════════════════

  Confidence Score (80-98):
  Rate your confidence in this analysis based on image clarity and data availability.

  Scoring Guidelines:
  - 93-98: Perfect clarity - all data visible, strong signals, clear chart
  - 88-92: Very good - most indicators visible, clear trend
  - 83-87: Good - sufficient data, some indicators missing
  - 80-82: Adequate - limited data, some uncertainty

  Factors Affecting Confidence:
  - Chart clarity and resolution
  - Visibility of support/resistance levels
  - Presence of technical indicators
  - Clear trend direction
  - Score and sentiment data visibility

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 9: GAME PLAN
  ═══════════════════════════════════════════════════════════════════════════════

  Create a concise trading strategy based on the analysis:

  Overview (2-3 sentences):
  - Summarize the current market position
  - State the primary opportunity or concern
  - Mention key levels to watch

  Entry/Exit Strategy (2-3 sentences):
  - Suggest optimal entry points (e.g., "Enter near support at $3,010")
  - Define exit targets (e.g., "Take profit at resistance $3,180")
  - Include stop-loss suggestions if relevant

  Risk/Reward Assessment (1-2 sentences):
  - Evaluate the risk-to-reward ratio
  - State whether the setup favors bulls or bears
  - Mention any risk factors to consider

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 10: DETAILED ANALYSIS
  ═══════════════════════════════════════════════════════════════════════════════

  Provide comprehensive written analysis in three sections:

  Technical Indicators (2-3 sentences):
  - Describe the key technical indicators observed (RSI, MACD, EMAs, Volume)
  - Explain what they signal about momentum and trend strength
  - Note any divergences or confirmations

  Market Context (2-3 sentences):
  - Describe the overall market environment visible in the chart
  - Mention trend direction, volatility, and price action
  - Reference support/resistance levels and their significance

  AI Insight (2-3 sentences):
  - Provide synthesized conclusion combining all factors
  - State the most probable outcome based on visible data
  - Offer strategic perspective on the opportunity

  ═══════════════════════════════════════════════════════════════════════════════
  PHASE 11: ANALYSIS SUMMARY
  ═══════════════════════════════════════════════════════════════════════════════

  Create a concise 2-3 sentence summary that captures:
  - The stock's current position and trend
  - The key opportunity or risk identified
  - The recommended action based on the analysis

  This should be a clear, actionable takeaway for the investor.

  ═══════════════════════════════════════════════════════════════════════════════
  OUTPUT REQUIREMENTS
  ═══════════════════════════════════════════════════════════════════════════════

  CRITICAL RULES:
  1. Base ALL values on the actual image - no placeholder data
  2. Round all numbers to 1 decimal place (except integers like scores)
  3. Never leave fields empty - use appropriate defaults if needed
  4. If chart type is unclear, describe what you see and provide best estimate
  5. Return ONLY the JSON object - no markdown, no backticks, no explanatory text

  FINAL CHECKLIST BEFORE RETURNING JSON:
  ✓ Stock symbol and name extracted from image
  ✓ Current price estimated from rightmost chart point
  ✓ Support/resistance levels extracted as DOLLAR AMOUNTS (e.g., 3010.0, 3180.0)
  ✓ Stock score (0-100) extracted from "Score:" label or calculated
  ✓ Score status assigned based on score value (e.g., "Ideal", "Very Strong")
  ✓ Market sentiment analysisRating NEVER left as 0 (must be 0-100 for each source)
  ✓ Key Insights use ONLY allowed values:
    - trend: "Bullish", "Neutral", or "Bearish"
    - signal: "Entry", "Avoid", or "Wait"
    - riskLevel: "Low", "Medium", or "High"
    - volume: "Low", "Medium", or "High"
  ✓ Estimated return percent calculated based on analysis
  ✓ Game plan created with overview, entry/exit, and risk/reward
  ✓ Detailed analysis completed for technical indicators, market context, and AI insight
  ✓ Analysis summary written (2-3 sentences)
  ✓ Confidence score (80-98) reflects data quality
  ✓ All numerical values rounded to 1 decimal place
  ✓ JSON is valid and properly formatted
  ✓ No markdown formatting or backticks in output

  JSON STRUCTURE TO FILL:
  {
    "stockInfo": {
      "symbol": "",
      "name": ""
    },
    "currentPrice": 0.0,
    "supportLevel": 0.0,
    "resistanceLevel": 0.0,
    "score": 0,
    "scoreStatus": "",
    "estimatedReturnPercent": 0.0,
    "confidence": 0,
    "keyInsights": {
      "trend": "",
      "signal": "",
      "riskLevel": "",
      "volume": ""
    },
    "marketSentiment": {
      "twitter": {
        "source": "X (Twitter)",
        "bullishRating": 0,
        "sentimentStatus": "",
        "newsSentiment": "",
        "analysisRating": 0
      },
      "news": {
        "source": "News Station",
        "bullishRating": 0,
        "sentimentStatus": "",
        "newsSentiment": "",
        "analysisRating": 0
      },
      "analysts": {
        "source": "Analysis Rating",
        "bullishRating": 0,
        "sentimentStatus": "",
        "analysisRating": 0
      }
    },
    "gamePlan": {
      "overview": "",
      "entryExitStrategy": "",
      "riskRewardAssessment": ""
    },
    "detailedAnalysis": {
      "technicalIndicators": "",
      "marketContext": "",
      "aiInsight": ""
    },
    "analysisSummary": ""
  }

  FIELD-SPECIFIC INSTRUCTIONS:
  - "score": Must be 0-100 integer, extracted from "Score:" label or calculated
  - "scoreStatus": Must be one of: "Exceptional", "Very Strong", "Strong", "Good", "Ideal", "Moderate", "Weak", "Poor", "Very Poor"
  - "supportLevel": Must be dollar amount (e.g., 3010.0), NOT text
  - "resistanceLevel": Must be dollar amount (e.g., 3180.0), NOT text
  - "currentPrice": Must be dollar amount extracted from chart
  - "estimatedReturnPercent": Expected return percentage (e.g., 18.5)
  - "confidence": Must be 80-98 integer
  - "marketSentiment.*.analysisRating": Must be 0-100 integer, NEVER leave as 0 unless truly not visible
  - "keyInsights.trend": ONLY "Bullish", "Neutral", or "Bearish"
  - "keyInsights.signal": ONLY "Entry", "Avoid", or "Wait"
  - "keyInsights.riskLevel": ONLY "Low", "Medium", or "High"
  - "keyInsights.volume": ONLY "Low", "Medium", or "High"

  ERROR HANDLING:
  If the image is unclear, return appropriate error:
  {
    "error": "Specific description of issue",
    "suggestion": "What would help (e.g., 'Please provide image with visible ticker symbol')"
  }

  Common error scenarios:
  - Stock symbol not visible → Request clearer image
  - Chart too blurry → Request higher resolution
  - No price axis visible → Cannot determine accurate prices
  - Empty/blank image → Request valid chart image

  Return only the JSON object now.
  `.trim();
  }

  // Usage example
  async analyzeInvestment(user: any, dto: AnalyzeStockDto): Promise<any> {
    console.time('analyzeInvestment-total2'); // Start total timer

    const { image } = dto;

    console.time('uploadFile');
    const picture: any = await this.firebaseStorageService.uploadFile(
      image,
      randomUUID(),
      'stocks',
    );
    console.timeEnd('uploadFile');

    console.time('getSignedUrl');
    const pictureLink = await this.firebaseStorageService.getSignedUrl(
      `stocks/${picture.uuid}`,
    );
    console.timeEnd('getSignedUrl');

    console.time('analyzeStockFromImage'); // This is usually the slow one
    const response = await this.analyzeStockFromImage(pictureLink);
    console.timeEnd('analyzeStockFromImage');

    picture.link = pictureLink;

    console.timeEnd('analyzeInvestment-total2'); // Total time

    return { picture, ...response };
  }
  private parseOpenAIResponse(raw: string): any {
    try {
      const cleaned = raw
        .trim()
        .replace(/```json|```/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch (error) {
      throw new Error('OpenAI JSON parse failed: ' + raw);
    }
  }
}
