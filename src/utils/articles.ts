import type { Article } from '../types/research';

const STORAGE_KEY = 'derivative_research_articles';
const DEFAULT_ARTICLES_KEY = 'derivative_research_default_articles_loaded';

/**
 * 获取所有文章
 */
export function getArticles(): Article[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * 保存文章列表
 */
export function saveArticles(articles: Article[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

/**
 * 获取单篇文章
 */
export function getArticleById(id: string): Article | undefined {
  return getArticles().find(a => a.id === id);
}

/**
 * 保存或更新文章
 */
export function saveArticle(article: Article): void {
  const articles = getArticles();
  const index = articles.findIndex(a => a.id === article.id);
  
  if (index >= 0) {
    articles[index] = article;
  } else {
    articles.push(article);
  }
  
  saveArticles(articles);
}

/**
 * 删除文章
 */
export function deleteArticle(id: string): void {
  const articles = getArticles();
  const filtered = articles.filter(a => a.id !== id);
  saveArticles(filtered);
}

/**
 * 创建新文章
 */
export function createArticle(
  title: string,
  category: string,
  content: string,
  tags: string[] = []
): Article {
  return {
    id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    category,
    date: new Date().toISOString().split('T')[0],
    tags,
    content,
  };
}

/**
 * 检查是否已加载默认文章
 */
export function hasDefaultArticlesLoaded(): boolean {
  return localStorage.getItem(DEFAULT_ARTICLES_KEY) === 'true';
}

/**
 * 标记默认文章已加载
 */
export function markDefaultArticlesLoaded(): void {
  localStorage.setItem(DEFAULT_ARTICLES_KEY, 'true');
}

