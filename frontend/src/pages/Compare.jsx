import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Clock, Briefcase, CheckCircle, XCircle, ChevronRight, Target } from 'lucide-react';
import { careerService } from '../services/api';
import { useTranslation } from 'react-i18next';

const Compare = () => {
  const { t } = useTranslation();
  const [careers, setCareers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        setIsLoading(true);
        // Compare these 3 by default if no params
        const slugs = ["software-developer", "data-scientist", "ux-designer"];
        const res = await careerService.compare(slugs);
        if (res.data && res.data.success) {
          setCareers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load career data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[600px]">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800">{t('compare.loading', 'Loading Comparisons...')}</h2>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('compare.title', 'Career Comparison')}</h1>
          <p className="text-slate-600">{t('compare.subtitle', 'Compare different career paths side-by-side to make an informed decision')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {careers.map((career, idx) => {
            const isTopMatch = idx === 0;

            if (isTopMatch) {
              return (
                <div key={idx} className="bg-white border-2 border-indigo-200 rounded-2xl shadow-xl flex flex-col relative overflow-hidden">
                  {/* Internal top gradient/fill mimicking the screenshot Top Match */}
                  <div className="p-6 pb-2 relative z-10">
                    <span className="inline-block bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide mb-3 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                      {t('compare.top_match', 'Top Match')}
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">{career.name}</h2>
                    <p className="text-sm text-slate-500 mb-2">{career.category}</p>
                    <div className="flex items-center gap-1 text-indigo-600 font-bold mb-6">
                      <Target size={18} />
                      <span className="text-xl">92% {t('compare.match', 'Match')}</span>
                    </div>

                    <div className="space-y-4 text-sm font-medium">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><IndianRupee size={14}/> {t('compare.salary_range', 'Salary Range')}</span>
                        <span className="text-slate-800 font-bold">{career.salary_range}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><TrendingUp size={14}/> {t('compare.job_growth', 'Job Growth')}</span>
                        <span className="text-slate-800 font-bold">{career.job_growth_percentage}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Clock size={14}/> {t('compare.time_start', 'Time to Start')}</span>
                        <span className="text-slate-800 font-bold">{career.time_to_start}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Briefcase size={14}/> {t('compare.experience', 'Experience')}</span>
                        <span className="text-slate-800 font-bold">{career.experience_level}</span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <p className="text-xs font-bold text-emerald-500 tracking-wide uppercase mb-3 flex items-center gap-1"><CheckCircle size={14}/> {t('compare.advantages', 'Advantages')}</p>
                      <ul className="space-y-2 mb-6">
                        {career.advantages.map((adv, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-600">
                            <span className="text-emerald-500">✓</span> {adv}
                          </li>
                        ))}
                      </ul>

                      <p className="text-xs font-bold text-rose-500 tracking-wide uppercase mb-3 flex items-center gap-1"><XCircle size={14}/> {t('compare.challenges', 'Challenges')}</p>
                      <ul className="space-y-2 mb-8">
                        {career.challenges.map((chal, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-600">
                            <span className="text-rose-500">✗</span> {chal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-auto p-6 pt-0 space-y-3">
                    <button className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 rounded-xl transition-colors">
                      {t('compare.view_details', 'View Details')}
                    </button>
                    <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5">
                      {t('compare.start_learning', 'Start Learning Path')}
                    </button>
                  </div>
                </div>
              );
            }

            // Normal Cards
            const mockMatches = [88, 85];
            const matchScore = mockMatches[idx - 1] || 80;

            return (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800">{career.name}</h2>
                  <p className="text-sm text-slate-500 mb-2">{career.category}</p>
                  <div className="flex items-center gap-1 text-slate-600 font-bold mb-6">
                    <Target size={18} />
                    <span>{matchScore}% {t('compare.match', 'Match')}</span>
                  </div>

                  <div className="space-y-4 text-sm font-medium">
                    <div className="flex flex-col border-b border-slate-50 pb-3">
                      <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><IndianRupee size={14}/> {t('compare.salary_range', 'Salary Range')}</span>
                      <span className="text-slate-800">{career.salary_range}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-50 pb-3">
                      <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><TrendingUp size={14}/> {t('compare.job_growth', 'Job Growth')}</span>
                      <span className="text-slate-800">{career.job_growth_percentage}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-50 pb-3">
                      <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Clock size={14}/> {t('compare.time_start', 'Time to Start')}</span>
                      <span className="text-slate-800">{career.time_to_start}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-50 pb-3">
                      <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Briefcase size={14}/> {t('compare.experience', 'Experience')}</span>
                      <span className="text-slate-800">{career.experience_level}</span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-xs font-bold text-emerald-500 tracking-wide uppercase mb-3 flex items-center gap-1"><CheckCircle size={14}/> {t('compare.advantages', 'Advantages')}</p>
                    <ul className="space-y-2 mb-6">
                      {career.advantages.map((adv, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-emerald-500">✓</span> {adv}
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs font-bold text-rose-500 tracking-wide uppercase mb-3 flex items-center gap-1"><XCircle size={14}/> {t('compare.challenges', 'Challenges')}</p>
                    <ul className="space-y-2 mb-8">
                      {career.challenges.map((chal, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-rose-500">✗</span> {chal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto p-6 pt-0">
                  <button className="w-full border-2 border-slate-100 hover:border-slate-300 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                    {t('compare.view_details', 'View Details')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Compare;
