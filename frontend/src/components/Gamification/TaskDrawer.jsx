import React from 'react';
import { X, Play, BookOpen, PenTool, CheckCircle, ExternalLink } from 'lucide-react';

const TaskDrawer = ({ task, isOpen, onClose, onComplete }) => {
  if (!isOpen || !task) return null;

  let actionSteps = [];
  try {
    actionSteps = typeof task.action_steps === 'string' ? JSON.parse(task.action_steps) : task.action_steps || [];
  } catch(e) {}

  let resources = [];
  try {
    resources = typeof task.resources === 'string' ? JSON.parse(task.resources) : task.resources || [];
  } catch(e) {}

  const getIcon = (type) => {
    switch(type) {
      case 'video': return <Play size={20} className="text-blue-500" />;
      case 'practice': return <PenTool size={20} className="text-emerald-500" />;
      default: return <BookOpen size={20} className="text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl border-l border-slate-200 z-40 transform transition-transform duration-300 overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
            {getIcon(task.task_type)}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{task.task_type || 'reading'}</div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">{task.title}</h2>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={24} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-8">
        
        {/* Expected Outcome */}
        {task.expected_outcome && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
            <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-1">Target Outcome</h4>
            <p className="text-indigo-900 font-medium">{task.expected_outcome}</p>
          </div>
        )}

        {/* Action Steps */}
        {actionSteps.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">🎯</span> 
              Action Steps
            </h3>
            <div className="space-y-3">
              {actionSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation */}
        {task.validation_criteria && (
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">✅</span> 
              Validation Check
            </h3>
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">{task.validation_type || 'self-check'}</div>
              <p className="text-slate-700 font-medium">{task.validation_criteria}</p>
            </div>
          </div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">📚</span> 
              Helpful Resources
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {resources.map((res, idx) => (
                <a key={idx} href={res.url !== 'url' ? res.url : '#'} target="_blank" rel="noreferrer" 
                   className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group">
                  <span className="font-bold text-slate-700 group-hover:text-indigo-600">{res.title}</span>
                  <ExternalLink size={16} className="text-slate-400 group-hover:text-indigo-500" />
                </a>
              ))}
            </div>
          </div>
        )}
        
      </div>

      <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10">
        <button 
          onClick={() => onComplete(task)}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
        >
          <CheckCircle size={24} />
          Complete & Earn +{task.xp_reward || 10} XP
        </button>
      </div>
    </div>
  );
};

export default TaskDrawer;
