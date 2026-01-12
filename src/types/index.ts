// 产品类型
export type ProductType = 
  | 'vanilla' 
  | 'asian' 
  | 'fcn' 
  | 'accumulator' 
  | 'decumulator'
  | 'trs';

// 期权类型
export type OptionType = 'call' | 'put';

// 标的资产
export interface Underlying {
  id: string;           // 标的ID（唯一标识）
  name: string;         // 标的名称（如：AAPL, 000001.SZ等）
  spotPrice: number;    // 现货价格
  volatility: number;   // 波动率（年化）
  symbol?: string;      // 交易代码（可选）
}

// 基础参数（单标的）
export interface BaseParams {
  underlying: Underlying; // 标的资产
  strikePrice: number;    // 执行价格
  riskFreeRate: number;   // 无风险利率（年化，如0.05表示5%）
  timeToMaturity: number; // 到期时间（年）
}

// 期权方向
export type OptionDirection = 'buy' | 'sell';

// 行权方式
export type ExerciseStyle = 'european' | 'american';

// 交易货币
export type Currency = 'CNY' | 'USD' | 'HKD';

// 香草期权参数
export interface VanillaParams {
  // 标的资产
  underlying: Underlying;
  
  // 期权类型
  optionType: OptionType;           // 期权类型：看涨/看跌
  direction?: OptionDirection;      // 买卖方向：买入/卖出（默认买入）
  exerciseStyle?: ExerciseStyle;    // 行权方式：欧式/美式（默认欧式）
  
  // 日期参数
  startDate?: string;               // 起始日（格式：YYYY-MM-DD）
  expiryDate?: string;              // 到期日（格式：YYYY-MM-DD）
  valuationDate?: string;           // 估值日（格式：YYYY-MM-DD）
  timeToMaturity: number;           // 到期时间（年，自动计算：估值日到到期日的天数/365）
  
  // 价格参数
  initialPrice: number;             // 期初价格（标的资产在起始日的价格）
  strikePricePercent: number;       // 行权价格百分比（相对于期初价格，如105表示105%）
  strikePrice: number;              // 行权价格（自动计算：期初价格 × 行权价格百分比%）
  
  // 交易参数
  currency?: Currency;              // 交易货币（默认CNY）
  contractSize: number;             // 期权股数（每份合约对应的标的资产数量）
  notional: number;                 // 名义本金（= 期权股数 × 期初价格）
  
  // 市场参数
  riskFreeRate: number;             // 无风险利率（年化，如0.05表示5%）
  dividendYield?: number;           // 分红率（年化，如0.03表示3%，默认0）
  impliedVolatility?: number;       // 隐含波动率（可选，如果提供则优先使用，否则使用标的资产的波动率）
}

// 亚式期权参数
export interface AsianParams extends BaseParams {
  optionType: OptionType;
  averagingPeriods: number; // 平均化期间数
  averagingType: 'arithmetic' | 'geometric'; // 平均类型
}

// FCN参数（支持最多4个标的）
export interface FCNParams {
  notional: number;        // 名义本金
  couponRate: number;      // 票息率（年化）
  barrier: number;         // 敲出障碍
  knockInBarrier?: number; // 敲入障碍（可选）
  underlyings: Underlying[]; // 标的资产数组（最多4个）
  riskFreeRate: number;
  timeToMaturity: number;
  observationDates: number; // 观察日数量
  correlation?: number[][]; // 标的之间的相关系数矩阵（可选）
}

// Accumulator/Decumulator参数
export interface AccumulatorParams {
  notional: number;        // 名义本金
  underlying: Underlying; // 标的资产
  strikePrice: number;     // 执行价格
  upperBarrier: number;    // 上限障碍
  lowerBarrier: number;    // 下限障碍
  riskFreeRate: number;
  timeToMaturity: number;
  observationFrequency: number; // 观察频率（每月/每周等）
  multiplier: number;      // 杠杆倍数
}

// TRS (Total Return Swap) 总收益互换参数
export interface TRSParams {
  notional: number;              // 名义本金
  underlying: Underlying;        // 标的资产
  riskFreeRate: number;          // 无风险利率（年化）
  swapRate: number;              // 互换利率（年化，固定利率方支付的利率）
  timeToMaturity: number;        // 到期时间（年）
  paymentFrequency: number;      // 支付频率（每年支付次数，如12表示每月支付）
  dividendYield?: number;        // 分红率（年化，默认0）
  initialPrice?: number;         // 初始价格（可选，默认使用标的资产的现货价格）
  direction?: 'receive' | 'pay'; // 方向：receive表示接收标的收益，pay表示支付标的收益（默认receive）
  correlation?: number;          // 与利率的相关系数（可选，用于更精确的定价）
}

// 定价结果
export interface PricingResult {
  price: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  // 香草期权额外指标
  intrinsicValue?: number;
  timeValue?: number;
  pricePerShare?: number;
  pricePerContract?: number;
  notional?: number;
  contractSize?: number;
  initialPrice?: number;
  exerciseStyle?: ExerciseStyle;
  currency?: Currency;
  strikePricePercent?: number;
  startDate?: string;
  expiryDate?: string;
  valuationDate?: string;
  // TRS额外指标
  swapRate?: number;
  paymentFrequency?: number;
  [key: string]: number | string | undefined;
}

// 历史计算结果
export interface HistoryRecord {
  id: string;
  timestamp: Date;
  productType: ProductType;
  params: any;
  result: PricingResult;
}

