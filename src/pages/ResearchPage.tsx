import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { getArticles, saveArticle, deleteArticle, hasDefaultArticlesLoaded, markDefaultArticlesLoaded } from '../utils/articles';
import ArticleEditor from '../components/ArticleEditor';
import CommentSection from '../components/CommentSection';
import type { Article } from '../types/research';

// 默认知识文章数据（仅在首次加载时使用）
const defaultArticles: Article[] = [
  {
    id: 'vanilla-pricing',
    title: '香草期权定价：Black-Scholes模型',
    category: '期权定价',
    date: '2024-01-01',
    tags: ['香草期权', 'Black-Scholes', '解析解'],
    content: `# 香草期权定价：Black-Scholes模型

## 概述

香草期权（Vanilla Options）是最基础的期权类型，包括看涨期权（Call Option）和看跌期权（Put Option）。Black-Scholes模型是期权定价的经典模型，由Fischer Black、Myron Scholes和Robert Merton在1973年提出。

## Black-Scholes模型假设

Black-Scholes模型基于以下假设：

1. **标的资产价格遵循几何布朗运动**：价格变化是连续的，且服从对数正态分布
2. **无风险利率恒定**：在期权存续期内，无风险利率保持不变
3. **波动率恒定**：标的资产的波动率在期权存续期内保持不变
4. **无交易成本**：不考虑交易费用、税收等
5. **无分红**：标的资产在期权存续期内不支付股息
6. **市场完全有效**：可以随时进行买卖，且可以卖空

## Black-Scholes公式

### 看涨期权价格

$$$C = S_0 N(d_1) - K e^{-rT} N(d_2)$$$

### 看跌期权价格

$$$P = K e^{-rT} N(-d_2) - S_0 N(-d_1)$$$

其中：

- $S_0$：标的资产当前价格
- $K$：执行价格
- $r$：无风险利率（年化）
- $T$：到期时间（年）
- $\\sigma$：波动率（年化）
- $N(x)$：标准正态分布的累积分布函数

### 辅助变量

$$$d_1 = \\frac{\\ln(S_0/K) + (r + \\sigma^2/2)T}{\\sigma\\sqrt{T}}$$$

$$$d_2 = d_1 - \\sigma\\sqrt{T}$$$

## Greeks（风险指标）

### Delta（Δ）

Delta衡量期权价格对标的资产价格变化的敏感性：

- 看涨期权：$\\Delta = N(d_1)$，范围在0到1之间
- 看跌期权：$\\Delta = N(d_1) - 1$，范围在-1到0之间

### Gamma（Γ）

Gamma衡量Delta对标的资产价格变化的敏感性：

$$$\\Gamma = \\frac{N'(d_1)}{S_0 \\sigma \\sqrt{T}}$$$

### Theta（Θ）

Theta衡量期权价格对时间衰减的敏感性（每天）：

$$$\\Theta_{call} = -\\frac{S_0 N'(d_1) \\sigma}{2\\sqrt{T}} - rK e^{-rT} N(d_2)$$$

$$$\\Theta_{put} = -\\frac{S_0 N'(d_1) \\sigma}{2\\sqrt{T}} + rK e^{-rT} N(-d_2)$$$

### Vega（ν）

Vega衡量期权价格对波动率变化的敏感性（1%波动率变化）：

$$$\\nu = S_0 N'(d_1) \\sqrt{T} / 100$$$

### Rho（ρ）

Rho衡量期权价格对利率变化的敏感性（1%利率变化）：

$$$\\rho_{call} = K T e^{-rT} N(d_2) / 100$$$

$$$\\rho_{put} = -K T e^{-rT} N(-d_2) / 100$$$

## 模型局限性

1. **假设过于理想化**：实际市场中波动率不是常数，存在波动率微笑/偏斜
2. **不适用于美式期权**：Black-Scholes模型适用于欧式期权，美式期权需要其他方法
3. **不考虑跳跃**：假设价格连续变化，无法处理价格跳跃
4. **不适用于高波动率环境**：在极端市场条件下可能失效

## 应用场景

Black-Scholes模型广泛应用于：
- 欧式期权定价
- 风险管理（计算Greeks）
- 期权交易策略设计
- 学术研究和教学`,
  },
  {
    id: 'asian-pricing',
    title: '亚式期权定价：蒙特卡洛模拟方法',
    category: '期权定价',
    date: '2024-01-02',
    tags: ['亚式期权', '蒙特卡洛', '路径依赖'],
    content: `# 亚式期权定价：蒙特卡洛模拟方法

## 概述

亚式期权（Asian Options）是一种路径依赖型期权，其收益取决于标的资产在期权存续期内的平均价格，而不是到期时的价格。这使得亚式期权比香草期权更便宜，因为平均价格比单一价格更稳定。

## 亚式期权的类型

### 按平均方式分类

1. **算术平均亚式期权**：使用算术平均价格
   $$$A_{arithmetic} = \\frac{1}{n} \\sum_{i=1}^{n} S_i$$$

2. **几何平均亚式期权**：使用几何平均价格
   $$$A_{geometric} = \\sqrt[n]{\\prod_{i=1}^{n} S_i} = \\exp\\left(\\frac{1}{n}\\sum_{i=1}^{n} \\ln S_i\\right)$$$

### 按执行方式分类

1. **平均价格期权**：收益 = max(平均价格 - 执行价格, 0)
2. **平均执行价格期权**：执行价格是平均价格

## 定价方法：蒙特卡洛模拟

由于亚式期权的路径依赖特性，通常无法获得解析解，需要使用数值方法。蒙特卡洛模拟是最常用的方法之一。

### 基本原理

1. **生成价格路径**：使用几何布朗运动模拟标的资产价格路径
2. **计算平均价格**：根据观察日计算平均价格
3. **计算收益**：根据平均价格和执行价格计算期权收益
4. **贴现**：将收益贴现到当前时点
5. **重复模拟**：进行大量模拟（通常50,000次以上）
6. **取平均值**：所有模拟结果的平均值即为期权价格

### 价格路径模拟

使用几何布朗运动模型：

$$$S_{t+\\Delta t} = S_t \\exp\\left((r - \\frac{1}{2}\\sigma^2)\\Delta t + \\sigma\\sqrt{\\Delta t} Z\\right)$$$

其中：
- $S_t$：时刻t的标的资产价格
- $r$：无风险利率
- $\\sigma$：波动率
- $\\Delta t$：时间步长
- $Z$：标准正态分布随机数

### 收益计算

对于看涨期权：

$$$Payoff = \\max(A - K, 0)$$$

对于看跌期权：

$$$Payoff = \\max(K - A, 0)$$$

其中$A$是平均价格，$K$是执行价格。

### 期权价格

$$$Price = e^{-rT} \\mathbb{E}[Payoff]$$$

通过蒙特卡洛模拟估计期望值：

$$$Price \\approx e^{-rT} \\frac{1}{N} \\sum_{i=1}^{N} Payoff_i$$$

其中$N$是模拟次数。`,
  },
  {
    id: 'fcn-pricing',
    title: 'FCN定价：固定票息票据的蒙特卡洛定价',
    category: '结构化产品',
    date: '2024-01-03',
    tags: ['FCN', '结构化产品', '敲出敲入', '蒙特卡洛'],
    content: `# FCN定价：固定票息票据的蒙特卡洛定价

## 概述

FCN（Fixed Coupon Note，固定票息票据）是一种结构化产品，结合了固定收益和衍生品特征。投资者可以获得固定的票息收入，但同时承担标的资产价格波动的风险。

## FCN的基本结构

### 产品特征

1. **名义本金**：投资的本金金额
2. **票息率**：定期支付的固定票息（通常按年化计算）
3. **标的资产**：可以是一个或多个标的资产（本系统支持最多4个）
4. **敲出障碍**：如果标的资产价格达到此水平，产品提前终止
5. **敲入障碍**：如果标的资产价格跌破此水平，可能触发本金损失

### 收益结构

1. **正常情况**：定期获得票息，到期返还本金
2. **敲出情况**：产品提前终止，返还本金（可能损失未付票息）
3. **敲入情况**：如果发生敲入，到期时可能损失部分或全部本金

## 定价方法：蒙特卡洛模拟

### 多标的资产模拟

当FCN涉及多个标的资产时，需要考虑标的资产之间的相关性。使用Cholesky分解生成相关的随机数。

### 模拟步骤

1. **初始化**：设置每个标的资产的初始价格
2. **生成相关随机数**：使用相关系数矩阵生成相关的随机变量
3. **模拟价格路径**：对每个标的资产，使用几何布朗运动模拟价格路径
4. **检查敲出**：在每个时间步检查是否有标的资产达到敲出障碍
5. **检查敲入**：检查是否有标的资产跌破敲入障碍
6. **计算收益**：根据敲出/敲入情况计算最终收益
7. **贴现**：将收益贴现到当前时点
8. **重复模拟**：进行大量模拟并取平均值`,
  },
  {
    id: 'accumulator-pricing',
    title: 'Accumulator定价：累计期权的蒙特卡洛定价',
    category: '结构化产品',
    date: '2024-01-04',
    tags: ['Accumulator', '累计期权', '杠杆', '蒙特卡洛'],
    content: `# Accumulator定价：累计期权的蒙特卡洛定价

## 概述

Accumulator（累计期权）是一种杠杆化的结构化产品，允许投资者在特定价格区间内以折扣价格定期买入标的资产。如果标的资产价格突破上限，产品可能提前终止并产生损失。

## Accumulator的基本结构

### 产品特征

1. **名义本金**：投资的本金金额
2. **执行价格**：通常低于当前市场价格（折扣价）
3. **上限障碍**：如果标的资产价格达到此水平，产品提前终止
4. **下限障碍**：如果标的资产价格跌破此水平，可能触发额外损失
5. **杠杆倍数**：收益和损失的放大倍数
6. **观察频率**：定期观察标的资产价格（如每月、每周）

### 收益机制

1. **正常情况**：在观察日，如果标的资产价格高于执行价格，投资者获得收益
2. **上限敲出**：如果标的资产价格达到上限，产品提前终止，可能产生损失
3. **下限触发**：如果标的资产价格跌破下限，投资者承担损失

## 定价方法：蒙特卡洛模拟

### 收益计算公式

在每个观察日：

- 如果 $S_t > K$（价格高于执行价）：
  $$$Return_t = \\frac{S_t - K}{K} \\times Multiplier$$$

- 如果 $S_t < LowerBarrier$（价格低于下限）：
  $$$Return_t = \\frac{S_t - K}{K} \\times Multiplier$$$

- 否则：$Return_t = 0$

最终收益：

$$$Payoff = Notional \\times \\left(1 + \\sum_{t} Return_t\\right)$$$`,
  },
  {
    id: 'monte-carlo-basics',
    title: '蒙特卡洛模拟基础',
    category: '数值方法',
    date: '2024-01-05',
    tags: ['蒙特卡洛', '数值方法', '随机模拟'],
    content: `# 蒙特卡洛模拟基础

## 概述

蒙特卡洛模拟（Monte Carlo Simulation）是一种基于随机抽样的数值方法，广泛应用于金融衍生品定价、风险评估和投资组合优化等领域。

## 基本原理

蒙特卡洛方法的核心思想是：通过大量随机抽样来估计一个难以直接计算的数学期望值。

### 数学基础

如果要计算：

$$$E[f(X)] = \\int f(x) p(x) dx$$$

其中$X$是随机变量，$p(x)$是概率密度函数。

蒙特卡洛估计为：

$$$E[f(X)] \\approx \\frac{1}{N} \\sum_{i=1}^{N} f(X_i)$$$

其中$X_i$是从分布$p(x)$中独立抽取的样本。

## 在金融中的应用

### 期权定价

对于路径依赖型期权，期望收益为：

$$$Price = e^{-rT} \\mathbb{E}[Payoff(S_T)]$$$

通过模拟$N$条价格路径：

$$$Price \\approx e^{-rT} \\frac{1}{N} \\sum_{i=1}^{N} Payoff(S_T^{(i)})$$$

### 几何布朗运动模拟

标的资产价格遵循：

$$$dS = rS dt + \\sigma S dW$$$

离散化形式：

$$$S_{t+\\Delta t} = S_t \\exp\\left((r - \\frac{1}{2}\\sigma^2)\\Delta t + \\sigma\\sqrt{\\Delta t} Z\\right)$$$

其中$Z \\sim N(0,1)$是标准正态分布随机数。`,
  },
];

