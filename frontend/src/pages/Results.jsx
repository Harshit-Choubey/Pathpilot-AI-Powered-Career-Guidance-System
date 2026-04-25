import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, TrendingUp, Clock, Briefcase, ChevronRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { assessmentService } from '../services/api';

// Career metadata for enriching ML results (salary, growth, etc.)
const CAREER_META = {
  "Software Developer": { salary: "₹6-18 LPA", growth: "High Growth", level: "Entry Level", time: "3-6 months", tags: ["Technology", "High Growth", "Remote Work"] },
  "Data Scientist": { salary: "₹8-18 LPA", growth: "Very High", level: "Entry Level", time: "6-12 months", tags: ["Analytics", "Python", "Statistics"] },
  "UX Designer": { salary: "₹6-12 LPA", growth: "Very High", level: "Entry Level", time: "3-6 months", tags: ["Design", "Research", "Prototyping"] },
  "Product Manager": { salary: "₹10-20 LPA", growth: "High Growth", level: "Mid Level", time: "12-18 months", tags: ["Strategy", "Leadership", "Analysis"] },
  "Digital Marketing Specialist": { salary: "₹4-10 LPA", growth: "Moderate", level: "Entry Level", time: "3-6 months", tags: ["Marketing", "Social Media", "SEO"] },
  "Business Analyst": { salary: "₹6-14 LPA", growth: "High Growth", level: "Entry Level", time: "6-12 months", tags: ["Analytics", "Strategy", "Communication"] },
  "Cybersecurity Analyst": { salary: "₹8-20 LPA", growth: "Very High", level: "Entry Level", time: "6-12 months", tags: ["Security", "Networking", "Risk"] },
  "DevOps Engineer": { salary: "₹8-22 LPA", growth: "Very High", level: "Mid Level", time: "6-12 months", tags: ["Cloud", "Automation", "Linux"] },
  "Machine Learning Engineer": { salary: "₹10-25 LPA", growth: "Very High", level: "Mid Level", time: "9-15 months", tags: ["AI/ML", "Python", "Statistics"] },
  "Financial Analyst": { salary: "₹5-12 LPA", growth: "Moderate", level: "Entry Level", time: "6-12 months", tags: ["Finance", "Excel", "Reporting"] },
};

const getCareerMeta = (careerName) =>
  CAREER_META[careerName] || { salary: "₹5-15 LPA", growth: "High Growth", level: "Entry Level", time: "6-12 months", tags: [careerName] };

