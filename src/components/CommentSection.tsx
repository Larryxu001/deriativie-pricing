import { useState, useEffect } from 'react';
import { getComments, saveComment, deleteComment, getAllNotes } from '../utils/comments';
import type { Comment } from '../utils/comments';

interface CommentSectionProps {
  articleId: string;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [commentType, setCommentType] = useState<'comment' | 'note'>('comment');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    loadComments();
    // 从localStorage获取作者名称
    const savedAuthor = localStorage.getItem('comment_author') || '';
    if (savedAuthor) {
      setAuthor(savedAuthor);
    }
  }, [articleId]);

  const loadComments = () => {
    if (showNotes) {
      setComments(getAllNotes());
    } else {
      setComments(getComments(articleId));
    }
  };

  const handleSubmit = () => {
    if (!newComment.trim()) {
      alert('请输入评论内容');
      return;
    }
    if (!author.trim()) {
      alert('请输入您的姓名');
      return;
    }

    saveComment({
      articleId: showNotes ? '' : articleId,
      author: author.trim(),
      content: newComment.trim(),
      type: commentType,
    });

    // 保存作者名称
    localStorage.setItem('comment_author', author.trim());

    setNewComment('');
    loadComments();
  };

  const handleDelete = (commentId: string) => {
    if (confirm('确定要删除这条' + (commentType === 'note' ? '笔记' : '评论') + '吗？')) {
      deleteComment(commentId);
      loadComments();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {showNotes ? '我的笔记' : '评论与笔记'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowNotes(false);
              loadComments();
            }}
            className={`px-3 py-1 rounded text-sm ${
              !showNotes
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            文章评论
          </button>
          <button
            onClick={() => {
              setShowNotes(true);
              loadComments();
            }}
            className={`px-3 py-1 rounded text-sm ${
              showNotes
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            我的笔记
          </button>
        </div>
      </div>

      {/* 评论输入框 */}
      <div className="mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            您的姓名
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入您的姓名"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {commentType === 'note' ? '笔记内容' : '评论内容'}
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={commentType === 'note' ? '记录您的学习笔记...' : '写下您的评论...'}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="comment"
              name="type"
              checked={commentType === 'comment'}
              onChange={() => setCommentType('comment')}
            />
            <label htmlFor="comment" className="text-sm text-gray-700">公开评论</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="note"
              name="type"
              checked={commentType === 'note'}
              onChange={() => setCommentType('note')}
            />
            <label htmlFor="note" className="text-sm text-gray-700">个人笔记</label>
          </div>
          <button
            onClick={handleSubmit}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            发布
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {showNotes ? '暂无笔记，开始记录您的学习心得吧！' : '暂无评论，成为第一个评论者吧！'}
          </p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.type === 'note'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900">{comment.author}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {comment.timestamp.toLocaleString('zh-CN')}
                  </span>
                  {comment.type === 'note' && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                      笔记
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  删除
                </button>
              </div>
              <div className="text-gray-700 whitespace-pre-wrap">{comment.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

