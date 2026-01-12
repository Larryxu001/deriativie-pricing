import { useState } from 'react';
import ParamInput from '../components/ParamInput';
import { 
  priceVanilla, 
  priceAsian, 
  priceFCN, 
  priceAccumulator, 
  priceDecumulator,
  priceTRS
} from '../utils/pricing';
import { exportToExcel } from '../utils/export';
import type { ProductType, PricingResult, HistoryRecord } from '../types';

interface BatchResult {
  params: any;
  result: PricingResult;
  productType: ProductType;
}

export default function BatchPage() {
  const [selectedType, setSelectedType] = useState<ProductType>('vanilla');
  const [baseParams, setBaseParams] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleParamsSet = (params: any) => {
    setBaseParams(params);
  };

  const handleBatchCalculate = async () => {
    if (!baseParams) {
      alert('请先设置基础参数');
      return;
    }

    setIsCalculating(true);
    const results: BatchResult[] = [];

    // 获取基础现货价格
    let baseSpotPrice: number;
    if (selectedType === 'fcn' && baseParams.underlyings && baseParams.underlyings.length > 0) {
      baseSpotPrice = baseParams.underlyings[0].spotPrice;
    } else if (baseParams.underlying) {
      baseSpotPrice = baseParams.underlying.spotPrice;
    } else {
      alert('请先选择标的资产');
      setIsCalculating(false);
      return;
    }

    // 生成多个参数组合（示例：改变现货价格）
    const spotPrices = Array.from({ length: 10 }, (_, i) => 
      baseSpotPrice * (0.8 + i * 0.04)
    );

    for (const spotPrice of spotPrices) {
      const modifiedParams = { ...baseParams };
      
      // 更新标的资产价格
      if (selectedType === 'fcn' && modifiedParams.underlyings) {
        modifiedParams.underlyings = modifiedParams.underlyings.map((u: any) => ({
          ...u,
          spotPrice: spotPrice,
        }));
      } else if (modifiedParams.underlying) {
        modifiedParams.underlying = {
          ...modifiedParams.underlying,
          spotPrice: spotPrice,
        };
      }
      
      let result: PricingResult;

      try {
        switch (selectedType) {
          case 'vanilla':
            result = priceVanilla(modifiedParams);
            break;
          case 'asian':
            result = priceAsian(modifiedParams);
            break;
          case 'fcn':
            result = priceFCN(modifiedParams);
            break;
          case 'accumulator':
            result = priceAccumulator(modifiedParams);
            break;
          case 'decumulator':
            result = priceDecumulator(modifiedParams);
            break;
          case 'trs':
            result = priceTRS(modifiedParams);
            break;
          default:
            continue;
        }

        results.push({
          params: modifiedParams,
          result,
          productType: selectedType,
        });
      } catch (error) {
        console.error('计算错误:', error);
      }
    }

    setBatchResults(results);
    setIsCalculating(false);
  };

  const handleExport = () => {
    const historyRecords: HistoryRecord[] = batchResults.map((br, idx) => ({
      id: `batch_${Date.now()}_${idx}`,
      timestamp: new Date(),
      productType: br.productType,
      params: br.params,
      result: br.result,
    }));
    exportToExcel(historyRecords);
  };

  // const productNames: Record<ProductType, string> = {
  //   vanilla: '香草期权',
  //   asian: '亚式期权',
  //   fcn: 'FCN',
  //   accumulator: 'Accumulator',
  //   decumulator: 'Decumulator',
  // };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">衍生品定价</h1>
        <p className="text-gray-600 mt-2">基于基础参数生成多个参数组合并批量计算</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择产品类型
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as ProductType);
                setBaseParams(null);
                setBatchResults([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vanilla">香草期权</option>
              <option value="asian">亚式期权</option>
              <option value="fcn">FCN</option>
              <option value="accumulator">Accumulator</option>
              <option value="decumulator">Decumulator</option>
              <option value="trs">TRS</option>
            </select>
          </div>
          <ParamInput
            productType={selectedType}
            onCalculate={handleParamsSet}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">批量计算设置</h2>
          {baseParams ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                将基于当前参数，生成10个不同的现货价格组合（从基础价格的80%到120%）进行批量计算。
              </p>
              <button
                onClick={handleBatchCalculate}
                disabled={isCalculating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isCalculating ? '计算中...' : '开始批量计算'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              请先设置基础参数
            </p>
          )}
        </div>
      </div>

      {batchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">批量计算结果</h2>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              导出Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">现货价格</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">期权价格</th>
                  {batchResults[0]?.result.delta !== undefined && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gamma</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vega</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rho</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batchResults.map((br, idx) => {
                  const spotPrice = selectedType === 'fcn' && br.params.underlyings?.[0]
                    ? br.params.underlyings[0].spotPrice
                    : br.params.underlying?.spotPrice || 0;
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{spotPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {br.result.price.toFixed(4)}
                      </td>
                    {br.result.delta !== undefined && (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-600">{br.result.delta.toFixed(4)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{br.result.gamma?.toFixed(4) || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{br.result.theta?.toFixed(4) || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{br.result.vega?.toFixed(4) || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{br.result.rho?.toFixed(4) || '-'}</td>
                      </>
                    )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
