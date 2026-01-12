import React, { useState, useEffect, useCallback } from 'react';
import { getUnderlyings, getUnderlyingById } from '../utils/underlying';
import UnderlyingManager from './UnderlyingManager';
import ErrorMessage from './ErrorMessage';
import {
  validateVanillaParams,
  validateAsianParams,
  validateFCNParams,
  validateAccumulatorParams,
  validateTRSParams,
  type ValidationError,
} from '../utils/validation';
import type { ProductType, VanillaParams, AsianParams, FCNParams, AccumulatorParams, TRSParams, Underlying, Currency, ExerciseStyle } from '../types';

// 货币符号映射
const currencySymbols: Record<Currency, string> = {
  CNY: '¥',
  USD: '$',
  HKD: 'HK$',
};

// 计算两个日期之间的天数
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 获取今天的日期
function getToday(): string {
  return formatDate(new Date());
}

// 获取N个月后的日期
function getDateAfterMonths(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return formatDate(date);
}

interface ParamInputProps {
  productType: ProductType;
  onCalculate: (params: any) => void;
  initialParams?: any;
}

export default function ParamInput({ productType, onCalculate, initialParams }: ParamInputProps) {
  const [params, setParams] = useState<any>(initialParams || getDefaultParams(productType));
  const [selectedUnderlyingIds, setSelectedUnderlyingIds] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (initialParams) {
      setParams(initialParams);
      // 从初始参数中提取标的资产ID
      if (productType === 'fcn' && initialParams.underlyings) {
        setSelectedUnderlyingIds(initialParams.underlyings.map((u: Underlying) => u.id));
      } else if (initialParams.underlying) {
        setSelectedUnderlyingIds([initialParams.underlying.id]);
      }
    } else {
      // 设置默认标的资产
      const defaultUnderlyings = getUnderlyings();
      if (defaultUnderlyings.length > 0) {
        if (productType === 'fcn') {
          setSelectedUnderlyingIds(defaultUnderlyings.slice(0, 4).map(u => u.id));
        } else {
          setSelectedUnderlyingIds([defaultUnderlyings[0].id]);
        }
      }
    }
  }, [initialParams, productType]);

  useEffect(() => {
    // 当选择的标的资产改变时，更新参数
    if (selectedUnderlyingIds.length > 0) {
      const selectedUnderlyings = selectedUnderlyingIds
        .map((id: string) => getUnderlyingById(id))
        .filter((u): u is Underlying => u !== undefined);

      if (productType === 'fcn') {
        setParams((prev: any) => ({
          ...prev,
          underlyings: selectedUnderlyings,
        }));
      } else if (selectedUnderlyings.length > 0) {
        const underlying = selectedUnderlyings[0];
        setParams((prev: any) => {
          const updated = {
            ...prev,
            underlying: underlying,
          };
          // 对于香草期权，如果初始价格未设置，使用标的资产价格（但不强制设置，保持为undefined，让UI显示标的资产价格）
          if (productType === 'vanilla') {
            // 如果执行价格未设置，默认使用标的资产价格（平值期权）
            if (updated.strikePrice === undefined || updated.strikePrice === 0) {
              updated.strikePrice = underlying.spotPrice;
            }
          }
          return updated;
        });
      }
    }
  }, [selectedUnderlyingIds, productType]);

  const handleChange = (field: string, value: number | string | undefined) => {
    setParams((prev: any) => {
      const updated = { ...prev };
      if (value === undefined) {
        delete updated[field];
      } else {
        updated[field] = value;
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 参数验证
    let errors: ValidationError[] = [];
    
    switch (productType) {
      case 'vanilla':
        errors = validateVanillaParams(params);
        break;
      case 'asian':
        errors = validateAsianParams(params);
        break;
      case 'fcn':
        errors = validateFCNParams(params);
        break;
      case 'accumulator':
      case 'decumulator':
        errors = validateAccumulatorParams(params);
        break;
      case 'trs':
        errors = validateTRSParams(params);
        break;
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      // 滚动到错误提示
      setTimeout(() => {
        const errorElement = document.querySelector('.bg-red-50');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    
    setValidationErrors([]);
    onCalculate(params);
  };

  return (
    <div className="space-y-6">
      {/* 标的资产选择 - 香草期权使用简化版本 */}
      {productType === 'vanilla' ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">标的资产</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标的名称</label>
              <input
                type="text"
                value={(params as VanillaParams).underlying?.name || ''}
                onChange={(e) => {
                  const underlying = (params as VanillaParams).underlying || { id: 'custom', name: '', spotPrice: 100, volatility: 0.2 };
                  handleChange('underlying', { ...underlying, name: e.target.value } as any);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：AAPL, 000001.SZ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">现货价格</label>
                <input
                  type="text"
                  value={(params as VanillaParams).underlying?.spotPrice ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                      const underlying = (params as VanillaParams).underlying || { id: 'custom', name: '标的资产', spotPrice: 100, volatility: 0.2 };
                      const num = val === '' ? 0 : parseFloat(val);
                      handleChange('underlying', { ...underlying, spotPrice: isNaN(num) ? 0 : num } as any);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">波动率</label>
                <input
                  type="text"
                  value={(params as VanillaParams).underlying?.volatility ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                      const underlying = (params as VanillaParams).underlying || { id: 'custom', name: '标的资产', spotPrice: 100, volatility: 0.2 };
                      const num = val === '' ? 0 : parseFloat(val);
                      handleChange('underlying', { ...underlying, volatility: isNaN(num) ? 0 : num } as any);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <UnderlyingManager
            selectedIds={selectedUnderlyingIds}
            onSelect={setSelectedUnderlyingIds}
            maxSelect={productType === 'fcn' ? 4 : 1}
            singleSelect={productType !== 'fcn'}
          />
        </div>
      )}

      {/* 参数输入表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* 错误提示 */}
        <ErrorMessage
          errors={validationErrors}
          onDismiss={() => setValidationErrors([])}
        />
        {productType === 'vanilla' && (
          <VanillaOptionForm params={params as VanillaParams} onChange={handleChange} setParams={setParams} />
        )}

        {productType === 'asian' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期权类型
              </label>
              <select
                value={(params as AsianParams).optionType}
                onChange={(e) => handleChange('optionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="call">看涨期权 (Call)</option>
                <option value="put">看跌期权 (Put)</option>
              </select>
            </div>
            <NumberInput
              label="执行价格 (K)"
              value={(params as AsianParams).strikePrice}
              onChange={(v) => handleChange('strikePrice', v)}
            />
            <NumberInput
              label="无风险利率 (r, 年化)"
              value={(params as AsianParams).riskFreeRate}
              onChange={(v) => handleChange('riskFreeRate', v)}
              step={0.001}
            />
            <NumberInput
              label="到期时间 (T, 年)"
              value={(params as AsianParams).timeToMaturity}
              onChange={(v) => handleChange('timeToMaturity', v)}
              step={0.01}
            />
            <NumberInput
              label="平均化期间数"
              value={(params as AsianParams).averagingPeriods}
              onChange={(v) => handleChange('averagingPeriods', v)}
              min={1}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                平均类型
              </label>
              <select
                value={(params as AsianParams).averagingType}
                onChange={(e) => handleChange('averagingType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="arithmetic">算术平均</option>
                <option value="geometric">几何平均</option>
              </select>
            </div>
          </>
        )}

        {productType === 'fcn' && (
          <>
            <NumberInput
              label="名义本金"
              value={(params as FCNParams).notional}
              onChange={(v) => handleChange('notional', v)}
            />
            <NumberInput
              label="票息率 (年化)"
              value={(params as FCNParams).couponRate}
              onChange={(v) => handleChange('couponRate', v)}
              step={0.001}
            />
            <NumberInput
              label="敲出障碍"
              value={(params as FCNParams).barrier}
              onChange={(v) => handleChange('barrier', v)}
            />
            <NumberInput
              label="敲入障碍 (可选)"
              value={(params as FCNParams).knockInBarrier || 0}
              onChange={(v) => handleChange('knockInBarrier', v)}
              optional
            />
            <NumberInput
              label="无风险利率 (r, 年化)"
              value={(params as FCNParams).riskFreeRate}
              onChange={(v) => handleChange('riskFreeRate', v)}
              step={0.001}
            />
            <NumberInput
              label="到期时间 (T, 年)"
              value={(params as FCNParams).timeToMaturity}
              onChange={(v) => handleChange('timeToMaturity', v)}
              step={0.01}
            />
            <NumberInput
              label="观察日数量"
              value={(params as FCNParams).observationDates}
              onChange={(v) => handleChange('observationDates', v)}
              min={1}
            />
          </>
        )}

        {(productType === 'accumulator' || productType === 'decumulator') && (
          <>
            <NumberInput
              label="名义本金"
              value={(params as AccumulatorParams).notional}
              onChange={(v) => handleChange('notional', v)}
            />
            <NumberInput
              label="执行价格 (K)"
              value={(params as AccumulatorParams).strikePrice}
              onChange={(v) => handleChange('strikePrice', v)}
            />
            <NumberInput
              label="上限障碍"
              value={(params as AccumulatorParams).upperBarrier}
              onChange={(v) => handleChange('upperBarrier', v)}
            />
            <NumberInput
              label="下限障碍"
              value={(params as AccumulatorParams).lowerBarrier}
              onChange={(v) => handleChange('lowerBarrier', v)}
            />
            <NumberInput
              label="无风险利率 (r, 年化)"
              value={(params as AccumulatorParams).riskFreeRate}
              onChange={(v) => handleChange('riskFreeRate', v)}
              step={0.001}
            />
            <NumberInput
              label="到期时间 (T, 年)"
              value={(params as AccumulatorParams).timeToMaturity}
              onChange={(v) => handleChange('timeToMaturity', v)}
              step={0.01}
            />
            <NumberInput
              label="观察频率 (次/年)"
              value={(params as AccumulatorParams).observationFrequency}
              onChange={(v) => handleChange('observationFrequency', v)}
              min={1}
            />
            <NumberInput
              label="杠杆倍数"
              value={(params as AccumulatorParams).multiplier}
              onChange={(v) => handleChange('multiplier', v)}
              step={0.1}
            />
          </>
        )}

        {productType === 'trs' && (
          <>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">基础参数</h3>
              <div className="space-y-4">
                <NumberInput
                  label="名义本金"
                  value={(params as TRSParams).notional}
                  onChange={(v) => handleChange('notional', v)}
                />
                <NumberInput
                  label="互换利率 (年化)"
                  value={(params as TRSParams).swapRate}
                  onChange={(v) => handleChange('swapRate', v)}
                  step={0.001}
                />
                <NumberInput
                  label="无风险利率 (r, 年化)"
                  value={(params as TRSParams).riskFreeRate}
                  onChange={(v) => handleChange('riskFreeRate', v)}
                  step={0.001}
                />
                <NumberInput
                  label="到期时间 (T, 年)"
                  value={(params as TRSParams).timeToMaturity}
                  onChange={(v) => handleChange('timeToMaturity', v)}
                  step={0.01}
                />
                <NumberInput
                  label="支付频率 (次/年)"
                  value={(params as TRSParams).paymentFrequency}
                  onChange={(v) => handleChange('paymentFrequency', v)}
                  min={1}
                />
                <p className="text-xs text-gray-500">
                  例如：12表示每月支付，4表示每季度支付，1表示每年支付
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">高级参数</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    交易方向
                  </label>
                  <select
                    value={(params as TRSParams).direction || 'receive'}
                    onChange={(e) => handleChange('direction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="receive">接收标的收益 (支付固定利率)</option>
                    <option value="pay">支付标的收益 (接收固定利率)</option>
                  </select>
                </div>
                <NumberInput
                  label="分红率 (q, 年化)"
                  value={(params as TRSParams).dividendYield ?? 0}
                  onChange={(v) => handleChange('dividendYield', v)}
                  step={0.001}
                  min={0}
                />
                <NumberInput
                  label="初始价格 (可选)"
                  value={(params as TRSParams).initialPrice ?? 0}
                  onChange={(v) => handleChange('initialPrice', v)}
                  optional
                  min={0}
                />
                <p className="text-xs text-gray-500">
                  如果不填写，将使用标的资产的当前价格
                </p>
                <NumberInput
                  label="相关系数 (可选)"
                  value={(params as TRSParams).correlation ?? 0}
                  onChange={(v) => handleChange('correlation', v)}
                  step={0.01}
                  min={-1}
                  optional
                />
                <p className="text-xs text-gray-500">
                  标的资产与利率的相关系数，范围-1到1
                </p>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          计算价格
        </button>
      </form>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  optional?: boolean;
}) {
  const [inputValue, setInputValue] = React.useState(String(value));
  
  React.useEffect(() => {
    setInputValue(String(value));
  }, [value]);
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="text-gray-400 ml-1">(可选)</span>}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          // 允许空值、负号、数字和小数点（最多4位小数）
          if (val === '' || val === '-' || /^-?\d*\.?\d{0,4}$/.test(val)) {
            setInputValue(val);
            if (val === '' || val === '-' || val === '.') {
              onChange(0);
            } else {
              const num = parseFloat(val);
              if (!isNaN(num)) {
                onChange(num);
              }
            }
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

// 香草期权专用表单组件
function VanillaOptionForm({ 
  params, 
  onChange,
  setParams 
}: { 
  params: VanillaParams; 
  onChange: (field: string, value: number | string | undefined) => void;
  setParams: React.Dispatch<React.SetStateAction<any>>;
}) {
  const currency = params.currency || 'CNY';
  const currencySymbol = currencySymbols[currency];
  
  // 本地状态管理输入框的字符串值，允许自由输入小数
  const [localInitialPrice, setLocalInitialPrice] = useState(String(params.initialPrice || params.underlying?.spotPrice || 100));
  const [localStrikePricePercent, setLocalStrikePricePercent] = useState(String(params.strikePricePercent || 100));
  const [localContractSize, setLocalContractSize] = useState(String(params.contractSize || 10000));
  const [localNotional, setLocalNotional] = useState(String(params.notional || 1000000));
  const [localRiskFreeRate, setLocalRiskFreeRate] = useState(String((params.riskFreeRate || 0.03) * 100));
  const [localDividendYield, setLocalDividendYield] = useState(String((params.dividendYield || 0) * 100));
  const [localImpliedVolatility, setLocalImpliedVolatility] = useState(params.impliedVolatility !== undefined ? String(params.impliedVolatility * 100) : '');
  
  // 同步外部 params 到本地状态（仅当外部值变化时）
  useEffect(() => {
    const extInitial = params.initialPrice || params.underlying?.spotPrice || 100;
    if (parseFloat(localInitialPrice) !== extInitial && !localInitialPrice.endsWith('.')) {
      setLocalInitialPrice(String(extInitial));
    }
  }, [params.initialPrice, params.underlying?.spotPrice]);
  
  useEffect(() => {
    const extPercent = params.strikePricePercent || 100;
    if (parseFloat(localStrikePricePercent) !== extPercent && !localStrikePricePercent.endsWith('.')) {
      setLocalStrikePricePercent(String(extPercent));
    }
  }, [params.strikePricePercent]);
  
  useEffect(() => {
    const extSize = params.contractSize || 10000;
    if (parseFloat(localContractSize) !== extSize && !localContractSize.endsWith('.')) {
      setLocalContractSize(String(extSize));
    }
  }, [params.contractSize]);
  
  useEffect(() => {
    const extNotional = params.notional || 1000000;
    if (parseFloat(localNotional) !== extNotional && !localNotional.endsWith('.')) {
      setLocalNotional(String(extNotional));
    }
  }, [params.notional]);
  
  useEffect(() => {
    const extRate = (params.riskFreeRate || 0.03) * 100;
    if (parseFloat(localRiskFreeRate) !== extRate && !localRiskFreeRate.endsWith('.')) {
      setLocalRiskFreeRate(String(extRate));
    }
  }, [params.riskFreeRate]);
  
  useEffect(() => {
    const extYield = (params.dividendYield || 0) * 100;
    if (parseFloat(localDividendYield) !== extYield && !localDividendYield.endsWith('.')) {
      setLocalDividendYield(String(extYield));
    }
  }, [params.dividendYield]);
  
  useEffect(() => {
    if (params.impliedVolatility !== undefined) {
      const extVol = params.impliedVolatility * 100;
      if (parseFloat(localImpliedVolatility) !== extVol && !localImpliedVolatility.endsWith('.')) {
        setLocalImpliedVolatility(String(extVol));
      }
    }
  }, [params.impliedVolatility]);
  
  // 计算到期时间（年）
  const calculateTimeToMaturity = useCallback((valuationDate: string, expiryDate: string): number => {
    if (!valuationDate || !expiryDate) return 0.25;
    const days = daysBetween(valuationDate, expiryDate);
    return Math.max(0, days / 365);
  }, []);
  
  // 当估值日或到期日改变时，自动计算到期时间
  useEffect(() => {
    if (params.valuationDate && params.expiryDate) {
      const ttm = calculateTimeToMaturity(params.valuationDate, params.expiryDate);
      if (Math.abs(ttm - params.timeToMaturity) > 0.0001) {
        setParams((prev: VanillaParams) => ({ ...prev, timeToMaturity: ttm }));
      }
    }
  }, [params.valuationDate, params.expiryDate, calculateTimeToMaturity, setParams, params.timeToMaturity]);
  
  // 处理期权股数变化 - 自动计算名义本金
  const handleContractSizeChange = (value: number) => {
    const initialPrice = params.initialPrice || params.underlying?.spotPrice || 100;
    const newNotional = value * initialPrice;
    setParams((prev: VanillaParams) => ({
      ...prev,
      contractSize: value,
      notional: newNotional,
    }));
  };
  
  // 处理名义本金变化 - 自动计算期权股数
  const handleNotionalChange = (value: number) => {
    const initialPrice = params.initialPrice || params.underlying?.spotPrice || 100;
    const newContractSize = initialPrice > 0 ? value / initialPrice : 0;
    setParams((prev: VanillaParams) => ({
      ...prev,
      notional: value,
      contractSize: newContractSize,
    }));
  };
  
  // 处理期初价格变化 - 自动更新名义本金和行权价格
  const handleInitialPriceChange = (value: number) => {
    const contractSize = params.contractSize || 1;
    const strikePricePercent = params.strikePricePercent || 100;
    setParams((prev: VanillaParams) => ({
      ...prev,
      initialPrice: value,
      notional: contractSize * value,
      strikePrice: value * strikePricePercent / 100,
    }));
  };
  
  // 处理行权价格百分比变化
  const handleStrikePricePercentChange = (value: number) => {
    const initialPrice = params.initialPrice || params.underlying?.spotPrice || 100;
    setParams((prev: VanillaParams) => ({
      ...prev,
      strikePricePercent: value,
      strikePrice: initialPrice * value / 100,
    }));
  };
  
  // 计算显示的行权价格
  const calculatedStrikePrice = (params.initialPrice || params.underlying?.spotPrice || 100) * (params.strikePricePercent || 100) / 100;
  
  // 计算显示的到期天数
  const daysToExpiry = params.valuationDate && params.expiryDate 
    ? daysBetween(params.valuationDate, params.expiryDate) 
    : Math.round(params.timeToMaturity * 365);

  return (
    <>
      {/* 期权类型设置 */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">期权类型</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期权类型
            </label>
            <select
              value={params.optionType || 'call'}
              onChange={(e) => onChange('optionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="call">看涨期权 (Call)</option>
              <option value="put">看跌期权 (Put)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              买卖方向
            </label>
            <select
              value={params.direction || 'buy'}
              onChange={(e) => onChange('direction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="buy">买入 (Long)</option>
              <option value="sell">卖出 (Short)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              行权方式
            </label>
            <select
              value={params.exerciseStyle || 'european'}
              onChange={(e) => onChange('exerciseStyle', e.target.value as ExerciseStyle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="european">欧式期权</option>
              <option value="american">美式期权</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 日期设置 */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">日期参数</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              起始日
            </label>
            <input
              type="date"
              value={params.startDate || getToday()}
              onChange={(e) => {
                onChange('startDate', e.target.value);
                // 如果估值日早于起始日，自动更新估值日
                if (params.valuationDate && params.valuationDate < e.target.value) {
                  onChange('valuationDate', e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              到期日
            </label>
            <input
              type="date"
              value={params.expiryDate || getDateAfterMonths(3)}
              onChange={(e) => onChange('expiryDate', e.target.value)}
              min={params.startDate || getToday()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              估值日
            </label>
            <input
              type="date"
              value={params.valuationDate || getToday()}
              onChange={(e) => onChange('valuationDate', e.target.value)}
              min={params.startDate || getToday()}
              max={params.expiryDate || getDateAfterMonths(3)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              到期时间 (天)
            </label>
            <input
              type="text"
              value={daysToExpiry}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*$/.test(val)) {
                  const days = parseInt(val) || 0;
                  onChange('timeToMaturity', days / 365);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              到期时间 (年)
            </label>
            <input
              type="text"
              value={params.timeToMaturity?.toFixed(4) || '0.2466'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d{0,4}$/.test(val)) {
                  const years = parseFloat(val) || 0;
                  onChange('timeToMaturity', years);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          自动计算：估值日到到期日之间的天数 / 365
        </p>
      </div>
      
      {/* 价格参数 */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">价格参数</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期初价格 ({currencySymbol})
            </label>
            <input
              type="text"
              value={localInitialPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                  setLocalInitialPrice(val);
                  const num = parseFloat(val);
                  if (!isNaN(num)) {
                    handleInitialPriceChange(num);
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">标的资产在起始日的价格</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                行权价格百分比 (%)
              </label>
              <input
                type="text"
                value={localStrikePricePercent}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                    setLocalStrikePricePercent(val);
                    const num = parseFloat(val);
                    if (!isNaN(num)) {
                      handleStrikePricePercentChange(num);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                行权价格 ({currencySymbol})
              </label>
              <input
                type="text"
                value={calculatedStrikePrice.toFixed(2)}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 交易参数 */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">交易参数</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              交易货币
            </label>
            <select
              value={currency}
              onChange={(e) => onChange('currency', e.target.value as Currency)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CNY">人民币 (CNY)</option>
              <option value="USD">美元 (USD)</option>
              <option value="HKD">港币 (HKD)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期权股数
              </label>
              <input
                type="text"
                value={localContractSize}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                    setLocalContractSize(val);
                    const num = parseFloat(val);
                    if (!isNaN(num)) {
                      handleContractSizeChange(num);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名义本金 ({currencySymbol})
              </label>
              <input
                type="text"
                value={localNotional}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                    setLocalNotional(val);
                    const num = parseFloat(val);
                    if (!isNaN(num)) {
                      handleNotionalChange(num);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            名义本金 = 期权股数 × 期初价格（两者互相自动计算）
          </p>
        </div>
      </div>
      
      {/* 市场参数 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">市场参数</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                无风险利率 (年化)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localRiskFreeRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                      setLocalRiskFreeRate(val);
                      const num = parseFloat(val);
                      if (!isNaN(num)) {
                        onChange('riskFreeRate', num / 100);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分红率 (年化)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localDividendYield}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                      setLocalDividendYield(val);
                      const num = parseFloat(val);
                      if (!isNaN(num)) {
                        onChange('dividendYield', num / 100);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              隐含波动率 (可选，覆盖标的波动率)
            </label>
            <div className="relative">
              <input
                type="text"
                value={localImpliedVolatility}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === null) {
                    setLocalImpliedVolatility('');
                    onChange('impliedVolatility', undefined);
                  } else if (/^-?\d*\.?\d{0,4}$/.test(val)) {
                    setLocalImpliedVolatility(val);
                    const num = parseFloat(val);
                    if (!isNaN(num)) {
                      onChange('impliedVolatility', num / 100);
                    }
                  }
                }}
                step={0.01}
                min={0}
                placeholder={`使用标的波动率: ${((params.underlying?.volatility || 0.2) * 100).toFixed(2)}%`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getDefaultParams(productType: ProductType): any {
  const baseUnderlying = getUnderlyings()[0] || {
    id: 'default',
    name: '默认标的',
    spotPrice: 100,
    volatility: 0.2,
  };

  const base = {
    strikePrice: 100,
    riskFreeRate: 0.05,
    timeToMaturity: 0.25,
  };

  const today = getToday();
  const expiryDate = getDateAfterMonths(3);

  switch (productType) {
    case 'vanilla':
      return { 
        underlying: baseUnderlying, 
        optionType: 'call' as const,
        direction: 'buy' as const,
        exerciseStyle: 'european' as ExerciseStyle,
        startDate: today,
        expiryDate: expiryDate,
        valuationDate: today,
        timeToMaturity: daysBetween(today, expiryDate) / 365,
        initialPrice: baseUnderlying.spotPrice,
        strikePricePercent: 100,
        strikePrice: baseUnderlying.spotPrice,
        currency: 'CNY' as Currency,
        contractSize: 10000,
        notional: 10000 * baseUnderlying.spotPrice,
        riskFreeRate: 0.03,
        dividendYield: 0,
        impliedVolatility: undefined,
      };
    case 'asian':
      return { 
        ...base, 
        underlying: baseUnderlying,
        optionType: 'call' as const, 
        averagingPeriods: 12, 
        averagingType: 'arithmetic' as const 
      };
    case 'fcn':
      return {
        notional: 1000000,
        couponRate: 0.08,
        barrier: 120,
        knockInBarrier: 80,
        underlyings: getUnderlyings().slice(0, 4),
        ...base,
        observationDates: 12,
      };
    case 'accumulator':
    case 'decumulator':
      return {
        ...base,
        notional: 1000000,
        underlying: baseUnderlying,
        upperBarrier: 110,
        lowerBarrier: 90,
        observationFrequency: 12,
        multiplier: 2,
      };
    case 'trs':
      return {
        notional: 1000000,
        underlying: baseUnderlying,
        riskFreeRate: 0.05,
        swapRate: 0.06,
        timeToMaturity: 1,
        paymentFrequency: 4, // 每季度支付
        dividendYield: 0,
        direction: 'receive' as const,
        correlation: 0,
      };
    default:
      return { ...base, underlying: baseUnderlying };
  }
}
