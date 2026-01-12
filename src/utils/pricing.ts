import type { 
  VanillaParams, 
  AsianParams, 
  FCNParams, 
  AccumulatorParams,
  TRSParams,
  PricingResult
} from '../types';

/**
 * 标准正态分布累积分布函数（CDF）
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * 标准正态分布概率密度函数（PDF）
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * 美式期权定价（使用二叉树模型 - Cox-Ross-Rubinstein）
 */
function priceAmericanOption(
  spotPrice: number,
  strikePrice: number,
  riskFreeRate: number,
  timeToMaturity: number,
  volatility: number,
  dividendYield: number,
  optionType: 'call' | 'put',
  steps: number = 100
): { price: number; delta: number; gamma: number; theta: number; vega: number; rho: number } {
  const dt = timeToMaturity / steps;
  const u = Math.exp(volatility * Math.sqrt(dt));
  const d = 1 / u;
  const r = riskFreeRate - dividendYield;
  const p = (Math.exp(r * dt) - d) / (u - d);
  const discount = Math.exp(-riskFreeRate * dt);

  // 构建股价树
  const stockTree: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    stockTree[i] = [];
    for (let j = 0; j <= i; j++) {
      stockTree[i][j] = spotPrice * Math.pow(u, i - j) * Math.pow(d, j);
    }
  }

  // 构建期权价值树
  const optionTree: number[][] = [];
  optionTree[steps] = [];
  for (let j = 0; j <= steps; j++) {
    optionTree[steps][j] = optionType === 'call'
      ? Math.max(0, stockTree[steps][j] - strikePrice)
      : Math.max(0, strikePrice - stockTree[steps][j]);
  }

  // 向后递推（美式期权可以提前行权）
  for (let i = steps - 1; i >= 0; i--) {
    optionTree[i] = [];
    for (let j = 0; j <= i; j++) {
      const holdValue = discount * (p * optionTree[i + 1][j] + (1 - p) * optionTree[i + 1][j + 1]);
      const exerciseValue = optionType === 'call'
        ? Math.max(0, stockTree[i][j] - strikePrice)
        : Math.max(0, strikePrice - stockTree[i][j]);
      optionTree[i][j] = Math.max(holdValue, exerciseValue);
    }
  }

  const price = optionTree[0][0];
  let delta = 0;
  let gamma = 0;
  
  if (steps >= 2) {
    delta = (optionTree[1][0] - optionTree[1][1]) / (stockTree[1][0] - stockTree[1][1]);
    const deltaUp = (optionTree[2][0] - optionTree[2][1]) / (stockTree[2][0] - stockTree[2][1]);
    const deltaDown = (optionTree[2][1] - optionTree[2][2]) / (stockTree[2][1] - stockTree[2][2]);
    gamma = (deltaUp - deltaDown) / (0.5 * (stockTree[2][0] - stockTree[2][2]));
  }

  // 使用有限差分法计算其他Greeks
  const dT = 1 / 365;
  const dVol = 0.01;
  const dR = 0.01;

  // Theta（时间衰减）
  const priceNextDay = priceAmericanOptionSimple(
    spotPrice, strikePrice, riskFreeRate, Math.max(0.001, timeToMaturity - dT), volatility, dividendYield, optionType, steps
  );
  const theta = priceNextDay - price;

  // Vega（波动率敏感性）
  const priceVolUp = priceAmericanOptionSimple(
    spotPrice, strikePrice, riskFreeRate, timeToMaturity, volatility + dVol, dividendYield, optionType, steps
  );
  const vega = (priceVolUp - price) / 100;

  // Rho（利率敏感性）
  const priceRateUp = priceAmericanOptionSimple(
    spotPrice, strikePrice, riskFreeRate + dR, timeToMaturity, volatility, dividendYield, optionType, steps
  );
  const rho = (priceRateUp - price) / 100;

  return { price, delta, gamma, theta, vega, rho };
}

/**
 * 简化版美式期权定价（只返回价格，用于Greeks计算）
 */
