import React from 'react';
import { CheckCircle2, Send, Trophy, CalendarCheck, ShieldCheck } from 'lucide-react';

export const RecentActivity = ({ activities }) => {
  // Fallback default activities if none are parsed dynamically
  const defaultActivities = [
    {
      id: 1,
      type: 'assignment',
      text: 'Assignment completed: CS Ethics Essay',
      time: '1 hour ago',
      icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30',
    },
    {
      id: 2,
      type: 'internship',
      text: 'New Internship added: Microsoft PM Intern',
      time: '4 hours ago',
      icon: <Send className="h-4.5 w-4.5 text-indigo-500" />,
      color: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30',
    },
    {
      id: 3,
      type: 'coding',
      text: 'Coding streak achieved: 7 Days Streak!',
      time: 'Yesterday',
      icon: <Trophy className="h-4.5 w-4.5 text-amber-500" />,
      color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30',
    },
    {
      id: 4,
      type: 'attendance',
      text: 'Attendance updated for Mathematics: 84%',
      time: '2 days ago',
      icon: <CalendarCheck className="h-4.5 w-4.5 text-violet-500" />,
      color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/30',
    },
    {
      id: 5,
      type: 'role',
      text: 'System administration privileges active',
      time: 'Just now',
      icon: <ShieldCheck className="h-4.5 w-4.5 text-sky-500" />,
      color: 'bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/30',
    },
  ];

  const items = activities || defaultActivities;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
      <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white mb-4">Recent Activity</h2>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {items.map((item, itemIdx) => (
            <li key={item.id}>
              <div className="relative pb-8">
                {itemIdx !== items.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-xl flex items-center justify-center border ${item.color}`}>
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.text}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {item.time}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecentActivity;
