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
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get('/expenses', { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (formData, thunkAPI) => {
    try {
      const response = await api.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      thunkAPI.dispatch(fetchExpenseAnalytics());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await api.put(`/expenses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      thunkAPI.dispatch(fetchExpenseAnalytics());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/expenses/${id}`);
      thunkAPI.dispatch(fetchExpenseAnalytics());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchBudgets = createAsyncThunk(
  'expenses/fetchBudgets',
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get('/expenses/budgets', { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const upsertBudget = createAsyncThunk(
  'expenses/upsertBudget',
  async (budgetData, thunkAPI) => {
    try {
      const response = await api.post('/expenses/budgets', budgetData);
      thunkAPI.dispatch(fetchExpenseAnalytics());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteBudget = createAsyncThunk(
  'expenses/deleteBudget',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/expenses/budgets/${id}`);
      thunkAPI.dispatch(fetchExpenseAnalytics());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchExpenseAnalytics = createAsyncThunk(
  'expenses/fetchExpenseAnalytics',
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get('/expenses/analytics', { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  expenses: [],
  budgets: [],
  analytics: null,
  loading: false,
  analyticsLoading: false,
  error: null,
};

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearExpenseErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Expense
      .addCase(addExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses.unshift(action.payload);
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Expense
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.expenses.findIndex(exp => exp._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Expense
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.filter(exp => exp._id !== action.payload);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Budgets
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Upsert Budget
      .addCase(upsertBudget.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upsertBudget.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.budgets.findIndex(
          b => b.category === action.payload.category && b.month === action.payload.month
        );
        if (index !== -1) {
          state.budgets[index] = action.payload;
        } else {
          state.budgets.push(action.payload);
        }
      })
      .addCase(upsertBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Budget
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.budgets = state.budgets.filter(b => b._id !== action.payload);
      })

      // Fetch Analytics
      .addCase(fetchExpenseAnalytics.pending, (state) => {
        state.analyticsLoading = true;
      })
      .addCase(fetchExpenseAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchExpenseAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearExpenseErrors } = expenseSlice.actions;
export default expenseSlice.reducer;