function priceAmericanOptionSimple(
  spotPrice: number,
  strikePrice: number,
  riskFreeRate: number,
  timeToMaturity: number,
  volatility: number,
  dividendYield: number,
  optionType: 'call' | 'put',
  steps: number = 100
): number {
  const dt = timeToMaturity / steps;
  const u = Math.exp(volatility * Math.sqrt(dt));
  const d = 1 / u;
  const r = riskFreeRate - dividendYield;
  const p = (Math.exp(r * dt) - d) / (u - d);
  const discount = Math.exp(-riskFreeRate * dt);

  const stockTree: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    stockTree[i] = [];
    for (let j = 0; j <= i; j++) {
      stockTree[i][j] = spotPrice * Math.pow(u, i - j) * Math.pow(d, j);
    }
  }

  const optionTree: number[][] = [];
  optionTree[steps] = [];
  for (let j = 0; j <= steps; j++) {
    optionTree[steps][j] = optionType === 'call'
      ? Math.max(0, stockTree[steps][j] - strikePrice)
      : Math.max(0, strikePrice - stockTree[steps][j]);
  }

  for (let i = steps - 1; i >= 0; i--) {
    optionTree[i] = [];
    for (let j = 0; j <= i; j++) {
      const holdValue = discount * (p * optionTree[i + 1][j] + (1 - p) * optionTree[i + 1][j + 1]);
      const exerciseValue = optionType === 'call'
        ? Math.max(0, stockTree[i][j] - strikePrice)
        : Math.max(0, strikePrice - stockTree[i][j]);
      optionTree[i][j] = Math.max(holdValue, exerciseValue);
    }
  }

  return optionTree[0][0];
}

/**
 * 计算隐含波动率（使用二分法）
 * 给定期权价格，反推隐含波动率
 * 
 * @param marketPrice 市场价格
 * @param params 期权参数（不包含impliedVolatility）
 * @param tolerance 容差（默认0.0001）
 * @param maxIterations 最大迭代次数（默认100）
 * @returns 隐含波动率，如果无法计算则返回null
 */
export function calculateImpliedVolatility(
  marketPrice: number,
  params: Omit<VanillaParams, 'impliedVolatility'>,
  tolerance: number = 0.0001,
  maxIterations: number = 100
): number | null {
  // 检查市场价格是否合理
  const { underlying, strikePrice, optionType, timeToMaturity } = params;
  const spotPrice = underlying.spotPrice;
  
  if (timeToMaturity <= 0) {
    return null; // 已到期，无法计算隐含波动率
  }

  // 计算内在价值
  const intrinsic = optionType === 'call'
    ? Math.max(0, spotPrice - strikePrice)
    : Math.max(0, strikePrice - spotPrice);

  // 市场价格必须大于内在价值
  if (marketPrice <= intrinsic) {
    return null;
  }

  // 使用二分法搜索隐含波动率
  let volLow = 0.001;  // 最小波动率
  let volHigh = 5.0;   // 最大波动率（500%）

  // 先检查边界
  const paramsLow = { ...params, impliedVolatility: volLow };
  const priceLow = priceVanilla(paramsLow).price;
  
  const paramsHigh = { ...params, impliedVolatility: volHigh };
  const priceHigh = priceVanilla(paramsHigh).price;

  // 如果市场价格超出范围，返回null
  if (marketPrice < priceLow || marketPrice > priceHigh) {
    return null;
  }

  // 二分法迭代
  for (let i = 0; i < maxIterations; i++) {
    const volMid = (volLow + volHigh) / 2;
    const paramsMid = { ...params, impliedVolatility: volMid };
    const priceMid = priceVanilla(paramsMid).price;

    if (Math.abs(priceMid - marketPrice) < tolerance) {
      return volMid;
    }

    if (priceMid < marketPrice) {
      volLow = volMid;
    } else {
      volHigh = volMid;
    }

    // 检查收敛
    if (volHigh - volLow < tolerance) {
      return (volLow + volHigh) / 2;
    }
  }

  // 未收敛，返回中间值
  return (volLow + volHigh) / 2;
}

/**
 * Black-Scholes-Merton 香草期权定价（支持分红）
 * 参考：Black-Scholes-Merton模型，考虑了连续分红率
 */
