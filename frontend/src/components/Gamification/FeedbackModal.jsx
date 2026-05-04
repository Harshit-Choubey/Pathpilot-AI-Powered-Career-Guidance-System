import React, { useState } from 'react';
import { Smile, Meh, Frown, X } from 'lucide-react';
import { progressService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FeedbackModal = ({ task, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedXP, setEarnedXP] = useState(null);

  const handleSubmit = async (feedback) => {
    setIsSubmitting(true);
    try {
      const res = await progressService.submitFeedback({
        task_id: task.id,
        feedback: feedback,
        time_taken_minutes: task.estimated_minutes // placeholder
      });
      if (res?.data?.success) {
        setEarnedXP(res.data.xp_earned);
        setTimeout(() => {
          onSuccess(res.data);
          onClose();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
      onClose(); // fail gracefully
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
        {earnedXP ? (
          <div className="py-8 animate-bounce">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-3xl font-black text-indigo-600">+{earnedXP} XP</h3>
            <p className="text-slate-500 font-bold mt-2">Task Complete!</p>
          </div>
        ) : (
          <>
            <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t('dashboard.task_completed_title', 'Task Completed! 🎉')}</h3>
            <p className="text-slate-500 mb-6 font-medium">{t('dashboard.how_was_material', 'How did you find this material?')}</p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => handleSubmit('easy')}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-500 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smile size={24} />
                </div>
                <span className="font-bold text-sm text-emerald-700">{t('dashboard.easy', 'Easy')}</span>
              </button>
              
              <button 
                onClick={() => handleSubmit('medium')}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-amber-100 hover:bg-amber-50 hover:border-amber-500 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Meh size={24} />
                </div>
                <span className="font-bold text-sm text-amber-700">{t('dashboard.medium', 'Medium')}</span>
              </button>
              
              <button 
                onClick={() => handleSubmit('hard')}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-rose-100 hover:bg-rose-50 hover:border-rose-500 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Frown size={24} />
                </div>
                <span className="font-bold text-sm text-rose-700">{t('dashboard.hard', 'Hard')}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-6 font-bold uppercase tracking-wider">
              {t('dashboard.powers_adaptive_engine', 'Powers your adaptive engine')}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
