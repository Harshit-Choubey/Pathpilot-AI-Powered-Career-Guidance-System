import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, CheckCircle, Clock, Play, BookOpen, Lock, Rocket, LayoutList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { assessmentService, roadmapService } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch each independently — a failed roadmap/analytics call
        // should NOT crash the dashboard or trigger logout
        const [assData, rdData, anData] = await Promise.all([
          assessmentService.getHistory().catch(() => null),
          roadmapService.getRoadmap().catch(() => null),
          import('../services/api').then(m => m.eventService.getAnalytics()).catch(() => null)
        ]);

        if (assData?.data?.success) setAssessmentHistory(assData.data.history);
        else if (assData?.data?.history) setAssessmentHistory(assData.data.history);
        if (rdData?.data) setRoadmap(rdData.data);
        if (anData?.data?.success) setAnalytics(anData.data.analytics);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateRoadmap = async (targetCareer) => {
    setIsGenerating(true);
    try {
      await roadmapService.generateRoadmap(targetCareer);
      // Mock refresh after 5s processing
      setTimeout(async () => {
        const rdData = await roadmapService.getRoadmap();
        if (rdData.data) setRoadmap(rdData.data);
        setIsGenerating(false);
      }, 5000);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  const latestAssessment = assessmentHistory.length > 0 ? assessmentHistory[0] : null;
  // Show as completed if ml_results exist regardless of status field
  const isCompleted = !!(latestAssessment?.ml_results?.predictions?.length > 0);
  const predictions = latestAssessment?.ml_results?.predictions || [];
  const topCareer = predictions.length > 0 ? predictions[0].career : "Software Developer";

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[600px]">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800">Loading Execution OS...</h2>
      </div>
    );
  }

  // VIEW 1: If no Roadmap Generated yet, prompting them to lock a goal
  if (roadmap.length === 0) {
    return (
      <div className="flex-1 bg-slate-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-4">You Have No Active Goals</h1>
            <p className="text-lg text-slate-500">PathPilot is a career execution engine. You must lock a target destination to generate your daily action plan.</p>
          </div>

          {latestAssessment && !isCompleted ? (
            // Assessment exists but ML still processing
            <div className="bg-white rounded-3xl p-10 border border-amber-200 shadow-xl text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">ML Analysis Running...</h2>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto">Your psychometric profile is being processed by the AI model. Check back in a moment.</p>
              <div className="flex gap-4 justify-center">
                <Link to="/results" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition shadow-lg">
                  Check Results Page
                </Link>
                <Link to="/assessment" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-50 transition">
                  Continue Assessment
                </Link>
              </div>
            </div>
          ) : !latestAssessment ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Complete Your Assessment</h2>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto">Take the psychometric assessment to unlock AI-powered career recommendations.</p>
              <Link to="/assessment" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-indigo-700 transition shadow-lg hover:-translate-y-1">
                Start Assessment <Play size={20} />
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 border border-indigo-500/30 shadow-2xl relative overflow-hidden mb-12">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-left text-white">
                  <div className="inline-flex items-center gap-2 text-indigo-300 font-bold tracking-widest text-xs uppercase mb-3">
                    <Rocket size={14} /> AI Recommendation Ready
                  </div>
                  <h2 className="text-3xl font-black mb-2">Target: {topCareer}</h2>
                  <p className="text-indigo-200 text-lg mb-6 leading-relaxed">
                    Based on your psychometric profile, this is your optimal path. Ready to commit? The Generative AI will build a tactical 12-week execution syllabus specifically for this goal.
                  </p>
                  
                  {isGenerating ? (
                    <div className="flex items-center gap-4 text-emerald-400 font-bold bg-white/10 p-4 rounded-xl border border-white/20 w-fit backdrop-blur-md">
                      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                      Generating 12-Week Execution Roadmap...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => handleGenerateRoadmap(topCareer)}
                        className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-1"
                      >
                        <Lock size={20} /> Lock Goal & Generate Roadmap
                      </button>
                      <Link to="/results" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition border border-white/20">
                        View Career Matches →
                      </Link>
                    </div>
                  )}
                </div>
                <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                  <h3 className="font-bold text-white mb-4 border-b border-white/20 pb-2">Execution Pipeline</h3>
                  <ul className="space-y-3 text-sm text-indigo-100 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> Daily Micro-Tasks</li>
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> Weekly Milestones</li>
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> Project Portfolio Sync</li>
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> Pacing Automation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Restoring Quick Actions block so the UI is heavily populated even without a Roadmap */}
          <h2 className="text-xl font-bold text-slate-800 mb-4 text-left">Explore PathPilot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link to="/compare" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Target size={24} /></div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Compare Careers</h3>
                <p className="text-sm text-slate-500">View salary and growth metrics alongside missing skills.</p>
              </div>
            </Link>
            <Link to="/skill-gap" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-start gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><BookOpen size={24} /></div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Skill Gap Analysis</h3>
                <p className="text-sm text-slate-500">View Recommended Courses and check missing skills.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: Roadmap Exists - The Daily Execution Dashboard
  // Flattens out today's pending tasks (First incomplete node -> first incomplete tasks)
  const activeNode = roadmap.find(n => !n.is_completed) || roadmap[0];
  const pendingTasks = activeNode?.tasks.filter(t => !t.is_completed) || [];
  
  return (
    <div className="flex-1 bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-3">
              <Target size={14} /> Locked: {topCareer}
            </div>
            <h1 className="text-3xl font-black text-slate-900">Let's build, {user?.full_name.split(' ')[0]} 🚀</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 shadow-sm">Current Module</p>
            <h2 className="text-xl font-bold text-slate-800">{activeNode?.title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Execution Area */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <LayoutList size={22} className="text-indigo-600" /> Today's Action Plan
            </h3>
            
            {pendingTasks.length === 0 ? (
               <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Target size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-emerald-800 mb-2">Module Conquered!</h3>
                 <p className="text-emerald-600 font-medium">You've cleared all daily tasks for this milestone.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.slice(0, 4).map((task, idx) => (
                  <div key={idx} className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-300 transition-colors group flex items-start gap-4 cursor-pointer">
                    <button className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-colors mt-1">
                      <CheckCircle size={16} className="text-transparent group-hover:text-emerald-500" />
                    </button>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-700 transition-colors">{task.title}</h4>
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                          {task.estimated_minutes} min
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                        <span className={`px-2 py-1 rounded-md border ${
                          task.difficulty === 'Beginner' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          task.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {task.difficulty}
                        </span>
                        <span className="text-slate-400 capitalize flex items-center gap-1">
                          <BookOpen size={12} /> {task.task_type || 'Reading'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-6">
            
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="font-bold text-lg mb-1">Portfolio Tracker</h3>
                 <p className="text-indigo-100 text-sm mb-6">Build real-world projects to escape tutorial hell.</p>
                 <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                   <div className="flex justify-between text-xs font-bold mb-2">
                     <span>Deployment Ready</span>
                     <span>0 / 3</span>
                   </div>
                   <div className="w-full bg-white/20 rounded-full h-1.5">
                     <div className="bg-emerald-400 h-1.5 rounded-full" style={{width: '5%'}}></div>
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Milestone Overview</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {roadmap.slice(0, 3).map((node, i) => (
                   <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white z-10 shrink-0 ${node.is_completed ? 'border-emerald-500' : 'border-indigo-500'}`}>
                        {node.is_completed && <CheckCircle size={14} className="text-emerald-500"/>}
                     </div>
                     <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded bg-slate-50 border border-slate-100 shadow-sm ml-3">
                       <h4 className="font-bold text-slate-800 text-sm truncate">{node.title}</h4>
                     </div>
                   </div>
                ))}
              </div>
            </div>

            {/* Execution Analytics */}
            {analytics && analytics.weekly_velocity_data && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
                  <span>Execution Heatmap</span>
                  <span className="text-xs text-slate-500 font-normal">Min / Day</span>
                </h3>
                <div className="flex items-end justify-between gap-1 h-24 mb-2">
                  {analytics.weekly_velocity_data.map((dayData, i) => {
                    // Maximum bar height logic (assuming ~120 mins is a full day of study)
                    const maxMins = 120;
                    const heightPercent = Math.min((dayData.minutes / maxMins) * 100, 100);
                    
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 transition-all group relative">
                         {/* Tooltip */}
                         <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                           {dayData.minutes} mins
                         </div>
                         <div className="w-full bg-slate-100 rounded-t-sm flex items-end h-full">
                           <div 
                             className={`w-full rounded-t-sm transition-all duration-500 ${heightPercent > 0 ? 'bg-indigo-500' : ''} ${heightPercent > 80 ? 'bg-indigo-600' : ''}`}
                             style={{height: `${heightPercent || 2}%`}}
                           ></div>
                         </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                  {analytics.weekly_velocity_data.map((dayData, i) => (
                    <span key={i} className="truncate w-8 text-center">{dayData.date.split(' ')[0]} {dayData.date.split(' ')[1]}</span>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
