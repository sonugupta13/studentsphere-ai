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
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get('/notes', { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchNoteSubjects = createAsyncThunk(
  'notes/fetchNoteSubjects',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/notes/subjects');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const uploadNote = createAsyncThunk(
  'notes/uploadNote',
  async (formData, thunkAPI) => {
    try {
      const response = await api.post('/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      thunkAPI.dispatch(fetchNotes());
      thunkAPI.dispatch(fetchNoteSubjects());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/notes/${id}`);
      thunkAPI.dispatch(fetchNotes());
      thunkAPI.dispatch(fetchNoteSubjects());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  notes: [],
  subjects: [],
  loading: false,
  error: null,
};

const noteSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearNotesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Note Subjects
      .addCase(fetchNoteSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
      })

      // Upload note states
      .addCase(uploadNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadNote.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(uploadNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearNotesError } = noteSlice.actions;
export default noteSlice.reducer;
