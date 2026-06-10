import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const fetchDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async ({ search = '', role = '', status = '', sort = 'newest', page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users?search=${search}&role=${role}&status=${status}&sort=${sort}&page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users list');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, fullName, email }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/users/${id}`, { fullName, email });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user profile');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const blockUser = createAsyncThunk(
  'admin/blockUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/block/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to block user');
    }
  }
);

export const unblockUser = createAsyncThunk(
  'admin/unblockUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/unblock/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unblock user');
    }
  }
);

export const changeUserRole = createAsyncThunk(
  'admin/changeUserRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/role/${id}`, { role });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change user role');
    }
  }
);

export const fetchPosts = createAsyncThunk(
  'admin/fetchPosts',
  async ({ search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/posts?search=${search}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts list');
    }
  }
);

export const deletePost = createAsyncThunk(
  'admin/deletePost',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/posts/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

export const fetchComments = createAsyncThunk(
  'admin/fetchComments',
  async ({ search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/comments?search=${search}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments list');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'admin/deleteComment',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/comments/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

export const fetchReports = createAsyncThunk(
  'admin/fetchReports',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/reports');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports list');
    }
  }
);

export const resolveReport = createAsyncThunk(
  'admin/resolveReport',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/reports/${id}`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update report status');
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/analytics');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics statistics');
    }
  }
);

export const fetchActivityLogs = createAsyncThunk(
  'admin/fetchActivityLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/activity-logs');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activity logs');
    }
  }
);

// Initial State
const initialState = {
  dashboard: null,
  users: [],
  pagination: { total: 0, pages: 1, page: 1, limit: 10 },
  posts: [],
  comments: [],
  reports: [],
  analytics: null,
  activityLogs: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
      })
      // Block User
      .addCase(blockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Unblock User
      .addCase(unblockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Change User Role
      .addCase(changeUserRole.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Fetch Posts
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload);
      })
      // Fetch Comments
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      })
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c._id !== action.payload);
      })
      // Fetch Reports
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      })
      // Resolve/Ignore Report
      .addCase(resolveReport.fulfilled, (state, action) => {
        const index = state.reports.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
      })
      // Fetch Analytics
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      // Fetch Activity Logs
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.activityLogs = action.payload;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