export function priceVanilla(params: VanillaParams): PricingResult {
  const {
    underlying,
    strikePrice,
    riskFreeRate,
    timeToMaturity,
    optionType,
    direction = 'buy',
    contractSize = 1,
    exerciseStyle = "european",
    strikePricePercent,
    currency = "CNY",
    startDate,
    expiryDate,
    valuationDate,
    notional,
    dividendYield = 0,
    impliedVolatility,
    initialPrice
  } = params;

  // 确定初始价格：如果不填写，使用标的资产的当前价格
  const startPrice = initialPrice !== undefined ? initialPrice : underlying.spotPrice;
  
  // 执行价格直接使用提供的strikePrice
  const finalStrikePrice = strikePrice;

  const spotPrice = underlying.spotPrice; // 当前市场价格（用于定价计算）
  // 优先使用隐含波动率，否则使用标的资产的波动率
  const volatility = impliedVolatility !== undefined ? impliedVolatility : underlying.volatility;
  const q = dividendYield; // 分红率

  // 计算名义本金（如果未提供）
  const calculatedNotional = notional !== undefined 
    ? notional 
    : contractSize * finalStrikePrice;

  // 到期时间为0或负数，返回内在价值
  if (timeToMaturity <= 0) {
    const intrinsicPerContract = optionType === 'call' 
      ? Math.max(0, spotPrice - finalStrikePrice)
      : Math.max(0, finalStrikePrice - spotPrice);
    const totalIntrinsic = intrinsicPerContract * contractSize;
    return { 
      price: direction === 'sell' ? -totalIntrinsic : totalIntrinsic,
      intrinsicValue: intrinsicPerContract * contractSize,
      timeValue: 0,
      exerciseStyle,
      currency,
      strikePricePercent,
      startDate,
      expiryDate,
      valuationDate
    };
  }

  let pricePerContract: number;
  let intrinsicValuePerContract: number;
  let delta: number;
  let gamma: number;
  let theta: number;
  let vega: number;
  let rho: number;

  // 根据行权方式选择定价模型
  if (exerciseStyle === 'american') {
    // 美式期权：使用二叉树模型
    const americanResult = priceAmericanOption(
      spotPrice, finalStrikePrice, riskFreeRate, timeToMaturity, volatility, q, optionType, 200
    );
    
    pricePerContract = americanResult.price;
    delta = americanResult.delta;
    gamma = americanResult.gamma;
    theta = americanResult.theta;
    vega = americanResult.vega;
    rho = americanResult.rho;
    
    intrinsicValuePerContract = optionType === 'call'
      ? Math.max(0, spotPrice - finalStrikePrice)
      : Math.max(0, finalStrikePrice - spotPrice);
  } else {
    // 欧式期权：使用Black-Scholes-Merton公式
    const sqrtT = Math.sqrt(timeToMaturity);
    const d1 = (Math.log(spotPrice / finalStrikePrice) + (riskFreeRate - q + 0.5 * volatility * volatility) * timeToMaturity) 
      / (volatility * sqrtT);
    const d2 = d1 - volatility * sqrtT;

    const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);
    const dividendDiscountFactor = Math.exp(-q * timeToMaturity);

    if (optionType === 'call') {
      pricePerContract = spotPrice * dividendDiscountFactor * normalCDF(d1) 
                       - finalStrikePrice * discountFactor * normalCDF(d2);
      intrinsicValuePerContract = Math.max(0, spotPrice - finalStrikePrice);
    } else {
      pricePerContract = finalStrikePrice * discountFactor * normalCDF(-d2) 
                       - spotPrice * dividendDiscountFactor * normalCDF(-d1);
      intrinsicValuePerContract = Math.max(0, finalStrikePrice - spotPrice);
    }

    const pdfD1 = normalPDF(d1);
    
    if (optionType === 'call') {
      delta = dividendDiscountFactor * normalCDF(d1);
    } else {
      delta = -dividendDiscountFactor * normalCDF(-d1);
    }

    gamma = (dividendDiscountFactor * pdfD1) / (spotPrice * volatility * sqrtT);
    vega = spotPrice * dividendDiscountFactor * pdfD1 * sqrtT / 100;

    if (optionType === 'call') {
      theta = (
        -spotPrice * dividendDiscountFactor * pdfD1 * volatility / (2 * sqrtT)
        + q * spotPrice * dividendDiscountFactor * normalCDF(d1)
        - riskFreeRate * finalStrikePrice * discountFactor * normalCDF(d2)
      ) / 365;
    } else {
      theta = (
        -spotPrice * dividendDiscountFactor * pdfD1 * volatility / (2 * sqrtT)
        - q * spotPrice * dividendDiscountFactor * normalCDF(-d1)
        + riskFreeRate * finalStrikePrice * discountFactor * normalCDF(-d2)
      ) / 365;
    }

    if (optionType === 'call') {
      rho = finalStrikePrice * timeToMaturity * discountFactor * normalCDF(d2) / 100;
    } else {
      rho = -finalStrikePrice * timeToMaturity * discountFactor * normalCDF(-d2) / 100;
    }
  }

  const timeValuePerContract = pricePerContract - intrinsicValuePerContract;

  // 考虑期权股数
  const pricePerUnit = pricePerContract * contractSize;
  const totalPrice = pricePerUnit;

  // 考虑买卖方向
  const finalPrice = direction === 'sell' ? -totalPrice : totalPrice;

  // 调整Greeks以考虑期权股数
  delta = delta * contractSize;
  gamma = gamma * contractSize;
  theta = theta * contractSize;
  vega = vega * contractSize;
  rho = rho * contractSize;

  // 计算其他有用的指标
  const intrinsicValue = intrinsicValuePerContract * contractSize;
  const timeValue = timeValuePerContract * contractSize;
  const pricePerShare = pricePerContract;

  return {
    price: finalPrice,
    delta,
    gamma,
    theta,
    vega,
    rho,
    intrinsicValue,
    timeValue,
    pricePerShare,
    pricePerContract: pricePerUnit,
    notional: calculatedNotional,
    contractSize,
    initialPrice: startPrice,
    exerciseStyle,
    currency,
    strikePricePercent,
    startDate,
    expiryDate,
    valuationDate
  };
}

