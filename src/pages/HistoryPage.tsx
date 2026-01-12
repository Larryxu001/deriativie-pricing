import { useState, useEffect } from 'react';
import { getHistory, deleteHistory, clearHistory, filterHistoryByType } from '../utils/history';
import { exportToExcel, exportToCSV } from '../utils/export';
import type { HistoryRecord, ProductType } from '../types';
import { format } from 'date-fns';

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');

  useEffect(() => {
    loadHistory();
  }, [filterType]);

  const loadHistory = () => {
    const allHistory = getHistory();
    if (filterType === 'all') {
      setHistory(allHistory);
    } else {
      setHistory(filterHistoryByType(filterType));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteHistory(id);
      loadHistory();
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      clearHistory();
      loadHistory();
    }
  };

  const handleExportExcel = () => {
    exportToExcel(history);
  };

  const handleExportCSV = () => {
    exportToCSV(history);
  };

  const productNames: Record<ProductType, string> = {
    vanilla: '香草期权',
    asian: '亚式期权',
    fcn: 'FCN',
    accumulator: 'Accumulator',
    decumulator: 'Decumulator',
    trs: 'TRS',
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">历史记录</h1>
          <p className="text-gray-600 mt-2">查看和管理之前的定价计算结果</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部产品</option>
            <option value="vanilla">香草期权</option>
            <option value="asian">亚式期权</option>
            <option value="fcn">FCN</option>
            <option value="accumulator">Accumulator</option>
            <option value="decumulator">Decumulator</option>
            <option value="trs">TRS</option>
          </select>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            导出Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            导出CSV
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            清空全部
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">暂无历史记录</p>
          <p className="text-gray-400 mt-2">开始计算定价后，结果会自动保存到这里</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(record => (
            <div
              key={record.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {productNames[record.productType]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(record.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ¥{record.result.price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>
                  {record.result.delta !== undefined && (
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>Delta: {record.result.delta.toFixed(4)}</span>
                      {record.result.gamma !== undefined && (
                        <span>Gamma: {record.result.gamma.toFixed(4)}</span>
                      )}
                      {record.result.theta !== undefined && (
                        <span>Theta: {record.result.theta.toFixed(4)}</span>
                      )}
                      {record.result.vega !== undefined && (
                        <span>Vega: {record.result.vega.toFixed(4)}</span>
                      )}
                      {record.result.rho !== undefined && (
                        <span>Rho: {record.result.rho.toFixed(4)}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

