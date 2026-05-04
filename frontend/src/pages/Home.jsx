import { ArrowRight, BrainCircuit, Target, BarChart2, Scale, MessageSquare, BookOpen, Heart, Users, Sparkles, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-8 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {t('home.badge')}
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
              {t('home.hero_title')} <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {t('home.hero_highlight')}
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              {t('home.hero_sub')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                {t('home.cta_assessment')} <ArrowRight />
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-sm border border-slate-200"
              >
                {t('home.cta_results')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose PathPilot Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('home.why_title')}</h2>
            <p className="text-slate-500">{t('home.why_sub')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <BrainCircuit size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('home.feature1_title')}</h3>
              <p className="text-slate-600">{t('home.feature1_desc')}</p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('home.feature2_title')}</h3>
              <p className="text-slate-600">{t('home.feature2_desc')}</p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('home.feature3_title')}</h3>
              <p className="text-slate-600">{t('home.feature3_desc')}</p>
            </div>
            
            {/* Feature 4 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Scale size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('home.feature4_title', 'Career Comparison')}</h3>
              <p className="text-slate-600">{t('home.feature4_desc', 'Compare different career paths side-by-side to make informed decisions')}</p>
            </div>
            
            {/* Feature 5 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('home.feature5_title', 'AI Chatbot Guide')}</h3>
              <p className="text-slate-600">{t('home.feature5_desc', '24/7 conversational AI assistant to answer all your career-related questions')}</p>
            </div>
            
            {/* Feature 6 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('home.feature6_title', 'Learning Pathways')}</h3>
              <p className="text-slate-600">{t('home.feature6_desc', 'Structured learning paths with courses and resources for your chosen career')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">{t('home.values_title', 'Our Values')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Heart size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{t('home.value_student_centric', 'Student-Centric')}</h4>
              <p className="text-sm text-slate-500">{t('home.value_student_centric_desc', 'Every decision we make prioritizes the success and well-being of students.')}</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Users size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{t('home.value_inclusivity', 'Inclusivity')}</h4>
              <p className="text-sm text-slate-500">{t('home.value_inclusivity_desc', 'Quality career guidance should be accessible to every student, everywhere.')}</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Sparkles size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{t('home.value_innovation', 'Innovation')}</h4>
              <p className="text-sm text-slate-500">{t('home.value_innovation_desc', 'Leveraging cutting edge AI technology to provide personalized guidance.')}</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Award size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{t('home.value_excellence', 'Excellence')}</h4>
              <p className="text-sm text-slate-500">{t('home.value_excellence_desc', 'Committed to delivering the highest quality career counseling experience.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How PathPilot Works */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">{t('home.how_it_works_title', 'How PathPilot Works')}</h2>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{t('home.step1_title', 'Complete Assessment')}</h4>
                  <p className="text-sm text-slate-500">{t('home.step1_desc', 'Take our psychometric tests based on RIASEC and Multiple Intelligence.')}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{t('home.step2_title', 'AI Analysis')}</h4>
                  <p className="text-sm text-slate-500">{t('home.step2_desc', 'Our AI analyzes your responses to understand your strengths and interests.')}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{t('home.step3_title', 'Get Recommendations')}</h4>
                  <p className="text-sm text-slate-500">{t('home.step3_desc', 'Receive personalized career matches with details about each path.')}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{t('home.step4_title', 'Plan Your Journey')}</h4>
                  <p className="text-sm text-slate-500">{t('home.step4_desc', 'Explore skill gaps, learning paths, and growth opportunities.')}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{t('home.step5_title', 'Ongoing Support')}</h4>
                  <p className="text-sm text-slate-500">{t('home.step5_desc', 'Access the chatbot anytime for guidance and progress tracking.')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
