import { ArrowRight, BrainCircuit, Target, BarChart2, Scale, MessageSquare, BookOpen, Heart, Users, Sparkles, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-8 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              AI-Powered Career Guidance
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
              Find the career you were <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                born to do.
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Take our psychometric assessment and let our advanced machine learning engine
              predict your optimal career path, identify skill gaps, and guide your journey.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Take the Assessment <ArrowRight />
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-sm border border-slate-200"
              >
                View My Results
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose PathPilot Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose PathPilot?</h2>
            <p className="text-slate-500">Comprehensive AI-powered tools designed to help you make informed career decisions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <BrainCircuit size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">AI-Powered Analysis</h3>
              <p className="text-slate-600">Advanced psychometric assessments using RIASEC and Multiple Intelligence frameworks</p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Personalized Matches</h3>
              <p className="text-slate-600">Get career recommendations tailored to your unique personality, skills, and interests</p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Skill Gap Analysis</h3>
              <p className="text-slate-600">Identify the skills you need and get personalized course recommendations</p>
            </div>
            
            {/* Feature 4 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Scale size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Career Comparison</h3>
              <p className="text-slate-600">Compare different career paths side-by-side to make informed decisions</p>
            </div>
            
            {/* Feature 5 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">AI Chatbot Guide</h3>
              <p className="text-slate-600">24/7 conversational AI assistant to answer all your career-related questions</p>
            </div>
            
            {/* Feature 6 */}
            <div className="glass p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Learning Pathways</h3>
              <p className="text-slate-600">Structured learning paths with courses and resources for your chosen career</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Our Values</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Heart size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Student-Centric</h4>
              <p className="text-sm text-slate-500">Every decision we make prioritizes the success and well-being of students.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Users size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Inclusivity</h4>
              <p className="text-sm text-slate-500">Quality career guidance should be accessible to every student, everywhere.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Sparkles size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Innovation</h4>
              <p className="text-sm text-slate-500">Leveraging cutting edge AI technology to provide personalized guidance.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Award size={20} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Excellence</h4>
              <p className="text-sm text-slate-500">Committed to delivering the highest quality career counseling experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How PathPilot Works */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">How PathPilot Works</h2>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Complete Assessment</h4>
                  <p className="text-sm text-slate-500">Take our psychometric tests based on RIASEC and Multiple Intelligence.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">AI Analysis</h4>
                  <p className="text-sm text-slate-500">Our AI analyzes your responses to understand your strengths and interests.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Get Recommendations</h4>
                  <p className="text-sm text-slate-500">Receive personalized career matches with details about each path.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Plan Your Journey</h4>
                  <p className="text-sm text-slate-500">Explore skill gaps, learning paths, and growth opportunities.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Ongoing Support</h4>
                  <p className="text-sm text-slate-500">Access the chatbot anytime for guidance and progress tracking.</p>
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
