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
export const fetchResumes = createAsyncThunk(
  'resume/fetchResumes',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/resumes');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchResumeById = createAsyncThunk(
  'resume/fetchResumeById',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/resumes/${id}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createResume = createAsyncThunk(
  'resume/createResume',
  async (resumeData, thunkAPI) => {
    try {
      const response = await api.post('/resumes', resumeData);
      thunkAPI.dispatch(fetchResumes());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateResume = createAsyncThunk(
  'resume/updateResume',
  async ({ id, resumeData }, thunkAPI) => {
    try {
      const response = await api.put(`/resumes/${id}`, resumeData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteResume = createAsyncThunk(
  'resume/deleteResume',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/resumes/${id}`);
      thunkAPI.dispatch(fetchResumes());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const duplicateResume = createAsyncThunk(
  'resume/duplicateResume',
  async (resumeId, thunkAPI) => {
    try {
      const response = await api.post('/resumes/duplicate', { resumeId });
      thunkAPI.dispatch(fetchResumes());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const checkATSScore = createAsyncThunk(
  'resume/checkATSScore',
  async (resumeId, thunkAPI) => {
    try {
      const response = await api.post('/resumes/ats-score', { resumeId });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const generateSummary = createAsyncThunk(
  'resume/generateSummary',
  async (summaryData, thunkAPI) => {
    try {
      const response = await api.post('/resumes/ai-summary', summaryData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  resumes: [],
  currentResume: null,
  currentAnalytics: null,
  aiSuggestions: [],
  loading: false,
  error: null,
  aiLoading: false,
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    clearResumeError: (state) => {
      state.error = null;
    },
    clearAISuggestions: (state) => {
      state.aiSuggestions = [];
    },
    clearCurrentResume: (state) => {
      state.currentResume = null;
      state.currentAnalytics = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Resumes
      .addCase(fetchResumes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes = action.payload;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Resume By ID
      .addCase(fetchResumeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResumeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResume = action.payload.resume;
        state.currentAnalytics = action.payload.analytics;
      })
      .addCase(fetchResumeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Resume
      .addCase(updateResume.pending, (state) => {
        state.error = null;
      })
      .addCase(updateResume.fulfilled, (state, action) => {
        state.currentResume = action.payload.resume;
        state.currentAnalytics = action.payload.analytics;
      })
      .addCase(updateResume.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Check ATS Score
      .addCase(checkATSScore.fulfilled, (state, action) => {
        state.currentAnalytics = action.payload.analytics;
        if (state.currentResume) {
          state.currentResume.atsScore = action.payload.atsScore;
        }
      })

      // AI Summary
      .addCase(generateSummary.pending, (state) => {
        state.aiLoading = true;
        state.error = null;
      })
      .addCase(generateSummary.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.aiSuggestions = action.payload.suggestions;
      })
      .addCase(generateSummary.rejected, (state, action) => {
        state.aiLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearResumeError, clearAISuggestions, clearCurrentResume } = resumeSlice.actions;
export default resumeSlice.reducer;
