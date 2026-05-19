import { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, BookOpen, ExternalLink, Play } from 'lucide-react';
import { roadmapService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SkillGap = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await roadmapService.getSkillGap(i18n.language);
        if (res.data) {
          setData(res.data);
        }
      } catch (error) {
        // Silent fail or handle via global UI notification
        setData({ error: true });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[500px]">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-slate-800">{t('skill_gap.loading')}</h2>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('skill_gap.title')}</h1>
          <p className="text-slate-600">{t('skill_gap.subtitle')}</p>
        </div>

        {/* Global Progress Bar */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">{t('skill_gap.overall_progress')}</h2>
              <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                {t('skill_gap.complete_profile')}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-2">{t('skill_gap.for_career', { career: data.target_career })}</span>
              <span className="text-2xl font-black text-indigo-600">{data.progress_percentage}%</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-3 mb-8">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000" 
              style={{ width: `${data.progress_percentage}%` }}>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
              <span className="block text-2xl font-bold text-emerald-600">{data.mastered_count}</span>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">{t('skill_gap.skills_mastered')}</span>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
              <span className="block text-2xl font-bold text-orange-600">{data.in_progress_count}</span>
              <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">{t('skill_gap.in_progress')}</span>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-100">
              <span className="block text-2xl font-bold text-rose-600">{data.to_learn_count}</span>
              <span className="text-xs font-semibold text-rose-800 uppercase tracking-wide">{t('skill_gap.to_learn')}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
              <span className="block text-2xl font-bold text-slate-600">{data.total_skills}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('skill_gap.total_skills')}</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Skills) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Mastered Skills */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CheckCircle className="text-emerald-500" /> {t('skill_gap.mastered_title')}
              </h3>
              <div className="space-y-4">
                {data.mastered_skills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
                    <span className="font-semibold text-slate-700 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {skill.name}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      {skill.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills To Learn */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Target className="text-rose-500" /> {t('skill_gap.learn_title')}
              </h3>
              <div className="space-y-4">
                {data.skills_to_learn.map((skill) => (
                  <div key={skill.name} className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-slate-800">{skill.name}</h4>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        skill.status === 'High Priority' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {skill.status === 'High Priority' ? t('skill_gap.priority_high') : skill.status === 'Medium Priority' ? t('skill_gap.priority_medium') : skill.status}
                      </span>
                    </div>
                    {skill.description && (
                      <p className="text-sm text-slate-500 mb-4">{skill.description}</p>
                    )}
                    {skill.timeframe && (
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <Clock size={14} /> {skill.timeframe} {t('skill_gap.estimated')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (Courses) */}
          <div className="space-y-6">
            
            {/* CTA Box */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Play className="fill-white" size={20}/> {t('skill_gap.start_learning')}</h3>
                 <p className="text-indigo-100 text-sm mb-6">{t('skill_gap.cta_desc')}</p>
                 <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-xl backdrop-blur-sm transition-colors border border-white/30 shadow-sm">
                   {t('skill_gap.browse_courses')}
                 </button>
               </div>
            </div>

            {/* Courses List */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 text-lg">{t('skill_gap.recommended_courses')}</h3>
              <div className="space-y-4">
                {data.recommended_courses.map((course) => (
                  <div key={course.title} className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors group">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight mb-1">{course.title}</h4>
                        <p className="text-xs text-slate-500">{course.platform}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-4 ml-13">
                      <span className="flex items-center gap-1 text-amber-500">★ {course.rating}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={12}/> {course.hours} {t('skill_gap.hours')}</span>
                    </div>

                    <a href={course.url} className="text-xs font-bold text-indigo-600 flex justify-center items-center gap-1 w-full py-2 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors group-hover:bg-indigo-50">
                      {t('skill_gap.view_course')} <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SkillGap;