const Results = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | processing | completed | error | empty
  const [assessment, setAssessment] = useState(null);
  const pollRef = useRef(null);

  const fetchLatest = async () => {
    try {
      const res = await assessmentService.getHistory();
      const history = res.data?.history || [];
      if (history.length === 0) {
        setStatus('empty');
        return;
      }
      const latest = history[0];
      setAssessment(latest);
      if (latest.status === 'completed' && latest.ml_results) {
        setStatus('completed');
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (latest.status === 'processing') {
        setStatus('processing');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchLatest();
    // Poll every 4 seconds if still processing
    pollRef.current = setInterval(() => {
      fetchLatest();
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Loading state ────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[500px]">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-5" />
        <h2 className="text-xl font-bold text-slate-800">Loading your results...</h2>
      </div>
    );
  }

  // ── Empty: no assessment taken ────────────────────────────────
  if (status === 'empty') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-5 min-h-[500px]">
        <AlertCircle size={48} className="text-amber-400" />
        <h2 className="text-2xl font-bold text-slate-800">No Assessment Found</h2>
        <p className="text-slate-500">You haven't completed a psychometric assessment yet.</p>
        <Link to="/assessment" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
          Start Assessment
        </Link>
      </div>
    );
  }

  // ── Processing: ML still running ─────────────────────────────
  if (status === 'processing') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-6 min-h-[500px] px-4">
        <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">ML Model Processing...</h2>
          <p className="text-slate-500 max-w-md">Your psychometric profile is being analyzed by our ensemble model (XGBoost + SVM + Gradient Boosting). This takes ~30 seconds.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium animate-pulse">
          <RefreshCw size={16} className="animate-spin" /> Auto-refreshing every 4 seconds...
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-5 min-h-[500px]">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
        <p className="text-slate-500">The ML pipeline encountered an error. Please try retaking the assessment.</p>
        <div className="flex gap-3">
          <button onClick={fetchLatest} className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition">
            Retry
          </button>
          <Link to="/assessment" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition">
            Retake Assessment
          </Link>
        </div>
      </div>
    );
  }

  // ── Completed: Render real ML results ─────────────────────────
  const predictions = assessment?.ml_results?.predictions || [];
  if (predictions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-5 min-h-[500px]">
        <AlertCircle size={48} className="text-amber-400" />
        <h2 className="text-2xl font-bold text-slate-800">No predictions available</h2>
        <p className="text-slate-500">The ML model didn't return predictions. Please retake the assessment.</p>
        <Link to="/assessment" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
          Retake Assessment
        </Link>
      </div>
    );
  }

  const top = predictions[0];
  const topMeta = getCareerMeta(top.career);
  const alternatives = predictions.slice(1);

  return (
    <div className="flex-1 bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
              <CheckCircle size={16} /> Analysis Complete
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Career Matches</h1>
            <p className="text-slate-600">Based on your psychometric profile, here are the careers that best match you.</p>
          </div>
          <Link to="/dashboard" className="text-sm text-indigo-600 font-bold hover:underline">
            Go to Dashboard →
          </Link>
        </div>

        {/* Top Match Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <svg width="400" height="400" viewBox="0 0 200 200">
              <path fill="#ffffff" d="M45.7,-76.4C58.9,-69.1,69.2,-55.4,78.2,-41.2C87.2,-27,94.9,-12.3,94.1,2.1C93.4,16.6,84.1,30.8,73.5,42.5C62.9,54.2,50.8,63.4,37.3,71.2C23.8,79,8.8,85.5,-5.8,88.7C-20.4,91.9,-34.5,92,-47.9,86.6C-61.2,81.1,-73.8,70,-80.7,56.5C-87.6,43,-88.9,27,-88.3,11.4C-87.8,-4.2,-85.4,-19.4,-78.9,-33.1C-72.3,-46.8,-61.7,-59,-48.6,-66.6C-35.4,-74.2,-19.7,-77.2,-3.1,-72.1C13.5,-67,29.3,-53.8,45.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
          
          <div className="relative z-10 w-full lg:w-2/3">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
              <span>Top Match — {top.matchPercentage?.toFixed(1)}% Compatible</span>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
              <div>
                <h2 className="text-4xl font-extrabold mb-4">{top.career}</h2>
                <div className="flex gap-3 mb-6 flex-wrap">
                  {topMeta.tags.map((tag, idx) => (
                    <span key={idx} className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block text-right self-start mt-2">
                <span className="text-6xl font-black text-white">{top.matchPercentage?.toFixed(0)}%</span>
                <p className="text-indigo-100 font-medium tracking-wide">Match Score</p>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Link to="/compare" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-6 py-3 rounded-lg font-bold backdrop-blur-sm">
                Compare Careers <ChevronRight size={18} />
              </Link>
              <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors px-6 py-3 rounded-lg font-bold">
                Go to Dashboard <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Alternative Matches */}
        {alternatives.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-5">Other Strong Matches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {alternatives.map((alt, idx) => {
                const meta = getCareerMeta(alt.career);
                return (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-800">{alt.career}</h3>
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                        {alt.matchPercentage?.toFixed(1)}% Match
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <IndianRupee size={16} className="text-slate-400" />
                        <span>{meta.salary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <TrendingUp size={16} className="text-slate-400" />
                        <span>{meta.growth}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Briefcase size={16} className="text-slate-400" />
                        <span>{meta.level}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Clock size={16} className="text-slate-400" />
                        <span>{meta.time}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {meta.tags.map((tag, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <Link to="/compare" className="mt-auto w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center font-bold text-sm transition-colors flex justify-center items-center gap-2">
                      Compare <ChevronRight size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Results;
