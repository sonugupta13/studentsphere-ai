import React, { useMemo } from 'react';

const Heatmap = ({ data = [], year = new Date().getFullYear() }) => {
  // Generate days of the year
  const daysInYear = useMemo(() => {
    const days = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Fill leading empty days to align weeks (Sunday = 0)
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dataPoint = data.find(x => x.date === dateStr);
      days.push({
        date: dateStr,
        count: dataPoint ? dataPoint.count : 0
      });
    }
    return days;
  }, [data, year]);

  const getColor = (count) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (count <= 2) return 'bg-indigo-200 dark:bg-indigo-900/40';
    if (count <= 5) return 'bg-indigo-400 dark:bg-indigo-600';
    if (count <= 8) return 'bg-indigo-600 dark:bg-indigo-500';
    return 'bg-indigo-800 dark:bg-indigo-400';
  };

  const getTooltipContent = (day) => {
    if (!day) return '';
    return `${day.date}: ${day.count} problems solved`;
  };

  // Group into weeks
  const weeks = [];
  let currentWeek = [];
  daysInYear.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while(currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 py-4">
      <div className="min-w-[800px] flex flex-col gap-2 text-xs text-slate-500 font-medium">
        <div className="flex justify-between pl-8">
          {months.map(m => (
            <span key={m} className="flex-1">{m}</span>
          ))}
        </div>
        
        <div className="flex gap-2">
          {/* Days of week labels */}
          <div className="flex flex-col justify-between py-1 text-[10px]">
            <span>Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => (
                  <div 
                    key={dIdx} 
                    title={getTooltipContent(day)}
                    className={`w-3.5 h-3.5 rounded-sm transition-colors ${!day ? 'bg-transparent' : getColor(day.count)} ${day && day.count > 0 ? 'hover:ring-2 ring-indigo-300 cursor-pointer' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 text-[10px] mt-2">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 dark:bg-slate-800" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-200 dark:bg-indigo-900/40" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-400 dark:bg-indigo-600" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-600 dark:bg-indigo-500" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-800 dark:bg-indigo-400" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
