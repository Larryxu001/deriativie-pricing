import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { updateUnderlyingPrice } from '../utils/underlying';
import type { PricingResult, Underlying } from '../types';

interface ResultDisplayProps {
  result: PricingResult;
  params: any;
  productType: string;
  onRecalculate?: () => void;
}

export default function ResultDisplay({ result, params, productType, onRecalculate }: ResultDisplayProps) {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  // 获取标的资产信息
  const getUnderlyings = (): Underlying[] => {
    if (productType === 'fcn' && params.underlyings) {
      return params.underlyings;
    } else if (params.underlying) {
      return [params.underlying];
    }
    return [];
  };

  const handleUpdatePrice = (id: string, price: number) => {
    updateUnderlyingPrice(id, price);
    // 更新params中的价格
    if (productType === 'fcn' && params.underlyings) {
      const updated = params.underlyings.map((u: Underlying) => 
        u.id === id ? { ...u, spotPrice: price } : u
      );
      params.underlyings = updated;
    } else if (params.underlying && params.underlying.id === id) {
      params.underlying = { ...params.underlying, spotPrice: price };
    }
    
    setEditingPriceId(null);
    if (onRecalculate) {
      onRecalculate();
    }
  };

  // 生成敏感性分析数据
  const generateSensitivityData = (_paramName: string, range: number[], baseValue: number) => {
    return range.map(value => {
      // 这里简化处理，实际应该重新计算
      return {
        spotPrice: value,
        price: result.price * (value / baseValue), // 简化示例
      };
    });
  };

  const underlyings = getUnderlyings();
  const firstUnderlying = underlyings[0];
  const spotPrice = firstUnderlying?.spotPrice || 100;
  const spotRange = Array.from({ length: 20 }, (_, i) => spotPrice * (0.7 + i * 0.03));
  const spotData = generateSensitivityData('spotPrice', spotRange, spotPrice);

  return (
    <div className="space-y-6">
      {/* 标的资产价格快速更新 */}
      {underlyings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">标的资产价格</h3>
          <div className="space-y-2">
            {underlyings.map(underlying => (
              <div key={underlying.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="font-medium">{underlying.name}</span>
                  {underlying.symbol && (
                    <span className="text-sm text-gray-500 ml-2">({underlying.symbol})</span>
                  )}
                </div>
                {editingPriceId === underlying.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                          const num = val === '' ? 0 : parseFloat(val);
                          setNewPrice(isNaN(num) ? 0 : num);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdatePrice(underlying.id, newPrice);
                        } else if (e.key === 'Escape') {
                          setEditingPriceId(null);
                        }
                      }}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdatePrice(underlying.id, newPrice)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      更新
                    </button>
                    <button
                      onClick={() => setEditingPriceId(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {underlying.spotPrice.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingPriceId(underlying.id);
                        setNewPrice(underlying.spotPrice);
                      }}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      更新价格
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 主要结果 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">定价结果</h2>
        
        {/* 总价值 */}
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-1">总期权价值</div>
          <div className="text-4xl font-bold text-blue-600">
            ¥{Math.abs(result.price).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
          {result.price < 0 && (
            <div className="text-sm text-gray-500 mt-1">（卖出期权，负值表示需要支付的保证金）</div>
          )}
        </div>

        {/* 详细分解（仅香草期权显示） */}
        {productType === 'vanilla' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {result.intrinsicValue !== undefined && (
              <div>
                <div className="text-xs text-gray-600 mb-1">内在价值</div>
                <div className="text-lg font-semibold text-gray-900">
                  ¥{result.intrinsicValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>
            )}
            {result.timeValue !== undefined && (
              <div>
                <div className="text-xs text-gray-600 mb-1">时间价值</div>
                <div className="text-lg font-semibold text-gray-900">
                  ¥{result.timeValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>
            )}
            {result.pricePerShare !== undefined && (
              <div>
                <div className="text-xs text-gray-600 mb-1">每股期权价格</div>
                <div className="text-lg font-semibold text-gray-900">
                  ¥{result.pricePerShare.toLocaleString('zh-CN', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                </div>
              </div>
            )}
            {result.contractSize !== undefined && result.quantity !== undefined && (
              <div className="md:col-span-3 text-xs text-gray-500 mt-2">
                期权规模：{result.contractSize} 股/合约 × {result.quantity} 合约
                {result.notional !== undefined && (
                  <span className="ml-2">名义本金：¥{result.notional.toLocaleString('zh-CN')}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Greeks */}
        {result.delta !== undefined && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">风险指标 (Greeks)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Delta (Δ)</div>
                <div className="text-xl font-semibold">{result.delta.toFixed(4)}</div>
                <div className="text-xs text-gray-500 mt-1">价格敏感性</div>
              </div>
              {result.gamma !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Gamma (Γ)</div>
                  <div className="text-xl font-semibold">{result.gamma.toFixed(4)}</div>
                  <div className="text-xs text-gray-500 mt-1">Delta敏感性</div>
                </div>
              )}
              {result.theta !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Theta (Θ)</div>
                  <div className="text-xl font-semibold">{result.theta.toFixed(4)}</div>
                  <div className="text-xs text-gray-500 mt-1">时间衰减/天</div>
                </div>
              )}
              {result.vega !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Vega (ν)</div>
                  <div className="text-xl font-semibold">{result.vega.toFixed(4)}</div>
                  <div className="text-xs text-gray-500 mt-1">波动率敏感性</div>
                </div>
              )}
              {result.rho !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Rho (ρ)</div>
                  <div className="text-xl font-semibold">{result.rho.toFixed(4)}</div>
                  <div className="text-xs text-gray-500 mt-1">利率敏感性</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 敏感性分析图表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">价格敏感性分析</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={spotData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="spotPrice" 
              label={{ value: '现货价格', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: '期权价格', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              labelFormatter={(label) => `现货价格: ${label.toFixed(2)}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="期权价格"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

