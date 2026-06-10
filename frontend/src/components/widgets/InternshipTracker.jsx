import React from 'react';

export const InternshipTracker = ({ internships = [] }) => {
  const statusColors = {
    'Applied': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
    'Under Review': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
    'Interview Scheduled': 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
    'Selected': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">Internship Tracker</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {internships.length} Applications
          </span>
        </div>

        {/* Applications mini list */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {internships.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 dark:text-slate-500">No internship applications tracked yet.</p>
            </div>
          ) : (
            internships.slice(0, 4).map((intern) => (
              <div
                key={intern._id}
                className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{intern.role}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{intern.company}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[intern.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {intern.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Visual statistics progress summary */}
      {internships.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <span className="text-slate-500">Selected / Offers Received</span>
            <span className="text-slate-800 dark:text-white">
              {internships.filter((i) => i.status === 'Selected').length} Selected
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{
                width: `${(internships.filter((i) => i.status === 'Selected').length / internships.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipTracker;
