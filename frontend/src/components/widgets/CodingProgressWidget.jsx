import React from 'react';
import { Award, Flame, CheckCircle, Code } from 'lucide-react';

export const CodingProgressWidget = ({ codingData }) => {
  const data = codingData || {
    currentStreak: 0,
    longestStreak: 0,
    problemsSolved: { easy: 0, medium: 0, hard: 0 },
    platformStats: { leetCode: 0, hackerRank: 0, codeChef: 0 },
  };

  const totalSolved = data.problemsSolved.easy + data.problemsSolved.medium + data.problemsSolved.hard;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-1.5">
            <Code className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Coding Metrics</span>
          </h2>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-2.5 py-0.5 rounded-full">
            <Flame className="h-4 w-4 fill-amber-500" />
            <span>{data.currentStreak} Day Streak</span>
          </div>
        </div>

        {/* Problems Solved Progress */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Solving breakdown</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{totalSolved} Solved</span>
          </div>
          
          <div className="space-y-2 text-xs">
            {/* Easy */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-500">Easy Problems</span>
                <span className="text-slate-700 dark:text-slate-300">{data.problemsSolved.easy}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalSolved > 0 ? (data.problemsSolved.easy / totalSolved) * 100 : 0}%` }}></div>
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-500">Medium Problems</span>
                <span className="text-slate-700 dark:text-slate-300">{data.problemsSolved.medium}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalSolved > 0 ? (data.problemsSolved.medium / totalSolved) * 100 : 0}%` }}></div>
              </div>
            </div>

            {/* Hard */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-500">Hard Problems</span>
                <span className="text-slate-700 dark:text-slate-300">{data.problemsSolved.hard}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${totalSolved > 0 ? (data.problemsSolved.hard / totalSolved) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platforms badges */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Platform Solves</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">
            <p className="font-bold text-slate-900 dark:text-white">{data.platformStats.leetCode}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">LeetCode</p>
          </div>
          <div className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">
            <p className="font-bold text-slate-900 dark:text-white">{data.platformStats.hackerRank}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">HackerRank</p>
          </div>
          <div className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">
            <p className="font-bold text-slate-900 dark:text-white">{data.platformStats.codeChef}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">CodeChef</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingProgressWidget;
