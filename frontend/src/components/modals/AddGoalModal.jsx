import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, GraduationCap, PlusCircle } from 'lucide-react';
import { addGoal } from '../../redux/slices/dashboardSlice';

export const AddGoalModal = ({ isOpen, onClose, onShowToast }) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) {
      onShowToast('Please provide a goal description', 'error');
      return;
    }

    setSubmitting(true);
    dispatch(addGoal(title)).then((res) => {
      setSubmitting(false);
      if (!res.error) {
        onShowToast('Daily goal added successfully!', 'success');
        onClose();
        setTitle('');
      } else {
        onShowToast(res.payload || 'Failed to add goal', 'error');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl glass relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Create New Daily Goal</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Goal Description *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              placeholder="e.g. Solve 3 LeetCode problems"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-all gap-2 items-center"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>Create Goal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;
