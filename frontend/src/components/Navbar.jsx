import { Link, useNavigate } from 'react-router-dom';
import { Compass, User, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  
  const isAuthenticated = !!token;
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const switchLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
              <Compass size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">
              PathPilot
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            
            {/* Language Switcher */}
            <div className="flex items-center gap-2 text-slate-500 bg-slate-100 rounded-full px-3 py-1 text-sm border border-slate-200">
              <Globe size={14} />
              <select 
                onChange={(e) => switchLanguage(e.target.value)} 
                value={i18n.language}
                className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Start Journey
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                  {t('dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
                >
                  <LogOut size={18} />
                  <span>{t('logout')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
