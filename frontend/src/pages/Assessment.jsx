import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, BarChart2, ArrowRight, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'pathpilot_assessment_state';

const ASSESSMENT_STAGES = [
  { id: 'inclination', title: "Quick Inclination", subtitle: "Part 1 of 4", desc: "5 rapid-fire questions to set your baseline." },
  { id: 'objective', title: "Core Objective", subtitle: "Part 2 of 4", desc: "Comprehensive evaluation of your 10 core traits." },
  { id: 'preference', title: "Preferences", subtitle: "Part 3 of 4", desc: "Situational scenarios and work style options." },
  { id: 'subjective', title: "Subjective Details", subtitle: "Part 4 of 4", desc: "In-depth textual elaboration on your goals." }
];

const LIKERT_OPTIONS = [
  { val: 1, label: "Strongly Disagree" },
  { val: 2, label: "Disagree" },
  { val: 3, label: "Neutral" },
  { val: 4, label: "Agree" },
  { val: 5, label: "Strongly Agree" }
];

const PREF_OPTIONS = {
  37: ["Solving problems", "Designing/creating", "Helping people", "Managing/leading", "Building/repairing", "Organizing data"],
  38: ["Mathematics", "Arts/Design", "Psychology/Sociology", "Business Studies", "Physics/Engineering", "Accounts/Statistics"],
  39: ["Research lab", "Creative studio", "Social/community space", "Corporate/business setting", "Field/technical environment", "Office/data-driven setup"],
  40: ["Solving complex problems", "Creating something new", "Helping others", "Achieving leadership success", "Working with machines", "Organizing systems"]
};

const INCLINATION_QUESTIONS = [
  "I prefer to have a clear plan before starting a new project.",
  "I am comfortable adapting to unexpected changes in my environment.",
  "I naturally take charge and lead group discussions.",
  "I prefer working with concrete data and numbers over abstract concepts.",
  "I consider myself a highly creative and out-of-the-box thinker."
].map((text, i) => ({ id: `inc${i+1}`, type: 'likert', text }));

const OBJECTIVE_QUESTIONS = Array.from({length: 36}, (_, i) => ({ id: `q${i+1}`, type: 'likert', text: [
  "I enjoy solving puzzles and brain teasers.", "I like analyzing data and finding patterns.", "Mathematics is one of my strong subjects.",
  "I enjoy experimenting and testing ideas.", "I prefer tasks that require critical thinking.", "I like understanding how systems or machines work.",
  "I enjoy drawing, designing, or creating art.", "I prefer creative tasks over structured ones.", "I like expressing ideas through writing or storytelling.",
  "I enjoy music, dance, or performing arts.", "I think differently and come up with unique ideas.", "I enjoy working on design-related tools.",
  "I enjoy helping others solve their problems.", "I like working in teams rather than alone.", "I am comfortable speaking in front of people.",
  "I enjoy teaching or explaining concepts.", "I easily understand others' emotions.", "I prefer careers that involve interaction with people.",
  "I like leading teams or organizing events.", "I enjoy convincing or influencing people.", "I am interested in business or startups.",
  "I take initiative in group activities.", "I enjoy decision-making responsibilities.", "I am comfortable taking risks.",
  "I enjoy working with tools, machines, or hardware.", "I prefer hands-on activities over theory.", "I like building or fixing things.",
  "I enjoy outdoor or physical work.", "I am interested in engineering or technical fields.", "I prefer practical tasks over desk jobs.",
  "I like organizing data, files, or schedules.", "I prefer structured and clear instructions.", "I pay attention to small details.",
  "I enjoy working with numbers, records, or documentation.", "I prefer routine and stability in work.", "I like planning and managing tasks efficiently."
][i] }));

const PREFERENCE_QUESTIONS = [
  { id: 'q37', type: 'choice', text: "Which activity do you enjoy the most?", options: PREF_OPTIONS[37] },
  { id: 'q38', type: 'choice', text: "Which subject do you like the most?", options: PREF_OPTIONS[38] },
  { id: 'q39', type: 'choice', text: "What kind of work environment do you prefer?", options: PREF_OPTIONS[39] },
  { id: 'q40', type: 'choice', text: "What motivates you the most?", options: PREF_OPTIONS[40] }
];

