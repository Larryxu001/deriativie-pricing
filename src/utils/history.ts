import type { HistoryRecord, ProductType } from '../types';

const STORAGE_KEY = 'derivative_pricing_history';

/**
 * 保存历史记录到本地存储
 */
export function saveHistory(record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord {
  const history = getHistory();
  const newRecord: HistoryRecord = {
    ...record,
    id: Date.now().toString(),
    timestamp: new Date(),
  };
  
  history.unshift(newRecord);
  // 只保留最近100条记录
  const limitedHistory = history.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  
  return newRecord;
}

/**
 * 获取所有历史记录
 */
export function getHistory(): HistoryRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    // 转换日期字符串为Date对象
    return history.map((record: any) => ({
      ...record,
      timestamp: new Date(record.timestamp),
    }));
  } catch {
    return [];
  }
}

/**
 * 删除历史记录
 */
export function deleteHistory(id: string): void {
  const history = getHistory();
  const filtered = history.filter(record => record.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 清空所有历史记录
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 根据产品类型筛选历史记录
 */
export function filterHistoryByType(type: ProductType): HistoryRecord[] {
  return getHistory().filter(record => record.productType === type);
}

