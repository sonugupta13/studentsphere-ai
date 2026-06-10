import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Helper to extract error message
const getErrorMessage = (error) => {
  return (
    error.response &&
    error.response.data &&
    error.response.data.message
  ) ? error.response.data.message : error.message || 'Something went wrong';
};

// Async Thunks
export const fetchOverview = createAsyncThunk('dashboard/fetchOverview', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/overview');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchAttendance = createAsyncThunk('dashboard/fetchAttendance', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/attendance');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchExams = createAsyncThunk('dashboard/fetchExams', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/exams');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const addExam = createAsyncThunk('dashboard/addExam', async (examData, thunkAPI) => {
  try {
    const response = await api.post('/dashboard/exams', examData);
    thunkAPI.dispatch(fetchOverview()); // Refresh stats
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchAssignments = createAsyncThunk('dashboard/fetchAssignments', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/assignments');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const addAssignment = createAsyncThunk('dashboard/addAssignment', async (assignmentData, thunkAPI) => {
  try {
    const response = await api.post('/dashboard/assignments', assignmentData);
    thunkAPI.dispatch(fetchOverview()); // Refresh stats
    thunkAPI.dispatch(fetchAnalytics()); // Refresh charts
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchInternships = createAsyncThunk('dashboard/fetchInternships', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/internships');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const addInternship = createAsyncThunk('dashboard/addInternship', async (internshipData, thunkAPI) => {
  try {
    const response = await api.post('/dashboard/internships', internshipData);
    thunkAPI.dispatch(fetchOverview()); // Refresh stats
    thunkAPI.dispatch(fetchAnalytics()); // Refresh charts
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchPlacements = createAsyncThunk('dashboard/fetchPlacements', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/placements');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchCoding = createAsyncThunk('dashboard/fetchCoding', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/coding');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchGoals = createAsyncThunk('dashboard/fetchGoals', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/goals');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const addGoal = createAsyncThunk('dashboard/addGoal', async (title, thunkAPI) => {
  try {
    const response = await api.post('/dashboard/goals', { title });
    thunkAPI.dispatch(fetchOverview()); // Refresh stats
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const toggleGoalStatus = createAsyncThunk('dashboard/toggleGoalStatus', async (id, thunkAPI) => {
  try {
    const response = await api.put(`/dashboard/goals/${id}`);
    thunkAPI.dispatch(fetchOverview()); // Refresh stats
    thunkAPI.dispatch(fetchAnalytics()); // Refresh charts
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const fetchAnalytics = createAsyncThunk('dashboard/fetchAnalytics', async (_, thunkAPI) => {
  try {
    const response = await api.get('/dashboard/analytics');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

const initialState = {
  dashboardData: null,
  attendanceData: [],
  examData: [],
  assignmentData: [],
  internshipData: [],
  placementData: [],
  codingData: null,
  goalData: [],
  analyticsData: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Overview
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Attendance
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.attendanceData = action.payload;
      })

      // Fetch Exams
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.examData = action.payload;
      })
      .addCase(addExam.fulfilled, (state, action) => {
        state.examData.push(action.payload);
        // Sort after addition by date
        state.examData.sort((a, b) => new Date(a.date) - new Date(b.date));
      })

      // Fetch Assignments
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.assignmentData = action.payload;
      })
      .addCase(addAssignment.fulfilled, (state, action) => {
        state.assignmentData.push(action.payload);
        state.assignmentData.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      })

      // Fetch Internships
      .addCase(fetchInternships.fulfilled, (state, action) => {
        state.internshipData = action.payload;
      })
      .addCase(addInternship.fulfilled, (state, action) => {
        state.internshipData.unshift(action.payload);
      })

      // Fetch Placements
      .addCase(fetchPlacements.fulfilled, (state, action) => {
        state.placementData = action.payload;
      })

      // Fetch Coding Progress
      .addCase(fetchCoding.fulfilled, (state, action) => {
        state.codingData = action.payload;
      })

      // Fetch Goals
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.goalData = action.payload;
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.goalData.push(action.payload);
      })
      .addCase(toggleGoalStatus.fulfilled, (state, action) => {
        const index = state.goalData.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.goalData[index] = action.payload;
        }
      })

      // Fetch Analytics
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analyticsData = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
