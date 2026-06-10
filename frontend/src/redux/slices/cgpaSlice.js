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
export const fetchSemesters = createAsyncThunk(
  'cgpa/fetchSemesters',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/cgpa');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addSemester = createAsyncThunk(
  'cgpa/addSemester',
  async (semesterData, thunkAPI) => {
    try {
      const response = await api.post('/cgpa/semester', semesterData);
      thunkAPI.dispatch(fetchSemesters());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateSemester = createAsyncThunk(
  'cgpa/updateSemester',
  async ({ id, semesterData }, thunkAPI) => {
    try {
      const response = await api.put(`/cgpa/semester/${id}`, semesterData);
      thunkAPI.dispatch(fetchSemesters());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteSemester = createAsyncThunk(
  'cgpa/deleteSemester',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/cgpa/semester/${id}`);
      thunkAPI.dispatch(fetchSemesters());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'cgpa/fetchAnalytics',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/cgpa/analytics');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchGoals = createAsyncThunk(
  'cgpa/fetchGoals',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/cgpa/goals');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createGoal = createAsyncThunk(
  'cgpa/createGoal',
  async (goalData, thunkAPI) => {
    try {
      const response = await api.post('/cgpa/goals', goalData);
      thunkAPI.dispatch(fetchGoals());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const predictCGPA = createAsyncThunk(
  'cgpa/predictCGPA',
  async (predictionData, thunkAPI) => {
    try {
      const response = await api.post('/cgpa/predict', predictionData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const calculateCGPA = createAsyncThunk(
  'cgpa/calculateCGPA',
  async (calculationData, thunkAPI) => {
    try {
      const response = await api.post('/cgpa/calculate', calculationData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  semesters: [],
  cgpaData: {
    overallCGPA: 0,
    totalCredits: 0,
    totalCreditPoints: 0,
  },
  analytics: null,
  goals: [],
  predictions: null,
  whatIfResults: null,
  loading: false,
  error: null,
};

const cgpaSlice = createSlice({
  name: 'cgpa',
  initialState,
  reducers: {
    clearCGPAError: (state) => {
      state.error = null;
    },
    clearWhatIf: (state) => {
      state.whatIfResults = null;
    },
    clearPredictions: (state) => {
      state.predictions = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Semesters
      .addCase(fetchSemesters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSemesters.fulfilled, (state, action) => {
        state.loading = false;
        state.semesters = action.payload.semesters;
        state.cgpaData = {
          overallCGPA: action.payload.overallCGPA,
          totalCredits: action.payload.totalCredits,
          totalCreditPoints: action.payload.totalCreditPoints,
        };
      })
      .addCase(fetchSemesters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Goals
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.goals = action.payload;
      })

      // Predict CGPA
      .addCase(predictCGPA.fulfilled, (state, action) => {
        state.predictions = action.payload;
      })

      // Calculate CGPA (What-If)
      .addCase(calculateCGPA.fulfilled, (state, action) => {
        state.whatIfResults = action.payload;
      });
  },
});

export const { clearCGPAError, clearWhatIf, clearPredictions } = cgpaSlice.actions;
export default cgpaSlice.reducer;
