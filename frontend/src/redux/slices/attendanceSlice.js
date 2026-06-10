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
export const fetchAttendance = createAsyncThunk('attendance/fetchAttendance', async (_, thunkAPI) => {
  try {
    const response = await api.get('/attendance');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchOverview = createAsyncThunk('attendance/fetchOverview', async (_, thunkAPI) => {
  try {
    const response = await api.get('/attendance/overview');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchReports = createAsyncThunk('attendance/fetchReports', async (_, thunkAPI) => {
  try {
    const response = await api.get('/attendance/reports');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchAnalytics = createAsyncThunk('attendance/fetchAnalytics', async (_, thunkAPI) => {
  try {
    const response = await api.get('/attendance/analytics');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const addSubject = createAsyncThunk('attendance/addSubject', async (subjectData, thunkAPI) => {
  try {
    const response = await api.post('/attendance/subject', subjectData);
    thunkAPI.dispatch(fetchAttendance()); // Refresh list
    thunkAPI.dispatch(fetchOverview());   // Refresh stats
    thunkAPI.dispatch(fetchAnalytics());  // Refresh charts
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const updateSubject = createAsyncThunk('attendance/updateSubject', async ({ id, subjectData }, thunkAPI) => {
  try {
    const response = await api.put(`/attendance/subject/${id}`, subjectData);
    thunkAPI.dispatch(fetchAttendance());
    thunkAPI.dispatch(fetchOverview());
    thunkAPI.dispatch(fetchAnalytics());
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const deleteSubject = createAsyncThunk('attendance/deleteSubject', async (id, thunkAPI) => {
  try {
    await api.delete(`/attendance/subject/${id}`);
    thunkAPI.dispatch(fetchAttendance());
    thunkAPI.dispatch(fetchOverview());
    thunkAPI.dispatch(fetchAnalytics());
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const markAttendance = createAsyncThunk('attendance/markAttendance', async (attendanceData, thunkAPI) => {
  try {
    const response = await api.post('/attendance/mark', attendanceData);
    thunkAPI.dispatch(fetchAttendance()); // Updates aggregated subject percentages
    thunkAPI.dispatch(fetchOverview());   // Updates overview percentages
    thunkAPI.dispatch(fetchAnalytics());  // Updates chart percentages
    thunkAPI.dispatch(fetchReports());    // Updates monthly reports
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

const initialState = {
  subjects: [],
  overview: null,
  reports: [],
  attendanceAnalytics: null,
  loading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Subjects (Attendance)
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Overview
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.overview = action.payload;
      })

      // Fetch Reports
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      })

      // Fetch Analytics
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.attendanceAnalytics = action.payload;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
