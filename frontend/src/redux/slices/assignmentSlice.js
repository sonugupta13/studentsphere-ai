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
export const fetchAssignments = createAsyncThunk(
  'assignments/fetchAssignments',
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get('/assignments', { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'assignments/fetchAnalytics',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/assignments/analytics');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCalendar = createAsyncThunk(
  'assignments/fetchCalendar',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/assignments/calendar');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createAssignment = createAsyncThunk(
  'assignments/createAssignment',
  async (formData, thunkAPI) => {
    try {
      const response = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      thunkAPI.dispatch(fetchAssignments());
      thunkAPI.dispatch(fetchAnalytics());
      thunkAPI.dispatch(fetchCalendar());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateAssignment = createAsyncThunk(
  'assignments/updateAssignment',
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await api.put(`/assignments/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      thunkAPI.dispatch(fetchAssignments());
      thunkAPI.dispatch(fetchAnalytics());
      thunkAPI.dispatch(fetchCalendar());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  'assignments/deleteAssignment',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/assignments/${id}`);
      thunkAPI.dispatch(fetchAssignments());
      thunkAPI.dispatch(fetchAnalytics());
      thunkAPI.dispatch(fetchCalendar());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateStatus = createAsyncThunk(
  'assignments/updateStatus',
  async ({ id, status }, thunkAPI) => {
    try {
      const response = await api.patch(`/assignments/status/${id}`, { status });
      thunkAPI.dispatch(fetchAssignments());
      thunkAPI.dispatch(fetchAnalytics());
      thunkAPI.dispatch(fetchCalendar());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updatePriority = createAsyncThunk(
  'assignments/updatePriority',
  async ({ id, priority }, thunkAPI) => {
    try {
      const response = await api.patch(`/assignments/priority/${id}`, { priority });
      thunkAPI.dispatch(fetchAssignments());
      thunkAPI.dispatch(fetchAnalytics());
      thunkAPI.dispatch(fetchCalendar());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  assignments: [],
  selectedAssignment: null,
  analytics: null,
  calendarData: {},
  loading: false,
  error: null,
};

const assignmentSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setSelectedAssignment: (state, action) => {
      state.selectedAssignment = action.payload;
    },
    clearAssignmentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Analytics
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })

      // Fetch Calendar
      .addCase(fetchCalendar.fulfilled, (state, action) => {
        state.calendarData = action.payload;
      })

      // Add loading state for create/update/delete requests if needed
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssignment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedAssignment, clearAssignmentError } = assignmentSlice.actions;
export default assignmentSlice.reducer;
