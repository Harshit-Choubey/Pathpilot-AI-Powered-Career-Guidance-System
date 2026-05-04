import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.full_name && formData.email && formData.password) {
      if (formData.password.length < 8) {
        setError(t('signup.password_length', "Password must be at least 8 characters long."));
        return;
      }
      setError(null);
      setIsLoading(true);
      try {
        await register(formData);
        navigate('/assessment');
      } catch (err) {
        const resData = err.response?.data;
        if (resData?.details) {
          setError(resData.details.map(d => d.message).join(', '));
        } else if (Array.isArray(resData?.detail)) {
          setError(resData.detail.map(d => d.msg).join(', '));
        } else {
          setError(resData?.detail || resData?.error || resData?.message || t('signup.failed_create', "Failed to create account"));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass p-8 rounded-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">{t('signup.create_account', 'Create an account')}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {t('signup.already_have_account', 'Already have an account?')} {' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('signup.sign_in', 'Sign in')}
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('signup.full_name', 'Full Name')}</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder={t('signup.fullname_placeholder', 'Alex Doe')}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('signup.email', 'Email address')}</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder={t('signup.email_placeholder', 'alex@example.com')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('signup.password', 'Password')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow pr-12"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 border border-transparent rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors text-base font-medium disabled:opacity-70"
          >
            {isLoading ? t('signup.creating_account', 'Creating account...') : t('signup.sign_up', 'Sign up')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
