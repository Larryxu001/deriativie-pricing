/**
 * 参数验证工具函数
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 验证数值范围
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  if (isNaN(value) || value < min || value > max) {
    return {
      field: fieldName,
      message: `${fieldName}必须在${min}到${max}之间`,
    };
  }
  return null;
}

/**
 * 验证正数
 */
export function validatePositive(value: number, fieldName: string): ValidationError | null {
  if (isNaN(value) || value <= 0) {
    return {
      field: fieldName,
      message: `${fieldName}必须大于0`,
    };
  }
  return null;
}

/**
 * 验证非负数
 */
export function validateNonNegative(value: number, fieldName: string): ValidationError | null {
  if (isNaN(value) || value < 0) {
    return {
      field: fieldName,
      message: `${fieldName}不能为负数`,
    };
  }
  return null;
}

/**
 * 验证香草期权参数
 */
export function validateVanillaParams(params: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证标的资产
  if (!params.underlying) {
    errors.push({ field: 'underlying', message: '请填写标的资产信息' });
  } else {
    if (!params.underlying.spotPrice || params.underlying.spotPrice <= 0) {
      errors.push({ field: 'spotPrice', message: '现货价格必须大于0' });
    }
    // 如果未提供隐含波动率，则验证标的资产的波动率
    if (params.impliedVolatility === undefined) {
      if (!params.underlying.volatility || params.underlying.volatility <= 0 || params.underlying.volatility > 5) {
        errors.push({ field: 'volatility', message: '波动率必须在0到5之间（0-500%）' });
      }
    }
  }

  // 验证日期参数
  if (params.startDate && params.expiryDate) {
    const startDate = new Date(params.startDate);
    const expiryDate = new Date(params.expiryDate);
    if (expiryDate <= startDate) {
      errors.push({ field: 'expiryDate', message: '到期日必须晚于起始日' });
    }
  }
  
  if (params.valuationDate && params.expiryDate) {
    const valuationDate = new Date(params.valuationDate);
    const expiryDate = new Date(params.expiryDate);
    if (valuationDate > expiryDate) {
      errors.push({ field: 'valuationDate', message: '估值日不能晚于到期日' });
    }
  }

  // 验证期初价格
  if (!params.initialPrice || params.initialPrice <= 0) {
    errors.push({ field: 'initialPrice', message: '期初价格必须大于0' });
  }

  // 验证行权价格百分比
  if (!params.strikePricePercent || params.strikePricePercent <= 0 || params.strikePricePercent > 500) {
    errors.push({ field: 'strikePricePercent', message: '行权价格百分比必须在0到500%之间' });
  }

  // 验证行权价格
  if (!params.strikePrice || params.strikePrice <= 0) {
    errors.push({ field: 'strikePrice', message: '行权价格必须大于0' });
  }

  // 验证无风险利率
  if (params.riskFreeRate === undefined || params.riskFreeRate < -1 || params.riskFreeRate > 1) {
    errors.push({ field: 'riskFreeRate', message: '无风险利率必须在-100%到100%之间' });
  }

  // 验证到期时间
  if (!params.timeToMaturity || params.timeToMaturity <= 0 || params.timeToMaturity > 50) {
    errors.push({ field: 'timeToMaturity', message: '到期时间必须在0到50年之间' });
  }

  // 验证期权股数
  if (params.contractSize !== undefined && params.contractSize !== null) {
    if (params.contractSize <= 0 || params.contractSize > 1e10) {
      errors.push({ field: 'contractSize', message: '期权股数必须大于0' });
    }
  }

  // 验证名义本金
  if (params.notional !== undefined && params.notional !== null) {
    if (params.notional <= 0 || params.notional > 1e15) {
      errors.push({ field: 'notional', message: '名义本金必须大于0' });
    }
  }

  // 验证分红率
  if (params.dividendYield !== undefined && (params.dividendYield < 0 || params.dividendYield > 1)) {
    errors.push({ field: 'dividendYield', message: '分红率必须在0到100%之间' });
  }

  // 验证隐含波动率（如果提供）
  if (params.impliedVolatility !== undefined && params.impliedVolatility !== null) {
    if (params.impliedVolatility <= 0 || params.impliedVolatility > 5) {
      errors.push({ field: 'impliedVolatility', message: '隐含波动率必须在0到500%之间' });
    }
  }

  return errors;
}

/**
 * 验证亚式期权参数
 */
export function validateAsianParams(params: any): ValidationError[] {
  const errors = validateVanillaParams(params);

  if (!params.averagingPeriods || params.averagingPeriods < 1 || params.averagingPeriods > 1000) {
    errors.push({ field: 'averagingPeriods', message: '平均化期间数必须在1到1000之间' });
  }

  return errors;
}

/**
 * 验证FCN参数
 */