const SUBJECTIVE_QUESTIONS = [
  "Describe an activity you enjoy doing the most and why.", "What are your top 3 strengths? Explain briefly.", "What type of career do you currently feel interested in and why?",
  "Describe a situation where you solved a problem successfully.", "What kind of work would make you feel satisfied every day?", "Do you prefer working alone or in a team? Explain your choice.",
  "What are your long-term goals or aspirations?", "Describe a project or task you were passionate about.", "What skills do you think you need to improve for your future career?",
  "If there were no restrictions, what career would you choose and why?"
].map((text, i) => ({ id: `q${41+i}`, type: 'text', text }));

const STAGE_MAP = {
  'inclination': INCLINATION_QUESTIONS,
  'objective': OBJECTIVE_QUESTIONS,
  'preference': PREFERENCE_QUESTIONS,
  'subjective': SUBJECTIVE_QUESTIONS
};

// Load saved state from localStorage
const loadSavedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return null;
};

// Save state to localStorage
const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
};

// Clear saved state (after final submission)
const clearSavedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* ignore */ }
};

const Assessment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Restore from localStorage on mount so returning users resume from where they left off
  const saved = loadSavedState();

  const [stageIdx, setStageIdx] = useState(saved?.stageIdx ?? 0);
  const [questionIdx, setQuestionIdx] = useState(saved?.questionIdx ?? 0);
  // cumulative answers across ALL phases — this is what gets sent to ML
  const [answers, setAnswers] = useState(saved?.answers ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStageComplete, setShowStageComplete] = useState(false);

  const currentStage = ASSESSMENT_STAGES[stageIdx];
  const questionsList = STAGE_MAP[currentStage.id];
  const q = questionsList[questionIdx];
  const isLastStage = stageIdx === ASSESSMENT_STAGES.length - 1;
  const isLastQuestion = questionIdx === questionsList.length - 1;

  const totalQuestions = INCLINATION_QUESTIONS.length + OBJECTIVE_QUESTIONS.length + PREFERENCE_QUESTIONS.length + SUBJECTIVE_QUESTIONS.length;
  const globalProgressCount = Object.keys(answers).length;
  const progress = Math.min(100, Math.round((globalProgressCount / totalQuestions) * 100));

  // Persist state on every change
  useEffect(() => {
    saveState({ stageIdx, questionIdx, answers });
  }, [stageIdx, questionIdx, answers]);

  const handleSelect = (val) => setAnswers({ ...answers, [q.id]: val });
  const handleTextChange = (e) => setAnswers({ ...answers, [q.id]: e.target.value });

  const handleNext = () => {
    if (!answers[q.id]) return;
    if (!isLastQuestion) {
      setQuestionIdx(prev => prev + 1);
    } else {
      setShowStageComplete(true);
    }
  };

  const handlePrev = () => {
    if (showStageComplete) { setShowStageComplete(false); return; }
    if (questionIdx > 0) {
      setQuestionIdx(prev => prev - 1);
    } else if (stageIdx > 0) {
      setStageIdx(prev => prev - 1);
      setQuestionIdx(STAGE_MAP[ASSESSMENT_STAGES[stageIdx - 1].id].length - 1);
    }
  };

  // Submit ALL cumulative answers to the ML model and navigate to results
  const submitAndViewResults = async () => {
    setIsSubmitting(true);
    try {
      // Send ALL answers collected across all phases (not just current stage)
      const stringifiedAnswers = Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [k, String(v)])
      );
      await api.post('/assessment/submit', { answers: stringifiedAnswers, demographics: {} });
      // Clear saved progress only after successful submission
      clearSavedState();
      navigate('/results');
    } catch (err) {
      console.error(err);
      alert("Failed to submit. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Continue to next stage — keep all answers, just advance stage
  const continueToNextStage = () => {
    setShowStageComplete(false);
    setStageIdx(prev => prev + 1);
    setQuestionIdx(0);
  };

  // ── Submitting spinner ─────────────────────────────────────────
  if (isSubmitting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-800">{t('assessment.launching')}</h2>
        <p className="text-slate-500 mt-2">{t('assessment.profile_queued')}</p>
      </div>
    );
  }

  // ── Stage Complete Gate ────────────────────────────────────────
  if (showStageComplete) {
    return (
      <div className="flex-1 bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={42} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {currentStage.title} {t('assessment.stage_complete')}
            </h2>
            <p className="text-slate-500 mb-2">{currentStage.subtitle} — {Object.keys(answers).length} {t('assessment.questions_answered')}</p>
            <p className="text-slate-500 mb-10">
              {isLastStage
                ? t('assessment.full_assessment_complete')
                : t('assessment.partial_analysis')
              }
            </p>

            <div className={`grid gap-4 ${isLastStage ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {/* PRIMARY: View Results (submits all cumulative answers) */}
              <button
                onClick={submitAndViewResults}
                className="flex flex-col items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 px-6 rounded-2xl transition shadow-lg hover:-translate-y-1"
              >
                <BarChart2 size={28} />
                <span className="text-lg">{isLastStage ? t('assessment.submit_full') : t('assessment.see_results_now')}</span>
                <span className="text-indigo-200 text-sm font-normal">
                  {isLastStage ? t('assessment.complete_analysis') : `${t('assessment.based_on')} ${Object.keys(answers).length} ${t('assessment.answers')}`}
                </span>
              </button>

              {/* SECONDARY: Continue to next stage */}
              {!isLastStage && (
                <button
                  onClick={continueToNextStage}
                  className="flex flex-col items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold py-5 px-6 rounded-2xl transition border-2 border-slate-200 hover:border-indigo-300 hover:-translate-y-1"
                >
                  <ArrowRight size={28} className="text-indigo-600" />
                  <span className="text-lg">{t('assessment.continue_to')} {ASSESSMENT_STAGES[stageIdx + 1].title}</span>
                  <span className="text-slate-500 text-sm font-normal">
                    {ASSESSMENT_STAGES[stageIdx + 1].subtitle} — {t('assessment.more_accurate')}
                  </span>
                </button>
              )}

              {/* Dashboard shortcut */}
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-medium py-3 px-6 rounded-xl transition text-sm ${isLastStage ? '' : 'sm:col-span-2'}`}
              >
                <Home size={16} /> {t('assessment.save_go_dashboard')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Question Card ──────────────────────────────────────────────
  return (
    <div className="flex-1 bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase mb-3">
            {currentStage.subtitle}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{currentStage.title}</h1>
          <p className="text-slate-500">{currentStage.desc}</p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span>{t('assessment.overall_progress')} ({globalProgressCount} / {totalQuestions})</span>
            <span className="text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {ASSESSMENT_STAGES.map((s, idx) => (
              <div key={s.id} className={`text-xs font-bold ${idx <= stageIdx ? 'text-indigo-600' : 'text-slate-300'}`}>
                {s.subtitle}
              </div>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
          <div className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-5 self-start">
            {t('assessment.question')} {questionIdx + 1} {t('assessment.of')} {questionsList.length}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{q.text}</h2>
          <div className="text-slate-500 text-sm mb-8">
            {q.type === 'likert' && t('assessment.select_best')}
            {q.type === 'choice' && t('assessment.select_preferred')}
            {q.type === 'text' && t('assessment.elaborate')}
          </div>

          <div className="flex-1 space-y-3 mb-8">
            {q.type === 'likert' && LIKERT_OPTIONS.map(opt => {
              const isSelected = answers[q.id] === opt.val;
              return (
                <button key={opt.val} onClick={() => handleSelect(opt.val)}
                  className={`w-full flex items-center gap-4 py-4 px-5 rounded-xl border-2 text-left font-medium transition-all
                    ${isSelected ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  {opt.label}
                </button>
              );
            })}

            {q.type === 'choice' && q.options.map((opt, i) => {
              const isSelected = answers[q.id] === (i + 1);
              return (
                <button key={i} onClick={() => handleSelect(i + 1)}
                  className={`w-full flex items-center gap-4 py-4 px-5 rounded-xl border-2 text-left font-medium transition-all
                    ${isSelected ? 'border-purple-300 bg-purple-50 text-purple-800' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-purple-600' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                  </div>
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              );
            })}

            {q.type === 'text' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={handleTextChange}
                placeholder={t('assessment.text_placeholder')}
                rows={5}
                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none text-slate-700 resize-none"
              />
            )}
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-slate-100">
            <button onClick={handlePrev}
              disabled={stageIdx === 0 && questionIdx === 0}
              className={`flex items-center gap-1 font-semibold px-4 py-2 rounded-lg transition-colors ${
                (stageIdx === 0 && questionIdx === 0) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft size={20} /> {t('assessment.previous')}
            </button>

            <button onClick={handleNext} disabled={!answers[q.id]}
              className={`flex items-center gap-1 font-semibold px-6 py-2.5 rounded-lg text-white transition-all shadow-sm ${
                !answers[q.id]
                  ? 'bg-blue-300 cursor-not-allowed shadow-none'
                  : isLastQuestion
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {isLastQuestion ? t('assessment.finish_stage') : t('assessment.next')} <ChevronRight size={20} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Assessment;