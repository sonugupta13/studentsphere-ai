import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Github, Linkedin, Globe, Moon, Sun, ArrowLeft,
  Cpu, Code, Layers, Database, Star, Terminal, Mail, Briefcase, GraduationCap
} from 'lucide-react';
import { logoutUser } from '../redux/slices/authSlice';
import { Footer } from '../components/Footer';

export const AboutDeveloper = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isNavOpen, setIsNavOpen] = useState(false);

  // SEO Update
  useEffect(() => {
    document.title = "About Developer | StudentSphere AI";
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser()).then((res) => {
      if (!res.error) {
        navigate('/login');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 text-slate-800 dark:text-slate-100 overflow-x-hidden font-sans flex flex-col justify-between">
      
      <div>
        {/* Navbar */}
        <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-650 dark:text-indigo-400" />
                <Link to="/" className="text-xl font-bold font-outfit text-slate-900 dark:text-white">
                  StudentSphere AI
                </Link>
              </div>

              {/* Desktop Nav Items */}
              <div className="hidden lg:flex items-center gap-6">
                <Link to="/about" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                  About Project
                </Link>

                {/* Theme Switcher */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
                  aria-label="Toggle Dark Mode"
                >
                  {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
                </button>

                {/* Actions */}
                {!isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/login"
                      className="inline-flex justify-center items-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/dashboard"
                      className="inline-flex justify-center items-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="inline-flex justify-center items-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Nav Trigger */}
              <div className="flex lg:hidden items-center gap-2">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
                >
                  {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
                </button>
                <button
                  onClick={() => setIsNavOpen(!isNavOpen)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all font-bold"
                >
                  {isNavOpen ? '✕' : '☰'}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Panel */}
          {isNavOpen && (
            <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-4 space-y-3 shadow-xl">
              <Link to="/about" onClick={() => setIsNavOpen(false)} className="block py-2 font-semibold text-slate-700 dark:text-slate-300">
                About Project
              </Link>
              {!isAuthenticated ? (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 text-center py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl font-semibold text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="flex-1 text-center py-2.5 bg-indigo-650 text-white rounded-xl font-semibold text-sm">
                    Get Started
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/dashboard" className="flex-1 text-center py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl font-semibold text-sm">
                    Dashboard Hub
                  </Link>
                  <button onClick={handleLogout} className="flex-1 text-center py-2.5 text-rose-600 font-semibold text-sm">
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Developer Profile Section */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
          <div className="absolute top-1/4 left-1/2 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-650/5 rounded-full blur-3xl transform -translate-x-1/2 -z-10 animate-pulse"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl backdrop-blur-md"
          >
            
            {/* Header / Avatar */}
            <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div className="relative">
                <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center text-white text-3xl md:text-4xl font-extrabold font-outfit shadow-lg relative z-10 border-4 border-white dark:border-slate-900">
                  SG
                </div>
                <div className="absolute inset-0 bg-indigo-400 dark:bg-indigo-500 rounded-full blur-md opacity-40 animate-pulse"></div>
              </div>

              <div className="text-center md:text-left space-y-2.5 flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold font-outfit text-slate-900 dark:text-white">
                  Er. Sonu Gupta
                </h1>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Full Stack MERN Developer</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Designing scalable database models and premium, responsive user interfaces.
                </p>
              </div>
            </div>

            {/* Content / Professional Bio */}
            <div className="py-8 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-indigo-500" /> Professional Bio
                </h3>
                <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
                  Er. Sonu Gupta is a passionate Full Stack Developer specializing in the MERN (MongoDB, Express, React, Node.js) ecosystem. He focuses on building user-centric, high-performance web applications that bridge complex database structures with clean, modern frontends. Known for clean architectures and premium SaaS aesthetics, he crafted StudentSphere AI to help students stay organized and productive.
                </p>
              </div>

              {/* Tech Stack badging */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Code className="h-4 w-4 text-indigo-500" /> Core Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {techStack.map((tech, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-350 hover:border-indigo-400 dark:hover:border-indigo-550 transition-colors flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Buttons Block */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
                Connect with Developer
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="https://github.com/sonugupta13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-center items-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-300"
                >
                  <Github className="h-4.5 w-4.5" />
                  <span>Visit GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/sonu-gupta03"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-center items-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-300"
                >
                  <Linkedin className="h-4.5 w-4.5 animate-pulse" />
                  <span>Visit LinkedIn</span>
                </a>
                <a
                  href="https://studentsphere-ai.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-center items-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-indigo-500/10"
                >
                  <Globe className="h-4.5 w-4.5" />
                  <span>Visit Website</span>
                </a>
              </div>
            </div>

          </motion.div>
        </main>
      </div>

      <Footer />

    </div>
  );
};

const techStack = [
  "MongoDB", "Express.js", "React.js", "Node.js", 
  "Redux Toolkit", "Tailwind CSS", "JavaScript", 
  "Git & GitHub", "REST APIs", "JWT Auth", "Cloudinary"
];

export default AboutDeveloper;
