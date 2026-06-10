import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const getErrorMessage = (error) => {
  return (
    error.response &&
    error.response.data &&
    error.response.data.message
  ) ? error.response.data.message : error.message || 'Something went wrong';
};

export const fetchCodingDashboard = createAsyncThunk(
  'coding/fetchDashboard',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/coding/dashboard');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCodingAnalytics = createAsyncThunk(
  'coding/fetchAnalytics',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/coding/analytics');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addCodingLog = createAsyncThunk(
  'coding/addLog',
  async (logData, thunkAPI) => {
    try {
      const response = await api.post('/coding/log', logData);
      thunkAPI.dispatch(fetchCodingDashboard());
      thunkAPI.dispatch(fetchCodingAnalytics());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteCodingLog = createAsyncThunk(
  'coding/deleteLog',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/coding/log/${id}`);
      thunkAPI.dispatch(fetchCodingDashboard());
      thunkAPI.dispatch(fetchCodingAnalytics());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addCodingGoal = createAsyncThunk(
  'coding/addGoal',
  async (goalData, thunkAPI) => {
    try {
      const response = await api.post('/coding/goal', goalData);
      thunkAPI.dispatch(fetchCodingDashboard());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteCodingGoal = createAsyncThunk(
  'coding/deleteGoal',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/coding/goal/${id}`);
      thunkAPI.dispatch(fetchCodingDashboard());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  profiles: [],
  recentLogs: [],
  goals: [],
  streak: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
  stats: { totalProblemsSolved: 0, totalTimeSpent: 0, topTopics: [] },
  heatmap: [],
  monthlyTrend: [],
  difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
  loading: false,
  error: null,
};

const codingSlice = createSlice({
  name: 'coding',
  initialState,
  reducers: {
    clearCodingError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchCodingDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCodingDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles = action.payload.profiles;
        state.recentLogs = action.payload.recentLogs;
        state.goals = action.payload.goals;
        state.streak = action.payload.streak;
        state.stats = action.payload.stats;
      })
      .addCase(fetchCodingDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Analytics
      .addCase(fetchCodingAnalytics.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCodingAnalytics.fulfilled, (state, action) => {
        state.heatmap = action.payload.heatmap;
        state.monthlyTrend = action.payload.monthlyTrend;
        state.difficultyDistribution = action.payload.difficultyDistribution;
      })
      .addCase(fetchCodingAnalytics.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Add Log
      .addCase(addCodingLog.pending, (state) => {
        state.error = null;
      })
      .addCase(addCodingLog.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Add Goal
      .addCase(addCodingGoal.pending, (state) => {
        state.error = null;
      })
      .addCase(addCodingGoal.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { clearCodingError } = codingSlice.actions;
export default codingSlice.reducer;
