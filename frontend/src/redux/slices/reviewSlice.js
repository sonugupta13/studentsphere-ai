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
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async ({ page = 1, limit = 10, search = '', rating = '', sort = 'latest' } = {}, thunkAPI) => {
    try {
      const response = await api.get('/reviews', {
        params: { page, limit, search, rating, sort },
      });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchFeaturedReviews = createAsyncThunk(
  'reviews/fetchFeaturedReviews',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/reviews/featured');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchReviewStats = createAsyncThunk(
  'reviews/fetchReviewStats',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/reviews/stats');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchMyReview = createAsyncThunk(
  'reviews/fetchMyReview',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/reviews/my-review');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async (reviewData, thunkAPI) => {
    try {
      const response = await api.post('/reviews', reviewData);
      thunkAPI.dispatch(fetchReviewStats());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ id, reviewData }, thunkAPI) => {
    try {
      const response = await api.put(`/reviews/${id}`, reviewData);
      thunkAPI.dispatch(fetchReviewStats());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/reviews/${id}`);
      thunkAPI.dispatch(fetchReviewStats());
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markHelpful = createAsyncThunk(
  'reviews/markHelpful',
  async (id, thunkAPI) => {
    try {
      const response = await api.post(`/reviews/helpful/${id}`);
      return { id, data: response.data.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'reviews/submitFeedback',
  async (feedbackData, thunkAPI) => {
    try {
      const response = await api.post('/feedback', feedbackData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

// Admin-Only Thunks
export const fetchAdminReviews = createAsyncThunk(
  'reviews/fetchAdminReviews',
  async ({ status = '', search = '' } = {}, thunkAPI) => {
    try {
      const response = await api.get('/admin/reviews', {
        params: { status, search },
      });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const approveReview = createAsyncThunk(
  'reviews/approveReview',
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/admin/reviews/approve/${id}`);
      thunkAPI.dispatch(fetchAdminReviews());
      thunkAPI.dispatch(fetchReviewStats());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const rejectReview = createAsyncThunk(
  'reviews/rejectReview',
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/admin/reviews/reject/${id}`);
      thunkAPI.dispatch(fetchAdminReviews());
      thunkAPI.dispatch(fetchReviewStats());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const featureReview = createAsyncThunk(
  'reviews/featureReview',
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/admin/reviews/feature/${id}`);
      thunkAPI.dispatch(fetchAdminReviews());
      thunkAPI.dispatch(fetchFeaturedReviews());
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchFeedbacks = createAsyncThunk(
  'reviews/fetchFeedbacks',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/feedback');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteFeedback = createAsyncThunk(
  'reviews/deleteFeedback',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/feedback/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchReviewAnalytics = createAsyncThunk(
  'reviews/fetchReviewAnalytics',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/admin/reviews/analytics');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  reviews: [],
  pagination: {
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  },
  myReview: null,
  featuredReviews: [],
  reviewStats: null,
  adminReviews: [],
  feedbacks: [],
  analytics: null,
  loading: false,
  error: null,
  submitSuccess: false,
  feedbackSuccess: false,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewsError: (state) => {
      state.error = null;
    },
    resetSuccessFlags: (state) => {
      state.submitSuccess = false;
      state.feedbackSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Featured Reviews
      .addCase(fetchFeaturedReviews.fulfilled, (state, action) => {
        state.featuredReviews = action.payload;
      })

      // Fetch Review Stats
      .addCase(fetchReviewStats.fulfilled, (state, action) => {
        state.reviewStats = action.payload;
      })

      // Fetch My Review
      .addCase(fetchMyReview.fulfilled, (state, action) => {
        state.myReview = action.payload;
      })

      // Submit Review
      .addCase(submitReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.submitSuccess = false;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.myReview = action.payload;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Review
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.submitSuccess = false;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.myReview = action.payload;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Review
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((review) => review._id !== action.payload);
        if (state.myReview && state.myReview._id === action.payload) {
          state.myReview = null;
        }
      })

      // Mark Helpful
      .addCase(markHelpful.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        const reviewIndex = state.reviews.findIndex((r) => r._id === id);
        if (reviewIndex !== -1) {
          state.reviews[reviewIndex].helpfulCount = data.helpfulCount;
          // We can also toggle the user ID locally if we stored user IDs, but helpfulCount is sufficient.
        }
      })

      // Submit Feedback
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.feedbackSuccess = false;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbackSuccess = true;
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Admin Reviews
      .addCase(fetchAdminReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.adminReviews = action.payload;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Feedbacks (Admin)
      .addCase(fetchFeedbacks.fulfilled, (state, action) => {
        state.feedbacks = action.payload;
      })
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.feedbacks = state.feedbacks.filter((fb) => fb._id !== action.payload);
      })

      // Fetch Review Analytics
      .addCase(fetchReviewAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const { clearReviewsError, resetSuccessFlags } = reviewSlice.actions;
export default reviewSlice.reducer;