/**
 * 蒙特卡洛模拟（通用）
 */
function monteCarloSimulation(
  numSimulations: number,
  numSteps: number,
  timeToMaturity: number,
  spotPrice: number,
  riskFreeRate: number,
  volatility: number,
  payoffFn: (paths: number[]) => number
): number {
  const dt = timeToMaturity / numSteps;
  const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);
  let sumPayoffs = 0;

  for (let i = 0; i < numSimulations; i++) {
    const path: number[] = [spotPrice];
    let currentPrice = spotPrice;

    for (let step = 0; step < numSteps; step++) {
      const random = Math.random();
      const z = Math.sqrt(-2 * Math.log(random)) * Math.cos(2 * Math.PI * Math.random());
      currentPrice = currentPrice * Math.exp((riskFreeRate - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z);
      path.push(currentPrice);
    }

    sumPayoffs += payoffFn(path);
  }

  return (sumPayoffs / numSimulations) * discountFactor;
}

/**
 * 亚式期权定价（蒙特卡洛）
 */
export function priceAsian(params: AsianParams): PricingResult {
  const { 
    underlying,
    strikePrice, 
    riskFreeRate, 
    timeToMaturity, 
    optionType,
    averagingPeriods,
    averagingType 
  } = params;
  const spotPrice = underlying.spotPrice;
  const volatility = underlying.volatility;

  if (timeToMaturity <= 0) {
    return { price: 0 };
  }

  const numSimulations = 50000;
  const numSteps = Math.max(50, averagingPeriods);

  const payoffFn = (path: number[]): number => {
    const observationIndices = Array.from({ length: averagingPeriods }, (_, i) => 
      Math.floor((i + 1) * (path.length - 1) / averagingPeriods)
    );
    const observedPrices = observationIndices.map(idx => path[idx]);

    let averagePrice: number;
    if (averagingType === 'arithmetic') {
      averagePrice = observedPrices.reduce((sum, p) => sum + p, 0) / observedPrices.length;
    } else {
      averagePrice = Math.exp(
        observedPrices.reduce((sum, p) => sum + Math.log(p), 0) / observedPrices.length
      );
    }

    if (optionType === 'call') {
      return Math.max(0, averagePrice - strikePrice);
    } else {
      return Math.max(0, strikePrice - averagePrice);
    }
  };

  const price = monteCarloSimulation(
    numSimulations,
    numSteps,
    timeToMaturity,
    spotPrice,
    riskFreeRate,
    volatility,
    payoffFn
  );

  return { price };
}

/**
 * 生成相关随机数（Cholesky分解）
 */