export function validateFCNParams(params: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.underlyings || params.underlyings.length === 0) {
    errors.push({ field: 'underlyings', message: '请至少选择一个标的资产' });
  } else if (params.underlyings.length > 4) {
    errors.push({ field: 'underlyings', message: '最多只能选择4个标的资产' });
  }

  if (!params.notional || params.notional <= 0) {
    errors.push({ field: 'notional', message: '名义本金必须大于0' });
  }

  if (params.couponRate === undefined || params.couponRate < 0 || params.couponRate > 1) {
    errors.push({ field: 'couponRate', message: '票息率必须在0到1之间' });
  }

  if (!params.barrier || params.barrier <= 0) {
    errors.push({ field: 'barrier', message: '敲出障碍必须大于0' });
  }

  if (params.riskFreeRate === undefined || params.riskFreeRate < -1 || params.riskFreeRate > 1) {
    errors.push({ field: 'riskFreeRate', message: '无风险利率必须在-1到1之间' });
  }

  if (!params.timeToMaturity || params.timeToMaturity <= 0 || params.timeToMaturity > 50) {
    errors.push({ field: 'timeToMaturity', message: '到期时间必须在0到50年之间' });
  }

  if (!params.observationDates || params.observationDates < 1 || params.observationDates > 1000) {
    errors.push({ field: 'observationDates', message: '观察日数量必须在1到1000之间' });
  }

  return errors;
}

/**
 * 验证TRS参数
 */
export function validateTRSParams(params: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.underlying) {
    errors.push({ field: 'underlying', message: '请选择标的资产' });
  } else {
    if (!params.underlying.spotPrice || params.underlying.spotPrice <= 0) {
      errors.push({ field: 'spotPrice', message: '现货价格必须大于0' });
    }
    if (!params.underlying.volatility || params.underlying.volatility <= 0 || params.underlying.volatility > 5) {
      errors.push({ field: 'volatility', message: '波动率必须在0到5之间' });
    }
  }

  if (!params.notional || params.notional <= 0) {
    errors.push({ field: 'notional', message: '名义本金必须大于0' });
  }

  if (params.swapRate === undefined || params.swapRate < 0 || params.swapRate > 1) {
    errors.push({ field: 'swapRate', message: '互换利率必须在0到1之间（0-100%）' });
  }

  if (params.riskFreeRate === undefined || params.riskFreeRate < -1 || params.riskFreeRate > 1) {
    errors.push({ field: 'riskFreeRate', message: '无风险利率必须在-1到1之间' });
  }

  if (!params.timeToMaturity || params.timeToMaturity <= 0 || params.timeToMaturity > 50) {
    errors.push({ field: 'timeToMaturity', message: '到期时间必须在0到50年之间' });
  }

  if (!params.paymentFrequency || params.paymentFrequency < 1 || params.paymentFrequency > 365) {
    errors.push({ field: 'paymentFrequency', message: '支付频率必须在1到365之间' });
  }

  if (params.dividendYield !== undefined && (params.dividendYield < 0 || params.dividendYield > 1)) {
    errors.push({ field: 'dividendYield', message: '分红率必须在0到1之间（0-100%）' });
  }

  if (params.initialPrice !== undefined && params.initialPrice <= 0) {
    errors.push({ field: 'initialPrice', message: '初始价格必须大于0' });
  }

  if (params.correlation !== undefined && (params.correlation < -1 || params.correlation > 1)) {
    errors.push({ field: 'correlation', message: '相关系数必须在-1到1之间' });
  }

  return errors;
}

/**
 * 验证Accumulator/Decumulator参数
 */
export function validateAccumulatorParams(params: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.underlying) {
    errors.push({ field: 'underlying', message: '请选择标的资产' });
  }

  if (!params.notional || params.notional <= 0) {
    errors.push({ field: 'notional', message: '名义本金必须大于0' });
  }

  if (!params.strikePrice || params.strikePrice <= 0) {
    errors.push({ field: 'strikePrice', message: '执行价格必须大于0' });
  }

  if (!params.upperBarrier || params.upperBarrier <= 0) {
    errors.push({ field: 'upperBarrier', message: '上限障碍必须大于0' });
  }

  if (!params.lowerBarrier || params.lowerBarrier <= 0) {
    errors.push({ field: 'lowerBarrier', message: '下限障碍必须大于0' });
  }

  if (params.upperBarrier && params.lowerBarrier && params.upperBarrier <= params.lowerBarrier) {
    errors.push({ field: 'barriers', message: '上限障碍必须大于下限障碍' });
  }

  if (params.riskFreeRate === undefined || params.riskFreeRate < -1 || params.riskFreeRate > 1) {
    errors.push({ field: 'riskFreeRate', message: '无风险利率必须在-1到1之间' });
  }

  if (!params.timeToMaturity || params.timeToMaturity <= 0 || params.timeToMaturity > 50) {
    errors.push({ field: 'timeToMaturity', message: '到期时间必须在0到50年之间' });
  }

  if (!params.observationFrequency || params.observationFrequency < 1 || params.observationFrequency > 365) {
    errors.push({ field: 'observationFrequency', message: '观察频率必须在1到365之间' });
  }

  if (!params.multiplier || params.multiplier <= 0 || params.multiplier > 100) {
    errors.push({ field: 'multiplier', message: '杠杆倍数必须在0到100之间' });
  }

  return errors;
}

