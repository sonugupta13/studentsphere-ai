import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileUp, CalendarPlus, ClipboardList, Send, Flame } from 'lucide-react';

export const QuickActions = ({ 
  onAddAssignment, 
  onAddExam, 
  onAddInternship, 
  onAddGoal, 
  onTogglePomodoro,
  onShowToast
}) => {
  const navigate = useNavigate();
  const actions = [
    {
      title: 'Add Assignment',
      icon: <PlusCircle className="h-5 w-5" />,
      onClick: onAddAssignment,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/30',
    },
    {
      title: 'Add Exam',
      icon: <CalendarPlus className="h-5 w-5" />,
      onClick: onAddExam,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/30',
    },
    {
      title: 'Apply Internship',
      icon: <Send className="h-5 w-5" />,
      onClick: onAddInternship,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/30',
    },
    {
      title: 'Create Goal',
      icon: <ClipboardList className="h-5 w-5" />,
      onClick: onAddGoal,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/30',
    },
    {
      title: 'Pomodoro Timer',
      icon: <Flame className="h-5 w-5 animate-pulse" />,
      onClick: onTogglePomodoro,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/30',
    },
    {
      title: 'Upload Notes',
      icon: <FileUp className="h-5 w-5" />,
      onClick: () => navigate('/notes'),
      color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/30',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {actions.map((act, index) => (
          <button
            key={index}
            onClick={act.onClick}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900/50 transition-all hover:scale-105 group"
          >
            <div className={`p-2.5 rounded-xl border mb-2.5 transition-all group-hover:scale-110 ${act.color}`}>
              {act.icon}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center select-none truncate w-full">
              {act.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
