import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const getErrorMessage = (error) => {
  return (
    error.response &&
    error.response.data &&
    error.response.data.message
  ) ? error.response.data.message : error.message || 'Something went wrong';
};

// Async Thunks
export const fetchPosts = createAsyncThunk(
  'community/fetchPosts',
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get('/community/posts', { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchTrendingPosts = createAsyncThunk(
  'community/fetchTrendingPosts',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/community/trending');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'community/fetchPostById',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/community/posts/${id}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createPost = createAsyncThunk(
  'community/createPost',
  async (formData, thunkAPI) => {
    try {
      const response = await api.post('/community/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updatePost = createAsyncThunk(
  'community/updatePost',
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await api.put(`/community/posts/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deletePost = createAsyncThunk(
  'community/deletePost',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/community/posts/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const pinPost = createAsyncThunk(
  'community/pinPost',
  async (id, thunkAPI) => {
    try {
      const response = await api.put(`/community/posts/${id}/pin`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchComments = createAsyncThunk(
  'community/fetchComments',
  async (postId, thunkAPI) => {
    try {
      const response = await api.get(`/community/posts/${postId}/comments`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addComment = createAsyncThunk(
  'community/addComment',
  async (commentData, thunkAPI) => {
    try {
      const response = await api.post('/community/comments', commentData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteComment = createAsyncThunk(
  'community/deleteComment',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/community/comments/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const togglePostLike = createAsyncThunk(
  'community/togglePostLike',
  async (postId, thunkAPI) => {
    try {
      const response = await api.post(`/community/likes/post/${postId}`);
      return { postId, ...response.data }; // returns isLiked, likesCount
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const toggleCommentLike = createAsyncThunk(
  'community/toggleCommentLike',
  async (commentId, thunkAPI) => {
    try {
      const response = await api.post(`/community/likes/comment/${commentId}`);
      return { commentId, ...response.data }; // returns isLiked, likesCount
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchDiscussions = createAsyncThunk(
  'community/fetchDiscussions',
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get('/community/discussions', { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchDiscussionById = createAsyncThunk(
  'community/fetchDiscussionById',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/community/discussions/${id}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createDiscussion = createAsyncThunk(
  'community/createDiscussion',
  async (discussionData, thunkAPI) => {
    try {
      const response = await api.post('/community/discussions', discussionData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addDiscussionReply = createAsyncThunk(
  'community/addDiscussionReply',
  async ({ id, content }, thunkAPI) => {
    try {
      const response = await api.post(`/community/discussions/${id}/replies`, { content });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteDiscussion = createAsyncThunk(
  'community/deleteDiscussion',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/community/discussions/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'community/fetchNotifications',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/community/notifications');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  'community/markNotificationsAsRead',
  async (_, thunkAPI) => {
    try {
      const response = await api.put('/community/notifications/read');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'community/fetchUserProfile',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/community/profiles/${id}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const toggleFollowUser = createAsyncThunk(
  'community/toggleFollowUser',
  async (id, thunkAPI) => {
    try {
      const response = await api.post(`/community/profiles/${id}/follow`);
      return { id, isFollowing: response.data.isFollowing };
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCommunityAnalytics = createAsyncThunk(
  'community/fetchCommunityAnalytics',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/community/analytics');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  posts: [],
  trendingPosts: [],
  currentPost: null,
  comments: [],
  discussions: [],
  currentDiscussion: null,
  notifications: [],
  viewedProfile: null,
  analytics: null,
  loading: false,
  commentsLoading: false,
  discussionsLoading: false,
  error: null,
};

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearCommunityErrors: (state) => {
      state.error = null;
    },
    // Handler for real-time live message sockets additions directly to state
    receiveLiveDiscussionReply: (state, action) => {
      if (state.currentDiscussion && state.currentDiscussion._id === action.payload.discussionId) {
        // Prevent duplicate messages
        const exists = state.currentDiscussion.replies.some(r => r._id === action.payload._id);
        if (!exists) {
          state.currentDiscussion.replies.push(action.payload);
          state.currentDiscussion.repliesCount += 1;
        }
      }
      // Also update in list
      const disc = state.discussions.find(d => d._id === action.payload.discussionId);
      if (disc) {
        disc.repliesCount += 1;
      }
    },
    // Handler for live notifications socket additions
    receiveLiveNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Trending Posts
      .addCase(fetchTrendingPosts.fulfilled, (state, action) => {
        state.trendingPosts = action.payload;
      })

      // Fetch Post Details
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Post
      .addCase(createPost.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p._id !== action.payload);
      })

      // Pin Post
      .addCase(pinPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.currentPost && state.currentPost._id === action.payload._id) {
          state.currentPost = action.payload;
        }
      })

      // Fetch Comments
      .addCase(fetchComments.pending, (state) => {
        state.commentsLoading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentsLoading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.commentsLoading = false;
      })

      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
        if (state.currentPost) {
          state.currentPost.commentsCount += 1;
        }
      })

      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter(c => c._id !== action.payload && c.parentComment !== action.payload);
        if (state.currentPost) {
          state.currentPost.commentsCount = Math.max(0, state.currentPost.commentsCount - 1);
        }
      })

      // Toggle Post Like
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          post.likesCount = action.payload.likesCount;
        }
        if (state.currentPost && state.currentPost._id === action.payload.postId) {
          state.currentPost.likesCount = action.payload.likesCount;
        }
      })

      // Toggle Comment Like
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const comment = state.comments.find(c => c._id === action.payload.commentId);
        if (comment) {
          comment.likesCount = action.payload.likesCount;
        }
      })

      // Fetch Discussions
      .addCase(fetchDiscussions.pending, (state) => {
        state.discussionsLoading = true;
      })
      .addCase(fetchDiscussions.fulfilled, (state, action) => {
        state.discussionsLoading = false;
        state.discussions = action.payload;
      })
      .addCase(fetchDiscussions.rejected, (state, action) => {
        state.discussionsLoading = false;
      })

      // Fetch Discussion Detail
      .addCase(fetchDiscussionById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDiscussionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDiscussion = action.payload;
      })
      .addCase(fetchDiscussionById.rejected, (state, action) => {
        state.loading = false;
      })

      // Create Discussion
      .addCase(createDiscussion.fulfilled, (state, action) => {
        state.discussions.unshift(action.payload);
      })

      // Add Discussion Reply (REST action)
      .addCase(addDiscussionReply.fulfilled, (state, action) => {
        if (state.currentDiscussion) {
          const exists = state.currentDiscussion.replies.some(r => r._id === action.payload._id);
          if (!exists) {
            state.currentDiscussion.replies.push(action.payload);
            state.currentDiscussion.repliesCount += 1;
          }
        }
      })

      // Delete Discussion
      .addCase(deleteDiscussion.fulfilled, (state, action) => {
        state.discussions = state.discussions.filter(d => d._id !== action.payload);
      })

      // Fetch Notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })

      // Mark notifications read
      .addCase(markNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.isRead = true; });
      })

      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.viewedProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
      })

      // Toggle Follow User
      .addCase(toggleFollowUser.fulfilled, (state, action) => {
        if (state.viewedProfile && state.viewedProfile._id === action.payload.id) {
          if (action.payload.isFollowing) {
            state.viewedProfile.followers.push(state.viewedProfile._id); // dummy placeholder to show follower addition
          } else {
            state.viewedProfile.followers.pop();
          }
        }
      })

      // Fetch Community Analytics
      .addCase(fetchCommunityAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const { clearCommunityErrors, receiveLiveDiscussionReply, receiveLiveNotification } = communitySlice.actions;
export default communitySlice.reducer;
