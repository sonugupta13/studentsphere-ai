import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MessageSquare, ThumbsUp, Trash2, Pin, Tag, Calendar,
  User, Loader, FileText, Send, Eye, Heart, Reply, X
} from 'lucide-react';

import {
  fetchPostById,
  fetchComments,
  addComment,
  deleteComment,
  togglePostLike,
  toggleCommentLike,
  deletePost,
  pinPost
} from '../redux/slices/communitySlice';

export const PostDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentPost, comments, commentsLoading, loading, error } = useSelector((state) => state.community);
  const { user } = useSelector((state) => state.auth);

  // States
  const [commentText, setCommentText] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null); // comment object
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    dispatch(fetchPostById(id));
    dispatch(fetchComments(id));
  }, [dispatch, id]);

  const handlePostLike = () => {
    dispatch(togglePostLike(id));
  };

  const handleCommentLike = (commentId) => {
    dispatch(toggleCommentLike(commentId));
  };

  const handlePostDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post? This will delete all comments.')) {
      await dispatch(deletePost(id));
      navigate('/community');
    }
  };

  const handlePinToggle = () => {
    dispatch(pinPost(id));
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await dispatch(addComment({
      postId: id,
      content: commentText,
      isAnonymous: isAnonymousComment
    }));

    setCommentText('');
    setIsAnonymousComment(false);
    dispatch(fetchComments(id)); // refresh
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTarget) return;

    await dispatch(addComment({
      postId: id,
      content: replyText,
      parentComment: replyTarget._id,
      isAnonymous: false // replies are public by default
    }));

    setReplyText('');
    setReplyTarget(null);
    dispatch(fetchComments(id));
  };

  const handleCommentDelete = async (commentId) => {
    if (window.confirm('Delete this comment? Sub-replies will also be removed.')) {
      await dispatch(deleteComment(commentId));
      dispatch(fetchComments(id));
    }
  };

  // Group comments into root comments and replies map
  const getCommentTree = () => {
    const rootComments = [];
    const repliesMap = {};

    comments.forEach(c => {
      if (!c.parentComment) {
        rootComments.push(c);
      } else {
        if (!repliesMap[c.parentComment]) {
          repliesMap[c.parentComment] = [];
        }
        repliesMap[c.parentComment].push(c);
      }
    });

    return { rootComments, repliesMap };
  };

  const { rootComments, repliesMap } = getCommentTree();

  if (loading && !currentPost) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader className="h-10 w-10 text-indigo-650 animate-spin" />
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-slate-400">
        Post not found. <Link to="/community" className="text-indigo-600 underline">Back to Feed</Link>
      </div>
    );
  }

  const isPostAuthor = currentPost.userId?._id === user?._id;
  const isPostLiked = currentPost.likes?.includes(user?._id);

  // Recursive comment component
  const CommentNode = ({ comment, isReply = false }) => {
    const hasReplies = repliesMap[comment._id] && repliesMap[comment._id].length > 0;
    const isCommentAuthor = comment.userId?._id === user?._id;
    const isCommentLiked = comment.likes?.includes(user?._id);

    return (
      <div className={`p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 relative ${isReply ? 'ml-6 sm:ml-8 border-l-2 border-l-indigo-200 dark:border-l-indigo-900' : ''}`}>
        
        {/* Header author info */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {comment.isAnonymous ? (
              <div className="h-7 w-7 bg-slate-205 dark:bg-slate-805 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs">
                ?
              </div>
            ) : (
              <Link to={`/community/profile/${comment.userId?._id}`} className="block hover:opacity-85">
                <img src={comment.userId?.avatar} alt={comment.userId?.fullName} className="h-7 w-7 rounded-full" />
              </Link>
            )}
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{comment.isAnonymous ? 'Anonymous peer' : comment.userId?.fullName}</span>
                {!comment.isAnonymous && comment.userId?.reputationLevel && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold uppercase">
                    {comment.userId.reputationLevel}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-semibold">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Delete comment */}
            {(isCommentAuthor || user?.role === 'admin') && (
              <button 
                onClick={() => handleCommentDelete(comment._id)}
                className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                title="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed pl-1 mb-3">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 pl-1">
          <button 
            onClick={() => handleCommentLike(comment._id)}
            className={`flex items-center gap-1 hover:text-indigo-650 ${isCommentLiked ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
          >
            <ThumbsUp className="h-3 w-3" /> {comment.likesCount}
          </button>
          {!isReply && (
            <button 
              onClick={() => {
                setReplyTarget(comment);
                setReplyText(`@${comment.isAnonymous ? 'Anonymous' : comment.userId?.fullName} `);
              }}
              className="flex items-center gap-1 hover:text-indigo-650"
            >
              <Reply className="h-3 w-3" /> Reply
            </button>
          )}
        </div>

        {/* Replies */}
        {hasReplies && (
          <div className="mt-3 space-y-3">
            {repliesMap[comment._id].map(reply => (
              <CommentNode key={reply._id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      
      {/* Header */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/community" className="flex items-center gap-1.5 hover:opacity-85 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4.5 w-4.5" />
            <span className="font-bold text-xs uppercase">Feed</span>
          </Link>
          <span className="font-extrabold text-sm font-outfit truncate max-w-[200px]">Thread Detail</span>
          <div className="flex gap-2">
            {/* Admin Pinned action */}
            {user?.role === 'admin' && (
              <button 
                onClick={handlePinToggle} 
                className={`p-2 rounded-xl transition-all ${currentPost.isPinned ? 'bg-amber-100 text-amber-500 dark:bg-amber-950/20' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Pin Post"
              >
                <Pin className="h-4.5 w-4.5" />
              </button>
            )}
            {/* Delete post */}
            {(isPostAuthor || user?.role === 'admin') && (
              <button 
                onClick={handlePostDelete} 
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                title="Delete Post"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main content container */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Post Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          
          {/* Author */}
          <div className="flex items-center gap-3 mb-6">
            {currentPost.isAnonymous ? (
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
                ?
              </div>
            ) : (
              <Link to={`/community/profile/${currentPost.userId?._id}`} className="block hover:opacity-85 shrink-0">
                <img src={currentPost.userId?.avatar} alt={currentPost.userId?.fullName} className="h-10 w-10 rounded-full border border-indigo-150" />
              </Link>
            )}
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>{currentPost.isAnonymous ? 'Anonymous peer' : currentPost.userId?.fullName}</span>
                {!currentPost.isAnonymous && currentPost.userId?.reputationLevel && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold uppercase">
                    {currentPost.userId.reputationLevel}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-2">
                <span>{currentPost.category}</span>
                <span>•</span>
                <span>{new Date(currentPost.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Title & Body */}
          <h1 className="text-xl sm:text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mb-4">
            {currentPost.title}
          </h1>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed mb-6 whitespace-pre-wrap">
            {currentPost.content}
          </div>

          {/* Tags */}
          {currentPost.tags && currentPost.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {currentPost.tags.map((tag, idx) => (
                <span key={idx} className="text-[10px] px-2.5 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md font-bold flex items-center gap-1">
                  <Tag className="h-3 w-3 text-slate-400" /> #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Attachment file */}
          {currentPost.attachments && currentPost.attachments.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/30 mb-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 truncate pr-4">
                <FileText className="h-6 w-6 text-indigo-500 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{currentPost.attachments[0].name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{currentPost.attachments[0].fileType} Document</div>
                </div>
              </div>
              <a 
                href={currentPost.attachments[0].url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-100 dark:border-indigo-900/35 shrink-0"
              >
                Download File
              </a>
            </div>
          )}

          {/* Post Metrics footer */}
          <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-bold text-slate-400">
            <button 
              onClick={handlePostLike}
              className={`flex items-center gap-1.5 hover:text-indigo-650 transition-colors ${
                isPostLiked ? 'text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <ThumbsUp className="h-4 w-4 animate-scale-up" /> {currentPost.likesCount} Likes
            </button>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> {currentPost.commentsCount} Comments
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> {currentPost.views} Views
            </span>
          </div>

        </div>

        {/* Comment Entry Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Add your thoughts</h3>
          
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <textarea
              required
              placeholder="Join the discussion... Type your comment"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
            ></textarea>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="comment-anonymous"
                  checked={isAnonymousComment}
                  onChange={e => setIsAnonymousComment(e.target.checked)}
                  className="rounded text-indigo-655 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                />
                <label htmlFor="comment-anonymous" className="text-[11px] font-semibold text-slate-500">Comment anonymously</label>
              </div>

              <button 
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" /> Submit Comment
              </button>
            </div>
          </form>
        </div>

        {/* Nested Comments List */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">All Remarks ({comments.length})</h3>
          
          {commentsLoading ? (
            <div className="flex justify-center py-6">
              <Loader className="h-6 w-6 text-indigo-600 animate-spin" />
            </div>
          ) : rootComments.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-xs font-bold">
              No remarks logged yet. Share your opinions first!
            </div>
          ) : (
            <div className="space-y-4">
              {rootComments.map(comment => (
                <CommentNode key={comment._id} comment={comment} />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* MODAL: Inline Comment Reply Panel */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-250">
                <Reply className="h-4 w-4 text-indigo-500" />
                Reply to {replyTarget.isAnonymous ? 'Anonymous' : replyTarget.userId?.fullName}
              </h4>
              <button 
                onClick={() => setReplyTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 italic mb-4 leading-relaxed truncate max-h-16">
              "{replyTarget.content}"
            </div>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <textarea
                required
                placeholder="Write your reply here..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
              ></textarea>
              
              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Broadcast Reply
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default PostDetails;
