import React from 'react';
import { useDispatch } from 'react-redux';
import { CheckSquare, Square, ClipboardList, CheckCircle2 } from 'lucide-react';
import { toggleGoalStatus } from '../../redux/slices/dashboardSlice';

export const DailyGoalsWidget = ({ goals = [], onShowToast }) => {
  const dispatch = useDispatch();

  const handleToggle = (id) => {
    dispatch(toggleGoalStatus(id)).then((res) => {
      if (!res.error) {
        onShowToast('Goal status updated!', 'success');
      } else {
        onShowToast('Failed to update status', 'error');
      }
    });
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-1.5">
            <ClipboardList className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span>Today's Checklist</span>
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
            {completedCount}/{totalCount} Done
          </span>
        </div>

        {/* Goals Checklist */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 dark:text-slate-500">No daily goals created yet.</p>
            </div>
          ) : (
            goals.map((goal) => (
              <button
                key={goal._id}
                onClick={() => handleToggle(goal._id)}
                className="w-full flex items-start gap-2.5 text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all text-xs"
              >
                <div className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {goal.completed ? (
                    <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400 fill-indigo-50/50 dark:fill-indigo-950/20" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </div>
                <span className={`font-medium leading-relaxed ${
                  goal.completed 
                    ? 'text-slate-400 dark:text-slate-500 line-through' 
                    : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {goal.title}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Completion Indicator */}
      {totalCount > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <span className="text-slate-500">Daily productivity rate</span>
            <span className="text-slate-800 dark:text-white">{percentage}% Complete</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 dark:bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyGoalsWidget;
