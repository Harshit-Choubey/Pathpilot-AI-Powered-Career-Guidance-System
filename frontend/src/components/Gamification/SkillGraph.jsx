import React from 'react';

const SkillGraph = ({ data }) => {
  if (!data || data.length === 0) return (
    <div className="text-center p-6 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
      Complete tasks to generate your skill graph.
    </div>
  );

  return (
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
            <span>{item.skill}</span>
            <span>{item.completed_tasks}/{item.total_tasks}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkillGraph;
