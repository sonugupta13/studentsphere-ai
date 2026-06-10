import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Send, Users, Info, X, Trash2, Loader, MessageSquare } from 'lucide-react';

import {
  fetchDiscussionById,
  addDiscussionReply,
  deleteDiscussion,
  receiveLiveDiscussionReply
} from '../redux/slices/communitySlice';

export const DiscussionRoom = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentDiscussion, loading } = useSelector((state) => state.community);
  const { user } = useSelector((state) => state.auth);

  // States
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  // Establish socket connections for live chat room
  useEffect(() => {
    // Connect to backend socket origin
    const socket = io('http://localhost:5000', { withCredentials: true });
    socketRef.current = socket;

    // Join discussion room
    socket.emit('join_discussion', id);

    // Listen for live messages broadcasted from server
    socket.on('discussion_message', (msg) => {
      // Dispatch directly to redux slice state to update feed
      dispatch(receiveLiveDiscussionReply(msg));
    });

    // Initial fetch details
    dispatch(fetchDiscussionById(id));

    return () => {
      // Leave room and close socket
      if (socketRef.current) {
        socketRef.current.emit('leave_discussion', id);
        socketRef.current.disconnect();
      }
    };
  }, [dispatch, id]);

  // Auto Scroll to Bottom on new replies
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentDiscussion?.replies]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Post to REST API (database) -> controller will save and broadcast
    await dispatch(addDiscussionReply({ id, content: inputText }));
    setInputText('');
  };

  const handleThreadDelete = async () => {
    if (window.confirm('Are you sure you want to close and delete this discussion thread?')) {
      await dispatch(deleteDiscussion(id));
      navigate('/community');
    }
  };

  if (loading && !currentDiscussion) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!currentDiscussion) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-slate-400">
        Discussion not found. <Link to="/community" className="text-indigo-600 underline">Back to Forums</Link>
      </div>
    );
  }

  const isOwner = currentDiscussion.userId?._id === user?._id;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200 h-screen overflow-hidden">
      
      {/* Header bar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/community" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4.5 w-4.5" />
            <span className="font-bold text-xs uppercase hidden sm:inline">Forums</span>
          </Link>
          <div className="flex-1 text-center px-4 min-w-0">
            <h2 className="text-sm font-extrabold font-outfit text-slate-900 dark:text-white truncate">
              {currentDiscussion.title}
            </h2>
            <div className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>{currentDiscussion.category} Room</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {currentDiscussion.participants?.length || 1} joined
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-xl transition-all ${showInfo ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' : 'text-slate-400 hover:bg-slate-100'}`}
              title="Toggle topic info"
            >
              <Info className="h-4.5 w-4.5" />
            </button>
            {(isOwner || user?.role === 'admin') && (
              <button 
                onClick={handleThreadDelete}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                title="Close Thread"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main chat layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Chat Messages Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            
            {/* Thread topic intro */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/40 rounded-2xl mb-4 text-xs">
              <div className="font-extrabold text-indigo-700 dark:text-indigo-400 mb-1">Topic Introduction</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                {currentDiscussion.content}
              </p>
              <div className="text-[9px] text-slate-400 mt-2 font-bold uppercase">Launched by: {currentDiscussion.userId?.fullName}</div>
            </div>

            {/* Replies List */}
            {currentDiscussion.replies?.map(reply => {
              const isCurrentUser = reply.userId?._id === user?._id;
              return (
                <div key={reply._id} className={`flex items-start gap-2.5 max-w-[85%] ${isCurrentUser ? 'ml-auto flex-row-reverse' : ''}`}>
                  <img src={reply.userId?.avatar} alt={reply.userId?.fullName} className="h-8 w-8 rounded-full border border-indigo-100 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className={`text-[10px] text-slate-400 font-bold ${isCurrentUser ? 'text-right' : ''}`}>
                      {reply.userId?.fullName}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isCurrentUser 
                        ? 'bg-indigo-650 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-200'
                    }`}>
                      {reply.content}
                    </div>
                    <div className={`text-[8px] text-slate-400 font-bold ${isCurrentUser ? 'text-right' : ''}`}>
                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat entry form footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
              <input 
                type="text" 
                placeholder="Type your message here..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button 
                type="submit"
                className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </form>
          </div>
        </div>

        {/* Side Panel: Active Participants (Desktop only) */}
        {showInfo && (
          <div className="hidden md:block w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 overflow-y-auto shrink-0 animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Participants</h3>
              <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4.5 w-4.5" /></button>
            </div>
            
            <div className="space-y-3">
              {currentDiscussion.participants?.map((participant, index) => (
                <div key={index} className="flex items-center gap-2.5 p-2 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100/50 dark:border-slate-800">
                  <div className="relative">
                    {/* Dummy check showing online status */}
                    <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900"></div>
                    {/* Avatar fallback */}
                    <div className="h-7 w-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                      {participant.substring(0, 2)}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">{participant}</span>
                </div>
              ))}
              {(!currentDiscussion.participants || currentDiscussion.participants.length === 0) && (
                <div className="text-slate-400 text-xs font-semibold text-center py-4">No participants inside chat yet.</div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default DiscussionRoom;
