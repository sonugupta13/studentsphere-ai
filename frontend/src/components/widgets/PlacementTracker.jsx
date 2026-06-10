import React from 'react';
import { Briefcase, FileText, Send, Calendar, CheckSquare } from 'lucide-react';

export const PlacementTracker = ({ placements = [] }) => {
  // We can show the timeline stages based on the highest offer stage
  const stages = ['Applied', 'Online Test', 'Interview', 'Offer'];
  
  // Find highest stage achieved
  let activeStageIndex = 0;
  placements.forEach((p) => {
    const idx = stages.indexOf(p.stage);
    if (idx > activeStageIndex && p.status !== 'rejected') {
      activeStageIndex = idx;
    }
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">Placement Journey</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {placements.length} Companies
          </span>
        </div>

        {/* Timeline visualization */}
        <div className="mt-4 mb-6">
          <div className="relative flex justify-between items-center w-full">
            {/* Line connector */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
            
            {stages.map((stage, idx) => {
              const isActive = idx <= activeStageIndex;
              const isCurrent = idx === activeStageIndex;
              
              const icons = [
                <Send className="h-3.5 w-3.5" />,
                <FileText className="h-3.5 w-3.5" />,
                <Calendar className="h-3.5 w-3.5" />,
                <Briefcase className="h-3.5 w-3.5" />,
              ];

              return (
                <div key={idx} className="relative flex flex-col items-center z-10">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 shadow-sm scale-110' 
                      : isActive 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                  }`}>
                    {icons[idx]}
                  </div>
                  <span className={`text-[9px] font-bold mt-2 ${isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Companies checklist summary */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Recruitment Status</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {placements.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">No placements data logged.</p>
          ) : (
            placements.slice(0, 3).map((place) => (
              <div key={place._id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{place.company}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  place.stage === 'Offer' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50' 
                    : place.stage === 'Interview'
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50'
                }`}>
                  {place.stage}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlacementTracker;
