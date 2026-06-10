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
export const fetchExams = createAsyncThunk('exams/fetchExams', async (_, thunkAPI) => {
  try {
    const response = await api.get('/exams');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchExamAnalytics = createAsyncThunk('exams/fetchExamAnalytics', async (_, thunkAPI) => {
  try {
    const response = await api.get('/exams/analytics');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchExamCalendar = createAsyncThunk('exams/fetchExamCalendar', async (_, thunkAPI) => {
  try {
    const response = await api.get('/exams/calendar');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const createExam = createAsyncThunk('exams/createExam', async (examData, thunkAPI) => {
  try {
    const response = await api.post('/exams', examData);
    thunkAPI.dispatch(fetchExams());
    thunkAPI.dispatch(fetchExamAnalytics());
    thunkAPI.dispatch(fetchExamCalendar());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const updateExam = createAsyncThunk('exams/updateExam', async ({ id, examData }, thunkAPI) => {
  try {
    const response = await api.put(`/exams/${id}`, examData);
    thunkAPI.dispatch(fetchExams());
    thunkAPI.dispatch(fetchExamAnalytics());
    thunkAPI.dispatch(fetchExamCalendar());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const deleteExam = createAsyncThunk('exams/deleteExam', async (id, thunkAPI) => {
  try {
    await api.delete(`/exams/${id}`);
    thunkAPI.dispatch(fetchExams());
    thunkAPI.dispatch(fetchExamAnalytics());
    thunkAPI.dispatch(fetchExamCalendar());
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const generateStudyPlan = createAsyncThunk('exams/generateStudyPlan', async (planData, thunkAPI) => {
  try {
    const response = await api.post('/exams/generate-study-plan', planData);
    thunkAPI.dispatch(fetchExams()); // Reloads to reflect plans count/progress
    thunkAPI.dispatch(fetchExamAnalytics());
    thunkAPI.dispatch(fetchExamCalendar());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const generateRevisionPlan = createAsyncThunk('exams/generateRevisionPlan', async (revisionData, thunkAPI) => {
  try {
    const response = await api.post('/exams/generate-revision-plan', revisionData);
    thunkAPI.dispatch(fetchExams());
    thunkAPI.dispatch(fetchExamAnalytics());
    thunkAPI.dispatch(fetchExamCalendar());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

const initialState = {
  exams: [],
  calendarData: [],
  analytics: null,
  loading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {
    clearExamsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Exams
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Analytics
      .addCase(fetchExamAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })

      // Fetch Calendar
      .addCase(fetchExamCalendar.fulfilled, (state, action) => {
        state.calendarData = action.payload;
      });
  },
});

export const { clearExamsError } = examSlice.actions;
export default examSlice.reducer;
