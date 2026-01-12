import { useState } from 'react';
import type { Article } from '../types/research';

interface ArticleEditorProps {
  article?: Article;
  onSave: (article: Article) => void;
  onCancel: () => void;
}

const categories = ['期权定价', '结构化产品', '数值方法', '风险管理', '其他'];

export default function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || '');
  const [category, setCategory] = useState(article?.category || categories[0]);
  const [tags, setTags] = useState(article?.tags.join(', ') || '');
  const [content, setContent] = useState(article?.content || '');

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入文章标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入文章内容');
      return;
    }

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const updatedArticle: Article = {
      id: article?.id || `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      category,
      date: article?.date || new Date().toISOString().split('T')[0],
      tags: tagArray,
      content: content.trim(),
    };

    onSave(updatedArticle);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {article ? '编辑文章' : '新建文章'}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          标题 *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入文章标题"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          分类 *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          标签（用逗号分隔）
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例如：期权, Black-Scholes, 定价"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          内容 *（支持Markdown和LaTeX公式）
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="请输入文章内容，支持Markdown格式。数学公式使用 $$公式$$ 表示行内公式，$$$公式$$$ 表示块级公式。"
        />
        <p className="text-xs text-gray-500 mt-1">
          提示：使用 $$公式$$ 表示行内公式，$$$公式$$$ 表示块级公式。例如：$$E=mc^2$$ 或使用块级公式显示复杂数学表达式
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          取消
        </button>
      </div>
    </div>
  );
}