function generateCorrelatedRandoms(correlation: number[][], numAssets: number): number[] {
  // 简化版本：如果相关系数矩阵未提供，使用独立随机数
  if (!correlation || correlation.length === 0) {
    return Array.from({ length: numAssets }, () => {
      const u = Math.random();
      const v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    });
  }

  // 使用Cholesky分解生成相关随机数
  const z = Array.from({ length: numAssets }, () => {
    const u = Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });

  const result: number[] = [];
  for (let i = 0; i < numAssets; i++) {
    let sum = 0;
    for (let j = 0; j <= i; j++) {
      const l = correlation[i]?.[j] || (i === j ? 1 : 0);
      sum += l * z[j];
    }
    result.push(sum);
  }
  return result;
}

/**
 * FCN定价（蒙特卡洛，支持多标的）
 */
export function priceFCN(params: FCNParams): PricingResult {
  const { 
    notional, 
    couponRate, 
    barrier, 
    knockInBarrier,
    underlyings, 
    riskFreeRate, 
    timeToMaturity,
    observationDates,
    correlation
  } = params;

  if (timeToMaturity <= 0) {
    return { price: notional };
  }

  if (underlyings.length === 0) {
    return { price: notional };
  }

  const numSimulations = 50000;
  const numSteps = Math.max(50, observationDates);
  const dt = timeToMaturity / numSteps;
  const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);
  
  let sumPayoffs = 0;

  for (let i = 0; i < numSimulations; i++) {
    // 初始化每个标的的价格路径
    const prices: number[][] = underlyings.map(u => [u.spotPrice]);
    let knockedOut = false;
    let knockedIn = false;
    let couponCount = 0;

    for (let step = 0; step < numSteps; step++) {
      // 生成相关随机数
      const randoms = generateCorrelatedRandoms(correlation || [], underlyings.length);
      
      // 更新每个标的的价格
      for (let assetIdx = 0; assetIdx < underlyings.length; assetIdx++) {
        const underlying = underlyings[assetIdx];
        const currentPrice = prices[assetIdx][prices[assetIdx].length - 1];
        const newPrice = currentPrice * Math.exp(
          (riskFreeRate - 0.5 * underlying.volatility * underlying.volatility) * dt + 
          underlying.volatility * Math.sqrt(dt) * randoms[assetIdx]
        );
        prices[assetIdx].push(newPrice);
      }

      // 检查敲出：任一标的达到障碍价格
      const maxPrice = Math.max(...prices.map(p => p[p.length - 1]));
      if (maxPrice >= barrier) {
        knockedOut = true;
        break;
      }

      // 检查敲入：任一标的低于敲入障碍
      if (knockInBarrier) {
        const minPrice = Math.min(...prices.map(p => p[p.length - 1]));
        if (minPrice <= knockInBarrier) {
          knockedIn = true;
        }
      }

      // 观察日支付票息
      if (step % (numSteps / observationDates) === 0) {
        if (!knockedOut) {
          couponCount++;
        }
      }
    }

    let payoff = 0;
    if (knockedOut) {
      // 敲出：返还本金
      payoff = notional;
    } else if (knockInBarrier && knockedIn) {
      // 敲入：可能损失本金（基于最差标的的表现）
      const finalReturns = prices.map((p, idx) => 
        (p[p.length - 1] / underlyings[idx].spotPrice - 1)
      );
      const worstReturn = Math.min(...finalReturns);
      payoff = notional * Math.max(0, 1 + worstReturn);
    } else {
      // 正常到期：本金 + 票息
      payoff = notional * (1 + (couponRate * couponCount / observationDates));
    }

    sumPayoffs += payoff;
  }

  const price = (sumPayoffs / numSimulations) * discountFactor;
  return { price };
}

/**
 * Accumulator定价（蒙特卡洛）
 */
