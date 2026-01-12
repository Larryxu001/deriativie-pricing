import { Link } from 'react-router-dom';
import type { ProductType } from '../types';

const products: { type: ProductType; name: string; description: string; icon: string }[] = [
  {
    type: 'vanilla',
    name: '香草期权',
    description: '标准欧式看涨/看跌期权，使用Black-Scholes模型定价',
    icon: '📊',
  },
  {
    type: 'asian',
    name: '亚式期权',
    description: '基于平均价格的期权，使用蒙特卡洛模拟定价',
    icon: '📈',
  },
  {
    type: 'fcn',
    name: 'FCN',
    description: '固定票息票据，包含敲出和敲入条款',
    icon: '💼',
  },
  {
    type: 'accumulator',
    name: 'Accumulator',
    description: '累计期权，在特定价格区间内累计收益',
    icon: '⬆️',
  },
  {
    type: 'decumulator',
    name: 'Decumulator',
    description: '累计期权（反向），与Accumulator方向相反',
    icon: '⬇️',
  },
  {
    type: 'trs',
    name: 'TRS',
    description: '总收益互换，交换标的资产总收益与固定利率',
    icon: '🔄',
  },
];

export default function Home() {
  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">衍生品定价工具</h1>
        <p className="text-xl text-gray-600">支持多种金融衍生品的定价计算和风险分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Link
            key={product.type}
            to={`/pricing/${product.type}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-blue-500"
          >
            <div className="text-4xl mb-4">{product.icon}</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
            <p className="text-gray-600 text-sm">{product.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">功能特点</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            <li>支持多种衍生品类型的定价计算</li>
            <li>实时计算Greeks（Delta, Gamma, Theta, Vega, Rho）</li>
            <li>可视化结果展示和图表分析</li>
            <li>历史记录保存和对比</li>
            <li>批量计算功能</li>
            <li>结果导出（Excel/CSV）</li>
          </ul>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">学习资源</h3>
          <p className="text-green-800 mb-3">
            想要深入了解衍生品定价原理？访问我们的研究页面，了解各种定价模型和方法。
          </p>
          <Link
            to="/research"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            前往衍生品定价研究 →
          </Link>
        </div>
      </div>
    </div>
  );
}

