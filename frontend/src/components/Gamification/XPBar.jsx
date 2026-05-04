import React from 'react';
import { Target, Zap, Award } from 'lucide-react';

const XPBar = ({ progress }) => {
  if (!progress) return null;
  const { total_xp, level, level_title, xp_to_next_level, current_streak } = progress;
  const currentLevelBaseXP = (level - 1) * 200;
  const nextLevelXP = level * 200;
  const xpInCurrentLevel = total_xp - currentLevelBaseXP;
  const pct = Math.min(100, Math.max(0, (xpInCurrentLevel / 200) * 100));

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between gap-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-black text-xl shadow-inner">
          {level}
        </div>
        <div>
          <h4 className="text-sm text-indigo-200 font-bold uppercase tracking-wider">{level_title}</h4>
          <div className="text-2xl font-black">{total_xp} <span className="text-sm text-slate-400 font-normal">XP</span></div>
        </div>
      </div>
      
      <div className="flex-1 max-w-md hidden md:block">
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
          <span>Level {level}</span>
          <span>{xp_to_next_level} XP to Level {level + 1}</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400">
            <Zap size={20} className={current_streak > 0 ? "fill-current" : ""} />
            <span className="font-black text-xl">{current_streak}</span>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day Streak</div>
        </div>
      </div>
    </div>
  );
};

export default XPBar;
