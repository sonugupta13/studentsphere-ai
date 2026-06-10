import React from 'react';

export const AcademicPerformance = ({ attendance = [], exams = [] }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white mb-4">Academic Analytics</h2>
        
        {/* Attendance subject metrics */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject Attendance</h3>
          {attendance.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">No attendance data logged.</p>
          ) : (
            attendance.map((att) => {
              const percentage = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 0;
              const isLow = percentage < 75;
              
              return (
                <div key={att._id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{att.subject}</span>
                    <span className={isLow ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                      {percentage}% ({att.attended}/{att.total})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? 'bg-rose-500' : 'bg-indigo-600 dark:bg-indigo-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upcoming exams */}
      <div className="mt-6">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Exam Preparation</h3>
        <div className="space-y-3">
          {exams.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">No upcoming exams.</p>
          ) : (
            exams.slice(0, 2).map((exam) => (
              <div key={exam._id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-slate-800 dark:text-slate-200">{exam.subject} ({exam.type})</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                    Prep: {exam.preparationProgress}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${exam.preparationProgress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Due Date: {new Date(exam.date).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicPerformance;