export default function ResearchPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = () => {
    // 首次加载时，如果还没有加载过默认文章，则加载
    if (!hasDefaultArticlesLoaded()) {
      defaultArticles.forEach(article => {
        saveArticle(article);
      });
      markDefaultArticlesLoaded();
    }
    setArticles(getArticles());
  };

  const categories = ['全部', ...Array.from(new Set(articles.map(a => a.category)))];

  const filteredArticles = articles.filter(article => {
    const matchCategory = selectedCategory === '全部' || article.category === selectedCategory;
    const matchSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleSaveArticle = (article: Article) => {
    saveArticle(article);
    loadArticles();
    setShowEditor(false);
    setEditingArticle(undefined);
    if (selectedArticle?.id === article.id) {
      setSelectedArticle(article);
    }
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm('确定要删除这篇文章吗？')) {
      deleteArticle(id);
      loadArticles();
      if (selectedArticle?.id === id) {
        setSelectedArticle(null);
      }
    }
  };

  const handleNewArticle = () => {
    setEditingArticle(undefined);
    setShowEditor(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setShowEditor(true);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">研究</h1>
          <p className="text-gray-600 mt-2">深入了解各种衍生品的定价原理和方法</p>
        </div>
        <button
          onClick={handleNewArticle}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + 新建文章
        </button>
      </div>

      {showEditor ? (
        <ArticleEditor
          article={editingArticle}
          onSave={handleSaveArticle}
          onCancel={() => {
            setShowEditor(false);
            setEditingArticle(undefined);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 侧边栏：文章列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              {/* 搜索框 */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 分类筛选 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 文章列表 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">文章列表 ({filteredArticles.length})</h3>
                {filteredArticles.map(article => (
                  <div
                    key={article.id}
                    className={`p-3 rounded-md transition-colors ${
                      selectedArticle?.id === article.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left"
                    >
                      <div className="font-medium text-sm text-gray-900">{article.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{article.date}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditArticle(article);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArticle(article.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 主内容区：文章详情 */}
          <div className="lg:col-span-2">
            {selectedArticle ? (
              <>
                <div className="bg-white rounded-lg shadow-md p-8">
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-3xl font-bold text-gray-900">{selectedArticle.title}</h2>
                      <button
                        onClick={() => handleEditArticle(selectedArticle)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        编辑
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {selectedArticle.category}
                      </span>
                      <span>{selectedArticle.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedArticle.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        // 处理 $$$...$$$ 块级公式
                        p: ({ children }) => {
                          if (typeof children === 'string' && children.startsWith('$$$') && children.endsWith('$$$')) {
                            return <div className="my-4">{children}</div>;
                          }
                          return <p className="mb-3 leading-relaxed">{children}</p>;
                        },
                      }}
                    >
                      {selectedArticle.content.replace(/\$\$\$/g, '$$')}
                    </ReactMarkdown>
                  </div>
                </div>
                <CommentSection articleId={selectedArticle.id} />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">请从左侧选择一篇文章开始阅读</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
