import React from 'react';

export const StatCard = ({ title, value, icon, subtitle, color = 'indigo', progress }) => {
  const colorSchemes = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border-sky-100 dark:border-sky-900/30',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/30',
  };

  const ringColors = {
    indigo: 'bg-indigo-600 dark:bg-indigo-500',
    emerald: 'bg-emerald-600 dark:bg-emerald-500',
    amber: 'bg-amber-600 dark:bg-amber-500',
    rose: 'bg-rose-600 dark:bg-rose-500',
    sky: 'bg-sky-600 dark:bg-sky-500',
    violet: 'bg-violet-600 dark:bg-violet-500',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px] flex flex-col justify-between h-36">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-1.5">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${colorSchemes[color]}`}>
          {icon}
        </div>
      </div>
      
      {/* Optional progress indicator bar */}
      {progress !== undefined ? (
        <div className="w-full mt-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
            <span>COMPLETION RATE</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${ringColors[color]} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
