import React from 'react';
import { Bell, Calendar, FileText, Send, CheckCircle2 } from 'lucide-react';

export const NotificationsPanel = ({ exams = [], assignments = [], internships = [] }) => {
  const alerts = [];

  // 1. Process upcoming exams (within 7 days)
  exams.forEach((ex) => {
    const examDate = new Date(ex.date);
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      alerts.push({
        id: `exam-${ex._id}`,
        title: `Upcoming ${ex.type}: ${ex.subject}`,
        desc: `Exam is scheduled in ${diffDays} day${diffDays !== 1 ? 's' : ''} (${examDate.toLocaleDateString()}).`,
        type: 'exam',
        icon: <Calendar className="h-4 w-4 text-amber-500" />,
        bgColor: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
      });
    }
  });

  // 2. Process pending assignments (due within 3 days)
  assignments.forEach((as) => {
    if (as.status === 'pending') {
      const dueDate = new Date(as.dueDate);
      const today = new Date();
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 3) {
        alerts.push({
          id: `assignment-${as._id}`,
          title: `Assignment Deadline: ${as.title}`,
          desc: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''} for ${as.subject}.`,
          type: 'assignment',
          icon: <FileText className="h-4 w-4 text-rose-500" />,
          bgColor: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30',
        });
      }
    }
  });

  // 3. Process interview schedules
  internships.forEach((int) => {
    if (int.status === 'Interview Scheduled') {
      alerts.push({
        id: `interview-${int._id}`,
        title: `Interview Scheduled: ${int.company}`,
        desc: `Your interview for the ${int.role} position has been scheduled.`,
        type: 'interview',
        icon: <Send className="h-4 w-4 text-indigo-500" />,
        bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30',
      });
    }
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Notifications & Deadlines</span>
        </h2>
        {alerts.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
            {alerts.length} New
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">All caught up!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">No critical deadlines in the next few days.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex gap-3 items-start ${alert.bgColor}`}
            >
              <div className="mt-0.5 p-1 bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{alert.title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">{alert.desc}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
