import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Play, FileText, CheckCircle, Clock, BookOpen, PenTool, Rocket, ChevronDown, List } from 'lucide-react';
import { roadmapService } from '../services/api';
import { useTranslation } from 'react-i18next';

const RoadmapPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const career = location.state?.career;

  const [status, setStatus] = useState('generating'); // generating, ready, error
  const [roadmap, setRoadmap] = useState([]);
  const [expandedPhase, setExpandedPhase] = useState(0);

  useEffect(() => {
    if (!career) return;

    const generateAndPoll = async () => {
      try {
        // Step 1: Trigger Generation
        await roadmapService.generateRoadmap(career, i18n.language);
        
        // Step 2: Poll for completion
        let attempts = 0;
        const maxAttempts = 15; // 45 seconds total
        
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const res = await roadmapService.getRoadmap();
            const arr = Array.isArray(res?.data) ? res.data : [];
            
            if (arr.length > 0) {
              setRoadmap(arr);
              setStatus('ready');
              clearInterval(pollInterval);
              return;
            }
          } catch (e) {
            console.warn("Polling error:", e);
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setStatus('error');
          }
        }, 3000);

      } catch (err) {
        console.error("Failed to start generation", err);
        setStatus('error');
      }
    };

    generateAndPoll();
  }, [career]);

  if (!career) {
    return <Navigate to="/results" replace />;
  }

  // ── Generating State ──────────────────────────────────────────────────
  if (status === 'generating') {
    return (
      <div className="flex-1 min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket size={32} className="text-indigo-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
          {t('dashboard.building_curriculum', 'Building your {{career}} Curriculum', { career: career }).split(career).reduce((prev, current, i) => {
            if (!i) return [current];
            return prev.concat(<span key={i} className="text-indigo-600">{career}</span>, current);
          }, [])}
        </h2>
        <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
          {t('dashboard.mapping_phases', 'Our AI is mapping out your phases, detailing action steps, and structuring your daily execution missions...')}
        </p>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-8 animate-pulse">
          {t('dashboard.takes_30_seconds', 'Usually takes ~30 seconds')}
        </p>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="flex-1 min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('dashboard.generation_timeout', 'Generation Timeout')}</h2>
        <p className="text-slate-500 mb-6 max-w-md">{t('dashboard.timeout_desc', 'The AI curriculum took too long to build. This can happen during peak loads.')}</p>
        <button 
          onClick={() => setStatus('generating')} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl"
        >
          {t('dashboard.try_again', 'Try Again')}
        </button>
      </div>
    );
  }

  // ── Ready / Preview State ──────────────────────────────────────────────
  return (
    <div className="flex-1 bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 font-bold px-4 py-1.5 rounded-full text-sm mb-6 shadow-sm">
            <CheckCircle size={18} /> {t('dashboard.curriculum_generated', 'Curriculum Generated')}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            {t('dashboard.your_masterplan', 'Your {{career}} Masterplan', { career })}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('dashboard.review_syllabus', "Review your tailored syllabus below. When you're ready, initialize the gamified execution engine to start tracking your daily progress.")}
          </p>
        </div>

        {/* Syllabus Timeline */}
        <div className="space-y-6 mb-12">
          {roadmap.map((phase, idx) => (
            <div key={phase.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              {/* Phase Header */}
              <div 
                className="p-6 cursor-pointer flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedPhase(expandedPhase === idx ? -1 : idx)}
              >
                <div>
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">
                    {t('dashboard.phase_number', 'Phase {{number}}', { number: phase.phase_number || idx + 1 })}
                  </h3>
                  <h2 className="text-xl font-bold text-slate-800">{phase.title}</h2>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="hidden sm:flex items-center gap-1 text-sm font-medium">
                    <List size={16} /> {t('dashboard.modules', '{{length}} Modules', { length: phase.tasks.length })}
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`transform transition-transform ${expandedPhase === idx ? 'rotate-180' : ''}`} 
                  />
                </div>
              </div>

              {/* Phase Content (Tasks) */}
              {expandedPhase === idx && (
                <div className="p-6 border-t border-slate-100 bg-white space-y-4">
                  {phase.description && (
                    <p className="text-slate-600 mb-6 text-sm leading-relaxed border-l-4 border-indigo-200 pl-4">
                      {phase.description}
                    </p>
                  )}
                  
                  {phase.tasks.map((task, tIdx) => (
                    <div key={task.id} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50/30">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-1">
                        {task.task_type === 'video' ? <Play size={18} /> : 
                         task.task_type === 'practice' ? <PenTool size={18} /> : 
                         <BookOpen size={18} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 mb-1">{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center gap-1">
                            <Clock size={12} /> {task.estimated_minutes} min
                          </span>
                          <span className={`px-2 py-1 rounded capitalize ${
                            task.difficulty === 'Beginner' ? 'bg-blue-50 text-blue-700' : 
                            task.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {task.difficulty === 'Beginner' ? t('dashboard.beginner') : 
                             task.difficulty === 'Intermediate' ? t('dashboard.intermediate') : 
                             t('dashboard.advanced')}
                          </span>
                          {task.project_linked && (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{t('dashboard.project', 'Project')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action CTA */}
        <div className="sticky bottom-6 bg-white p-6 rounded-2xl shadow-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="font-black text-slate-800 text-lg">{t('dashboard.ready_begin', 'Ready to begin?')}</h3>
            <p className="text-slate-500 text-sm">{t('dashboard.start_missions_xp', 'Start your daily missions and earn XP.')}</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-4 px-10 rounded-xl shadow-lg shadow-indigo-200 transform transition hover:-translate-y-1"
          >
            {t('dashboard.start_execution_engine')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoadmapPreview;
