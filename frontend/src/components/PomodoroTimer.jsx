import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';

export const PomodoroTimer = ({ onShowToast }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished!
            clearInterval(timerRef.current);
            setIsActive(false);
            if (!isBreak) {
              onShowToast('Study Session Complete! Take a 5-minute break.', 'success');
              setIsBreak(true);
              setMinutes(5);
            } else {
              onShowToast('Break Complete! Time to study.', 'info');
              setIsBreak(false);
              setMinutes(25);
            }
            setSeconds(0);
          } else {
            setMinutes((m) => m - 1);
            setSeconds(59);
          }
        } else {
          setSeconds((s) => s - 1);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, seconds, minutes, isBreak, onShowToast]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setMinutes(25);
    setSeconds(0);
  };

  const setManualMode = (studyMode) => {
    setIsActive(false);
    setIsBreak(!studyMode);
    setMinutes(studyMode ? 25 : 5);
    setSeconds(0);
  };

  // Percentage calculations
  const totalDuration = isBreak ? 5 * 60 : 25 * 60;
  const currentSecondsLeft = minutes * 60 + seconds;
  const percentageCompleted = Math.round(((totalDuration - currentSecondsLeft) / totalDuration) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-rose-500 animate-pulse" />
          <span>Pomodoro Timer</span>
        </h2>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
          isBreak 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30' 
            : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30'
        }`}>
          {isBreak ? 'Break Session' : 'Focus Session'}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center my-4">
        {/* Circle Progress Timer */}
        <div className="relative flex items-center justify-center h-32 w-32 mb-4">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="54"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r="54"
              className={`transition-all duration-300 ${isBreak ? 'stroke-emerald-500' : 'stroke-rose-500'}`}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - percentageCompleted / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={toggleTimer}
            className={`p-2.5 rounded-full text-white transition-all shadow-sm ${
              isActive 
                ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600' 
                : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600'
            }`}
          >
            {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          
          <button
            onClick={resetTimer}
            className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 justify-center mt-3">
        <button
          onClick={() => setManualMode(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            !isBreak 
              ? 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700' 
              : 'text-slate-400 hover:bg-slate-50 dark:border-transparent dark:hover:bg-slate-800/50'
          }`}
        >
          Study (25m)
        </button>
        <button
          onClick={() => setManualMode(false)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            isBreak 
              ? 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700' 
              : 'text-slate-400 hover:bg-slate-50 dark:border-transparent dark:hover:bg-slate-800/50'
          }`}
        >
          Break (5m)
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
