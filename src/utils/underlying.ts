import type { Underlying } from '../types';

const STORAGE_KEY = 'derivative_underlyings';

/**
 * 获取所有标的资产
 */
export function getUnderlyings(): Underlying[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // 返回默认标的资产
      return getDefaultUnderlyings();
    }
    return JSON.parse(stored);
  } catch {
    return getDefaultUnderlyings();
  }
}

/**
 * 保存标的资产列表
 */
export function saveUnderlyings(underlyings: Underlying[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(underlyings));
}

/**
 * 添加或更新标的资产
 */
export function saveUnderlying(underlying: Underlying): void {
  const underlyings = getUnderlyings();
  const index = underlyings.findIndex(u => u.id === underlying.id);
  
  if (index >= 0) {
    underlyings[index] = underlying;
  } else {
    underlyings.push(underlying);
  }
  
  saveUnderlyings(underlyings);
}

/**
 * 更新标的资产价格
 */
export function updateUnderlyingPrice(id: string, price: number): void {
  const underlyings = getUnderlyings();
  const underlying = underlyings.find(u => u.id === id);
  
  if (underlying) {
    underlying.spotPrice = price;
    saveUnderlyings(underlyings);
  }
}

/**
 * 更新标的资产波动率
 */
export function updateUnderlyingVolatility(id: string, volatility: number): void {
  const underlyings = getUnderlyings();
  const underlying = underlyings.find(u => u.id === id);
  
  if (underlying) {
    underlying.volatility = volatility;
    saveUnderlyings(underlyings);
  }
}

/**
 * 删除标的资产
 */
export function deleteUnderlying(id: string): void {
  const underlyings = getUnderlyings();
  const filtered = underlyings.filter(u => u.id !== id);
  saveUnderlyings(filtered);
}

/**
 * 根据ID获取标的资产
 */
export function getUnderlyingById(id: string): Underlying | undefined {
  return getUnderlyings().find(u => u.id === id);
}

/**
 * 获取默认标的资产列表
 */
function getDefaultUnderlyings(): Underlying[] {
  return [
    {
      id: 'default-1',
      name: '标的资产1',
      spotPrice: 100,
      volatility: 0.2,
      symbol: 'ASSET1',
    },
    {
      id: 'default-2',
      name: '标的资产2',
      spotPrice: 100,
      volatility: 0.2,
      symbol: 'ASSET2',
    },
    {
      id: 'default-3',
      name: '标的资产3',
      spotPrice: 100,
      volatility: 0.2,
      symbol: 'ASSET3',
    },
    {
      id: 'default-4',
      name: '标的资产4',
      spotPrice: 100,
      volatility: 0.2,
      symbol: 'ASSET4',
    },
  ];
}

/**
 * 创建新的标的资产
 */
export function createUnderlying(name: string, spotPrice: number, volatility: number, symbol?: string): Underlying {
  return {
    id: `underlying-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    spotPrice,
    volatility,
    symbol,
  };
}

