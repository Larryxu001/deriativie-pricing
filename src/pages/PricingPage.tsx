import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ParamInput from '../components/ParamInput';
import ResultDisplay from '../components/ResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  priceVanilla, 
  priceAsian, 
  priceFCN, 
  priceAccumulator, 
  priceDecumulator,
  priceTRS
} from '../utils/pricing';
import { saveHistory } from '../utils/history';
import type { ProductType, PricingResult } from '../types';

const productNames: Record<ProductType, string> = {
  vanilla: '香草期权',
  asian: '亚式期权',
  fcn: 'FCN',
  accumulator: 'Accumulator',
  decumulator: 'Decumulator',
  trs: 'TRS (总收益互换)',
};

export default function PricingPage() {
  const { productType } = useParams<{ productType: ProductType }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<PricingResult | null>(null);
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  if (!productType || !['vanilla', 'asian', 'fcn', 'accumulator', 'decumulator', 'trs'].includes(productType)) {
    return (
      <div className="text-center">
        <p className="text-red-600">无效的产品类型</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:underline"
        >
          返回首页
        </button>
      </div>
    );
  }

  const handleCalculate = async (params: any) => {
    setIsCalculating(true);
    setCurrentParams(params);

    try {
      let pricingResult: PricingResult;

      switch (productType) {
        case 'vanilla':
          pricingResult = priceVanilla(params);
          break;
        case 'asian':
          pricingResult = priceAsian(params);
          break;
        case 'fcn':
          pricingResult = priceFCN(params);
          break;
        case 'accumulator':
          pricingResult = priceAccumulator(params);
          break;
        case 'decumulator':
          pricingResult = priceDecumulator(params);
          break;
        case 'trs':
          pricingResult = priceTRS(params);
          break;
        default:
          throw new Error('未知的产品类型');
      }

      setResult(pricingResult);

      // 保存到历史记录
      saveHistory({
        productType,
        params,
        result: pricingResult,
      });
    } catch (error) {
      console.error('计算错误:', error);
      alert('计算过程中发生错误，请检查参数');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{productNames[productType]}</h1>
        <p className="text-gray-600 mt-2">输入参数进行定价计算</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ParamInput
            productType={productType}
            onCalculate={handleCalculate}
          />
        </div>

        <div>
          {isCalculating && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <LoadingSpinner message="正在计算价格，请稍候..." size="lg" />
            </div>
          )}

          {!isCalculating && result && currentParams && (
            <ResultDisplay
              result={result}
              params={currentParams}
              productType={productType}
              onRecalculate={() => handleCalculate(currentParams)}
            />
          )}

          {!isCalculating && !result && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              <p>输入参数后点击"计算价格"查看结果</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

