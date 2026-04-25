import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Results from './pages/Results';
import Compare from './pages/Compare';
import Chatbot from './pages/Chatbot';
import SkillGap from './pages/SkillGap';
import { useAuth } from './context/AuthContext';

// Protects routes — waits for auth to initialise, then guards if not authenticated
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  // While validating stored token, show a loading screen (not login redirect)
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
        <Route path="chat" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="skill-gap" element={<ProtectedRoute><SkillGap /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
