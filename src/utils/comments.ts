export interface Comment {
  id: string;
  articleId: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'note'; // comment是评论，note是个人笔记
}

const STORAGE_KEY = 'derivative_research_comments';

/**
 * 获取文章的所有评论/笔记
 */
export function getComments(articleId: string): Comment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allComments = JSON.parse(stored);
    const comments = allComments
      .filter((c: any) => c.articleId === articleId)
      .map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp),
      }));
    
    // 按时间排序（最新的在前）
    return comments.sort((a: Comment, b: Comment) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  } catch {
    return [];
  }
}

/**
 * 保存评论/笔记
 */
export function saveComment(comment: Omit<Comment, 'id' | 'timestamp'>): Comment {
  const allComments = getAllComments();
  const newComment: Comment = {
    ...comment,
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };
  
  allComments.push(newComment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allComments));
  
  return newComment;
}

/**
 * 删除评论/笔记
 */
export function deleteComment(commentId: string): void {
  const allComments = getAllComments();
  const filtered = allComments.filter((c: any) => c.id !== commentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 获取所有评论（内部使用）
 */
function getAllComments(): any[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * 获取所有笔记（个人笔记）
 */
export function getAllNotes(): Comment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allComments = JSON.parse(stored);
    return allComments
      .filter((c: any) => c.type === 'note')
      .map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp),
      }))
      .sort((a: Comment, b: Comment) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
  } catch {
    return [];
  }
}

