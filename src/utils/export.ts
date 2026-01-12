import * as XLSX from 'xlsx';
import type { HistoryRecord } from '../types';

/**
 * 导出历史记录为Excel
 */
export function exportToExcel(records: HistoryRecord[]): void {
  const data = records.map(record => ({
    时间: record.timestamp.toLocaleString('zh-CN'),
    产品类型: record.productType,
    价格: record.result.price.toFixed(4),
    Delta: record.result.delta?.toFixed(4) || '-',
    Gamma: record.result.gamma?.toFixed(4) || '-',
    Theta: record.result.theta?.toFixed(4) || '-',
    Vega: record.result.vega?.toFixed(4) || '-',
    Rho: record.result.rho?.toFixed(4) || '-',
    参数: JSON.stringify(record.params),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '定价历史');
  
  const fileName = `衍生品定价历史_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 导出为CSV
 */
export function exportToCSV(records: HistoryRecord[]): void {
  const headers = ['时间', '产品类型', '价格', 'Delta', 'Gamma', 'Theta', 'Vega', 'Rho', '参数'];
  const rows = records.map(record => [
    record.timestamp.toLocaleString('zh-CN'),
    record.productType,
    record.result.price.toFixed(4),
    record.result.delta?.toFixed(4) || '',
    record.result.gamma?.toFixed(4) || '',
    record.result.theta?.toFixed(4) || '',
    record.result.vega?.toFixed(4) || '',
    record.result.rho?.toFixed(4) || '',
    JSON.stringify(record.params),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `衍生品定价历史_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

