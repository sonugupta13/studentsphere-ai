import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import attendanceReducer from './slices/attendanceSlice';
import assignmentReducer from './slices/assignmentSlice';
import noteReducer from './slices/noteSlice';
import examReducer from './slices/examSlice';
import cgpaReducer from './slices/cgpaSlice';
import resumeReducer from './slices/resumeSlice';
import codingReducer from './slices/codingSlice';
import expenseReducer from './slices/expenseSlice';
import communityReducer from './slices/communitySlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    attendance: attendanceReducer,
    assignments: assignmentReducer,
    notes: noteReducer,
    exams: examReducer,
    cgpa: cgpaReducer,
    resumes: resumeReducer,
    coding: codingReducer,
    expenses: expenseReducer,
    community: communityReducer,
    admin: adminReducer,
  },
});

export default store;