export function priceAccumulator(params: AccumulatorParams): PricingResult {
  const { 
    notional, 
    underlying,
    strikePrice, 
    upperBarrier, 
    lowerBarrier,
    riskFreeRate, 
    timeToMaturity,
    observationFrequency,
    multiplier 
  } = params;
  const spotPrice = underlying.spotPrice;
  const volatility = underlying.volatility;

  if (timeToMaturity <= 0) {
    return { price: notional };
  }

  const numSimulations = 50000;
  const numSteps = Math.max(50, Math.floor(timeToMaturity * observationFrequency));
  const dt = timeToMaturity / numSteps;
  const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);
  
  let sumPayoffs = 0;

  for (let i = 0; i < numSimulations; i++) {
    let currentPrice = spotPrice;
    let totalReturn = 0;
    let knockedOut = false;

    for (let step = 0; step < numSteps; step++) {
      const random = Math.random();
      const z = Math.sqrt(-2 * Math.log(random)) * Math.cos(2 * Math.PI * Math.random());
      currentPrice = currentPrice * Math.exp((riskFreeRate - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z);

      // 检查敲出
      if (currentPrice >= upperBarrier) {
        knockedOut = true;
        break;
      }

      // 观察日计算收益
      if (step % (numSteps / observationFrequency) === 0) {
        if (currentPrice > strikePrice) {
          // 高于执行价：获得收益
          totalReturn += (currentPrice - strikePrice) / strikePrice * multiplier;
        } else if (currentPrice < lowerBarrier) {
          // 低于下限：损失
          totalReturn += (currentPrice - strikePrice) / strikePrice * multiplier;
        }
      }
    }

    let payoff: number;
    if (knockedOut) {
      // 敲出：可能损失
      payoff = notional * (1 + totalReturn);
    } else {
      // 到期：累计收益
      payoff = notional * (1 + totalReturn);
    }

    sumPayoffs += payoff;
  }

  const price = (sumPayoffs / numSimulations) * discountFactor;
  return { price };
}

/**
 * Decumulator定价（蒙特卡洛）
 */
export function priceDecumulator(params: AccumulatorParams): PricingResult {
  // Decumulator与Accumulator类似，但方向相反
  const { 
    notional, 
    underlying,
    strikePrice, 
    upperBarrier, 
    lowerBarrier,
    riskFreeRate, 
    timeToMaturity,
    observationFrequency,
    multiplier 
  } = params;
  const spotPrice = underlying.spotPrice;
  const volatility = underlying.volatility;

  if (timeToMaturity <= 0) {
    return { price: notional };
  }

  const numSimulations = 50000;
  const numSteps = Math.max(50, Math.floor(timeToMaturity * observationFrequency));
  const dt = timeToMaturity / numSteps;
  const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);
  
  let sumPayoffs = 0;

  for (let i = 0; i < numSimulations; i++) {
    let currentPrice = spotPrice;
    let totalReturn = 0;
    let knockedOut = false;

    for (let step = 0; step < numSteps; step++) {
      const random = Math.random();
      const z = Math.sqrt(-2 * Math.log(random)) * Math.cos(2 * Math.PI * Math.random());
      currentPrice = currentPrice * Math.exp((riskFreeRate - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z);

      // 检查敲出（下限）
      if (currentPrice <= lowerBarrier) {
        knockedOut = true;
        break;
      }

      // 观察日计算收益（与Accumulator相反）
      if (step % (numSteps / observationFrequency) === 0) {
        if (currentPrice < strikePrice) {
          // 低于执行价：获得收益
          totalReturn += (strikePrice - currentPrice) / strikePrice * multiplier;
        } else if (currentPrice > upperBarrier) {
          // 高于上限：损失
          totalReturn -= (currentPrice - strikePrice) / strikePrice * multiplier;
        }
      }
    }

    let payoff: number;
    if (knockedOut) {
      payoff = notional * (1 + totalReturn);
    } else {
      payoff = notional * (1 + totalReturn);
    }

    sumPayoffs += payoff;
  }

  const price = (sumPayoffs / numSimulations) * discountFactor;
  return { price };
}

/**
 * TRS (Total Return Swap) 总收益互换定价
 * 使用蒙特卡洛模拟方法
 * 
 * TRS结构：
 * - 一方支付标的资产的总收益（价格变动+分红）
 * - 另一方支付固定利率（swap rate）
 * - 定期支付（根据paymentFrequency）
 */
