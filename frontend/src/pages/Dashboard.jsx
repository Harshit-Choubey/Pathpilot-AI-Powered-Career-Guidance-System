import React, { useState, useEffect, useCallback } from 'react';
import { Target, Compass, Lock, CheckCircle, LayoutList, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roadmapService, progressService } from '../services/api';
import { useTranslation } from 'react-i18next';

import XPBar from '../components/Gamification/XPBar';
import SkillGraph from '../components/Gamification/SkillGraph';
import TaskDrawer from '../components/Gamification/TaskDrawer';
import FeedbackModal from '../components/Gamification/FeedbackModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState(null);
  const [dailyMission, setDailyMission] = useState({ tasks: [], total_xp_available: 0, message: '' });
  const [skillGraph, setSkillGraph] = useState([]);
  const [roadmap, setRoadmap] = useState([]);          // English source-of-truth
  const [displayRoadmap, setDisplayRoadmap] = useState([]); // What's actually rendered
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Interactions
  const [selectedTask, setSelectedTask] = useState(null);
  const [feedbackTask, setFeedbackTask] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [targetCareer, setTargetCareer] = useState("Software Developer");

  // ── Translation helper ───────────────────────────────────────────────────
  const applyTranslation = useCallback(async (lng, sourceRoadmap) => {
    if (!sourceRoadmap || sourceRoadmap.length === 0) return;

    if (lng === 'en') {
      setDisplayRoadmap(sourceRoadmap);
      return;
    }

    // Check sessionStorage cache first
    const cacheKey = `roadmap_translated_${lng}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setDisplayRoadmap(JSON.parse(cached));
        return;
      } catch (_) { /* cache corrupt, re-translate */ }
    }

    // Call translate endpoint
    setIsTranslating(true);
    try {
      const res = await roadmapService.translateRoadmap(lng);
      const translated = Array.isArray(res?.data) ? res.data : [];
      if (translated.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(translated));
        setDisplayRoadmap(translated);
      } else {
        setDisplayRoadmap(sourceRoadmap); // fallback to English
      }
    } catch (e) {
      console.warn('Roadmap translation failed, showing English:', e);
      setDisplayRoadmap(sourceRoadmap);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Invalidate cache when roadmap changes (new generation)
  const invalidateTranslationCache = () => {
    ['hi', 'mr'].forEach(lng => sessionStorage.removeItem(`roadmap_translated_${lng}`));
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [progRes, missRes, skillRes, roadRes, assRes] = await Promise.all([
        progressService.getProgress().catch(() => null),
        progressService.getDailyMission().catch(() => null),
        progressService.getSkillGraph().catch(() => null),
        roadmapService.getRoadmap().catch(() => null),
        import('../services/api').then(m => m.assessmentService.getHistory()).catch(() => null)
      ]);

      if (progRes?.data) setProgress(progRes.data);
      if (missRes?.data) setDailyMission(missRes.data);
      if (skillRes?.data) setSkillGraph(skillRes.data);
      
      const rdArr = Array.isArray(roadRes?.data) ? roadRes.data : [];
      if (rdArr.length > 0) {
        setRoadmap(rdArr);
        setDisplayRoadmap(rdArr); // set English immediately
        // Then apply translation if needed
        applyTranslation(i18n.language, rdArr);
      }

      // Extract target career from assessment history
      const history = assRes?.data?.history || [];
      if (history.length > 0 && history[0].ml_results?.predictions?.length > 0) {
        setTargetCareer(history[0].ml_results.predictions[0].career);
      }
      
    } catch (e) {
      console.error("Dashboard data load failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Re-translate whenever language changes and we already have a roadmap
  useEffect(() => {
    if (roadmap.length > 0) {
      applyTranslation(i18n.language, roadmap);
    }
  }, [i18n.language, roadmap, applyTranslation]);

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      // Pass active language so new roadmap is generated in that language
      await roadmapService.generateRoadmap(targetCareer, i18n.language);
      invalidateTranslationCache(); // bust old translations

      // Poll every 3s for up to 15 attempts (45s max)
      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const res = await roadmapService.getRoadmap();
          const arr = Array.isArray(res?.data) ? res.data : [];
          if (arr.length > 0) {
            setRoadmap(arr);
            setDisplayRoadmap(arr);
            setIsGenerating(false);
            clearInterval(pollInterval);
            fetchDashboardData(); // Refresh all gamification stats
            return;
          }
        } catch (pollErr) {
          console.warn(`Poll attempt ${attempts} failed:`, pollErr);
        }
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setIsGenerating(false);
          setGenerateError(t('dashboard.generation_timed_out'));
        }
      }, 3000);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
      setGenerateError(t('dashboard.failed_start_generation'));
    }
  };

  const handleTaskCompleteTrigger = (task) => {
    setSelectedTask(null); // close drawer
    setFeedbackTask(task); // open feedback modal
  };

  const handleFeedbackSuccess = (data) => {
    // Refresh dashboard to get updated XP, streak, and next daily mission
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">{t('dashboard.loading_adaptive')}</p>
      </div>
    );
  }

  // Helper to find current phase name from roadmap
  const activeNode = displayRoadmap.find(n => !n.is_completed) || displayRoadmap[0];

  // Helper: safely parse skill_tags regardless of format (array or JSON string)
  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try { return JSON.parse(tags); } catch { return []; }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-slate-500 font-medium mt-1">{t('dashboard.welcome_back')} {user?.full_name}</p>
        </div>
        {isTranslating && (
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
            <Languages size={16} />
            <span>{t('dashboard.translating_roadmap')}</span>
          </div>
        )}
      </div>

      {/* ZONE 1: Gamification HUD */}
      {progress && <XPBar progress={progress} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZONE 2: Daily Mission Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Target size={22} className="text-indigo-600" /> {t('dashboard.today_mission')}
            </h3>
            <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs">
              {dailyMission.total_xp_available} {t('dashboard.xp_available')}
            </span>
          </div>

          {generateError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
              {generateError}
            </div>
          )}

          {displayRoadmap.length === 0 ? (
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('dashboard.no_curriculum_title')}</h3>
              <p className="text-slate-500 font-medium mb-6">{t('dashboard.no_curriculum_desc')}</p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.location.href = '/results'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                >
                  {t('dashboard.view_career_matches')}
                </button>
              </div>
            </div>
          ) : dailyMission.tasks.length === 0 ? (
             <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle size={32} />
               </div>
               <h3 className="text-2xl font-bold text-emerald-800 mb-2">{t('dashboard.module_conquered')}</h3>
               <p className="text-emerald-600 font-medium">{t('dashboard.all_tasks_cleared')}</p>
             </div>
          ) : (
            <div className="space-y-4">
              {dailyMission.tasks.map((task) => {
                // Find translated version of task from displayRoadmap
                const translatedTask = displayRoadmap
                  .flatMap(n => n.tasks || [])
                  .find(dt => dt.id === task.id) || task;
                return (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTask({ ...task, ...translatedTask })}
                  className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group flex items-start gap-4 cursor-pointer relative overflow-hidden"
                >
                  {task.project_linked && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                      {t('dashboard.project')}
                    </div>
                  )}
                  
                  <div className="flex-1 mt-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-700 transition-colors pr-10">
                        {translatedTask.title || task.title}
                      </h4>
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                        {task.estimated_minutes} min
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`px-2 py-1 rounded-md border text-xs font-bold capitalize ${
                        task.difficulty === 'Beginner' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        task.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {task.difficulty === 'Beginner' ? t('dashboard.beginner') : 
                         task.difficulty === 'Intermediate' ? t('dashboard.intermediate') : 
                         t('dashboard.advanced')}
                      </span>
                      
                      {parseTags(task.skill_tags).slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ZONE 3: Sidebar */}
        <div className="space-y-8">
          
          {/* Phase Tracker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Compass size={18} className="text-indigo-500" /> {t('dashboard.current_phase')}
            </h3>
            {activeNode ? (
              <div>
                <h4 className="text-lg font-black text-slate-800 leading-tight mb-2">{activeNode.title}</h4>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                  <span>{t('dashboard.phase_progress')}</span>
                  <span>{(activeNode.tasks || []).filter(t => t.is_completed).length} / {(activeNode.tasks || []).length} {t('dashboard.tasks')}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${((activeNode.tasks || []).filter(t => t.is_completed).length / Math.max(1, (activeNode.tasks || []).length)) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t('dashboard.no_active_roadmap')}</p>
            )}
          </div>

          {/* Skill Graph */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <LayoutList size={18} className="text-indigo-500" /> {t('dashboard.skill_progress')}
            </h3>
            <SkillGraph data={skillGraph} />
          </div>

          {/* Regenerate Action */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
            <h3 className="font-bold text-slate-800 mb-2">{t('dashboard.want_new_path')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('dashboard.regenerate_desc')}</p>
            <button 
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {isGenerating ? t('dashboard.generating') : t('dashboard.regenerate')}
            </button>
          </div>

        </div>
      </div>

      {/* Drawers & Modals */}
      <TaskDrawer 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)}
        onComplete={handleTaskCompleteTrigger}
      />

      {feedbackTask && (
        <FeedbackModal 
          task={feedbackTask}
          onClose={() => setFeedbackTask(null)}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