export function priceTRS(params: TRSParams): PricingResult {
  const {
    notional,
    underlying,
    riskFreeRate,
    swapRate,
    timeToMaturity,
    paymentFrequency,
    dividendYield = 0,
    initialPrice,
    direction = 'receive',
    correlation: _correlation = 0  // 预留用于未来扩展（考虑利率与标的资产的相关性）
  } = params;

  if (timeToMaturity <= 0) {
    return { price: 0 };
  }

  const spotPrice = underlying.spotPrice;
  const volatility = underlying.volatility;
  const startPrice = initialPrice !== undefined ? initialPrice : spotPrice;
  const q = dividendYield; // 分红率

  const numSimulations = 50000;
  const numSteps = Math.max(50, Math.floor(timeToMaturity * paymentFrequency));
  const dt = timeToMaturity / numSteps;
  const paymentInterval = Math.floor(numSteps / (timeToMaturity * paymentFrequency));
  const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);

  let sumPayoffs = 0;

  for (let i = 0; i < numSimulations; i++) {
    let currentPrice = startPrice;
    let totalPV = 0; // 总现值
    let previousPrice = startPrice;

    for (let step = 0; step < numSteps; step++) {
      // 生成随机数（考虑与利率的相关性）
      const z1 = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
      // z2 用于未来扩展（考虑利率与标的资产的相关性）
      // const z2 = correlation * z1 + Math.sqrt(1 - correlation * correlation) * 
      //            (Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()));

      // 标的资产价格路径（几何布朗运动）
      currentPrice = currentPrice * Math.exp(
        (riskFreeRate - q - 0.5 * volatility * volatility) * dt + 
        volatility * Math.sqrt(dt) * z1
      );

      // 支付日计算
      if (step > 0 && step % paymentInterval === 0) {
        const paymentTime = (step / numSteps) * timeToMaturity;
        const paymentDiscount = Math.exp(-riskFreeRate * paymentTime);

        // 计算价格变动收益
        const priceReturn = (currentPrice - previousPrice) / previousPrice;
        
        // 计算分红收益（期间分红）
        const dividendReturn = q * dt * paymentFrequency;

        // 总收益 = 价格变动 + 分红
        const totalReturn = priceReturn + dividendReturn;

        // 固定利率支付
        const swapPayment = swapRate / paymentFrequency;

        // 净支付（根据方向）
        let netPayment: number;
        if (direction === 'receive') {
          // 接收标的收益，支付固定利率
          netPayment = totalReturn - swapPayment;
        } else {
          // 支付标的收益，接收固定利率
          netPayment = swapPayment - totalReturn;
        }

        // 贴现到当前时点
        totalPV += netPayment * paymentDiscount;

        previousPrice = currentPrice;
      }
    }

    // 最终支付（到期时的价格变动）
    const finalReturn = (currentPrice - startPrice) / startPrice;
    const finalDividend = q * timeToMaturity;
    const finalTotalReturn = finalReturn + finalDividend;
    const finalSwapPayment = swapRate * timeToMaturity;

    let finalNetPayment: number;
    if (direction === 'receive') {
      finalNetPayment = finalTotalReturn - finalSwapPayment;
    } else {
      finalNetPayment = finalSwapPayment - finalTotalReturn;
    }

    // 加上最终支付的现值
    totalPV += finalNetPayment * discountFactor;

    // 总收益 = 名义本金 × 净收益
    sumPayoffs += notional * totalPV;
  }

  const price = sumPayoffs / numSimulations;

  // 计算 Greeks（简化版本，基于解析近似）
  const sqrtT = Math.sqrt(timeToMaturity);
  const d1 = (Math.log(spotPrice / startPrice) + (riskFreeRate - q + 0.5 * volatility * volatility) * timeToMaturity) 
    / (volatility * sqrtT);
  const pdfD1 = normalPDF(d1);

  // Delta：对标的资产价格的敏感性
  const delta = direction === 'receive' 
    ? notional * Math.exp(-q * timeToMaturity) * normalCDF(d1)
    : -notional * Math.exp(-q * timeToMaturity) * normalCDF(d1);

  // Gamma：Delta的敏感性
  const gamma = notional * Math.exp(-q * timeToMaturity) * pdfD1 / (spotPrice * volatility * sqrtT);

  // Vega：对波动率的敏感性
  const vega = notional * spotPrice * Math.exp(-q * timeToMaturity) * pdfD1 * sqrtT / 100;

  // Theta：时间衰减
  const theta = notional * (
    -spotPrice * Math.exp(-q * timeToMaturity) * pdfD1 * volatility / (2 * sqrtT) +
    q * spotPrice * Math.exp(-q * timeToMaturity) * normalCDF(d1) -
    swapRate * Math.exp(-riskFreeRate * timeToMaturity)
  ) / 365;

  // Rho：对利率的敏感性
  const rho = notional * (
    spotPrice * timeToMaturity * Math.exp(-q * timeToMaturity) * normalCDF(d1) -
    swapRate * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity)
  ) / 100;

  return {
    price,
    delta,
    gamma,
    theta,
    vega,
    rho,
    notional,
    swapRate,
    paymentFrequency
  };
}
