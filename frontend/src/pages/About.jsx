import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, BookOpen, Clock, Bot, GraduationCap, Award, 
  ClipboardCheck, Flame, Wallet, Users, CheckCircle, Moon, Sun, 
  ArrowUpRight, Code, ShieldCheck, Layers, Activity, ChevronRight,
  Lightbulb, Compass, Rocket, Server, Database, Globe, Lock, Cpu, Star, ArrowLeft
} from 'lucide-react';
import { logoutUser } from '../redux/slices/authSlice';
import { Footer } from '../components/Footer';

export const About = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Theme state
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isNavOpen, setIsNavOpen] = useState(false);

  // SEO Update
  useEffect(() => {
    document.title = "About | StudentSphere AI";
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Learn about StudentSphere AI, an AI-powered all-in-one platform that helps students manage academics, productivity, coding, careers, and personal growth.";
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

  // Scroll to section helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 text-slate-800 dark:text-slate-100 overflow-x-hidden font-sans">
      
      {/* 1. SaaS / Portal Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-650 dark:text-indigo-400" />
              <Link to="/" className="text-xl font-bold font-outfit text-slate-900 dark:text-white">
                StudentSphere AI
              </Link>
            </div>

            {/* Desktop Navbar Items */}
            <div className="hidden lg:flex items-center gap-6">
              {!isAuthenticated ? (
                <>
                  <button onClick={() => scrollToSection('features')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                    Features
                  </button>
                  <button onClick={() => scrollToSection('roadmap')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                    Roadmap
                  </button>
                  <button onClick={() => scrollToSection('tech-stack')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                    Technology
                  </button>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Portal Hub
                  </Link>
                </>
              )}

              {/* Theme Switcher */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all ml-2"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </button>

              {/* Action Buttons */}
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
                  <span className="text-xs font-bold px-3 py-1 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl uppercase tracking-wider">
                    Hi, {user?.fullName.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex justify-center items-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Nav Button */}
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

        {/* Mobile Dropdown Panel */}
        {isNavOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-4 space-y-3 shadow-xl">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => { setIsNavOpen(false); scrollToSection('features'); }}
                  className="block w-full text-left py-2 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Features
                </button>
                <button
                  onClick={() => { setIsNavOpen(false); scrollToSection('roadmap'); }}
                  className="block w-full text-left py-2 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Roadmap
                </button>
                <button
                  onClick={() => { setIsNavOpen(false); scrollToSection('tech-stack'); }}
                  className="block w-full text-left py-2 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Technology
                </button>
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 text-center py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl font-semibold text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="flex-1 text-center py-2.5 bg-indigo-650 text-white rounded-xl font-semibold text-sm">
                    Get Started
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="block py-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  Dashboard Hub
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 font-semibold text-rose-650"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden flex flex-col items-center">
        {/* Animated Background Gradients & Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-650/10 rounded-full blur-3xl animate-pulse -z-10"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-650/10 rounded-full blur-3xl animate-pulse delay-1000 -z-10"></div>
        <div className="absolute -top-12 left-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Academic Ecosystem</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold font-outfit text-slate-900 dark:text-white leading-tight"
          >
            About <span className="bg-gradient-to-r from-indigo-600 via-purple-650 to-pink-500 bg-clip-text text-transparent">StudentSphere AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl font-bold font-outfit text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Empowering Students Through AI, Productivity, and Smart Academic Management.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm sm:text-base text-slate-500 dark:text-slate-450 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            StudentSphere AI is an all-in-one platform built to simplify student life by combining academic management, productivity tools, career preparation, coding tracking, and AI-powered assistance into one unified ecosystem.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-4 flex justify-center gap-4"
          >
            <button
              onClick={() => scrollToSection('features')}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md hover:shadow-indigo-500/20"
            >
              Explore Features <ChevronRight className="h-4.5 w-4.5" />
            </button>
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-1.5 px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-all bg-white dark:bg-slate-950"
            >
              Get Started <ArrowUpRight className="h-4.5 w-4.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3. Mission & Vision */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex gap-5"
            >
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-2xl h-fit">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Our Mission</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  To help every student stay organized, improve productivity, prepare for exams, build careers, and achieve academic excellence using modern technology and artificial intelligence.
                </p>
              </div>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex gap-5"
            >
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 rounded-2xl h-fit">
                <Compass className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Our Vision</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  To become the world's most trusted digital companion for students by integrating education, AI, productivity, and career growth into one seamless experience.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Why StudentSphere AI? (Feature Cards) */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">Why StudentSphere AI?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-450 leading-normal font-medium">
            Discover a comprehensive ecosystem tailored to simplify, organize, and accelerate student success.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {featuresList.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between group h-64"
            >
              <div>
                <div className={`p-2.5 rounded-xl border w-fit ${feat.color}`}>
                  {feat.icon}
                </div>
                <h4 className="text-base font-bold font-outfit text-slate-900 dark:text-white mt-4">{feat.title}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed font-medium">{feat.desc}</p>
              </div>
              <div className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-0.5">
                <span>Active Module</span>
                <ChevronRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Core Values */}
      <section className="py-20 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">Core Values</h2>
            <p className="text-sm text-slate-500 dark:text-slate-450 leading-normal font-medium">
              The fundamental principles driving our development and user experience focus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValuesList.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm hover:scale-[1.01] transition-all text-center flex flex-col items-center"
              >
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-full mb-4">
                  {val.icon}
                </div>
                <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">{val.title}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed font-medium">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Technology Stack */}
      <section id="tech-stack" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">The MERN Stack & Beyond</h2>
          <p className="text-sm text-slate-500 dark:text-slate-450 leading-normal font-medium">
            StudentSphere AI runs on a premium modern software stack offering lightning-fast speeds and strict security.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {techList.map((tech, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center hover:-translate-y-1 hover:shadow-md transition-all border-b-4 border-b-indigo-500 dark:border-b-indigo-400"
            >
              <div className="text-indigo-650 dark:text-indigo-400 mb-3">
                {tech.icon}
              </div>
              <h4 className="text-sm font-extrabold font-outfit text-slate-900 dark:text-white">{tech.name}</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">{tech.category}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7. Why Choose StudentSphere AI? (Benefits list) */}
      <section className="py-20 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          
          <div className="lg:col-span-1 space-y-4">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Premium Choice</span>
            <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white leading-tight">Why Choose StudentSphere AI?</h2>
            <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
              We focus on building a cohesive, responsive experience that replaces 10 separate apps, keeping your database secure and accessible.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefitsList.map((ben, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl flex gap-3.5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg h-fit">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{ben.title}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-normal font-medium">{ben.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. Statistics Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          {/* subtle blur blobs inside */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            {statsList.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="space-y-2"
              >
                <h3 className="text-3xl sm:text-4xl font-extrabold font-outfit text-indigo-400">{stat.num}</h3>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">{stat.title}</p>
                <p className="text-[10px] text-indigo-300 font-medium">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Future Roadmap */}
      <section id="roadmap" className="py-20 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">Future Roadmap</h2>
            <p className="text-sm text-slate-500 dark:text-slate-450 leading-normal font-medium">
              Milestones and upcoming modules slated to enrich the StudentSphere AI portal.
            </p>
          </div>

          {/* Roadmap Vertical Timeline */}
          <div className="relative max-w-3xl mx-auto">
            {/* Center line */}
            <div className="absolute left-4 md:left-1/2 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800"></div>

            <div className="space-y-12">
              {roadmapList.map((road, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`flex flex-col md:flex-row relative items-start ${isEven ? 'md:flex-row-reverse' : ''}`}
                  >
                    {/* Timeline bullet */}
                    <div className="absolute left-4 md:left-1/2 w-6 h-6 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-indigo-600 dark:bg-indigo-400 transform -translate-x-3.5 z-10"></div>

                    {/* Timeline box */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{road.phase}</span>
                        <h4 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white mt-1">{road.title}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed font-medium">{road.desc}</p>
                      </div>
                    </div>

                    <div className="hidden md:block w-1/2"></div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 10. Testimonials */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">What Students Say</h2>
          <p className="text-sm text-slate-500 dark:text-slate-450 leading-normal font-medium">
            Read positive experiences from active student community members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsList.map((test, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm text-slate-650 dark:text-slate-350 italic font-medium leading-relaxed">
                  "{test.content}"
                </p>
              </div>
              <div className="flex items-center gap-3.5 mt-6 border-t border-slate-100 dark:border-slate-850 pt-4">
                <div className="h-10 w-10 rounded-full bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-indigo-650 dark:text-indigo-400">
                  {test.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{test.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{test.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 11. Call to Action */}
      <section className="py-20 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden text-center border-t border-slate-800">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-indigo-550/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 -z-10"></div>
        
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit">Ready to Transform Your Student Life?</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
            Create an account or login to access your smart planners, study assistant tools, community channels, and analytics.
          </p>
          <div className="pt-2">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-1.5 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-indigo-550/20"
            >
              Launch StudentSphere AI <ArrowUpRight className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <Footer />

    </div>
  );
};

// Static features dataset
const featuresList = [
  {
    title: "AI Study Assistant",
    desc: "AI study planner and summary generator tailored to your subjects.",
    icon: <Bot className="h-5 w-5 text-indigo-550" />,
    color: "bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-indigo-650"
  },
  {
    title: "Attendance Tracker",
    desc: "Evaluate recovery options and log attendance parameters.",
    icon: <BookOpen className="h-5 w-5 text-rose-500" />,
    color: "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-500"
  },
  {
    title: "Assignment Manager",
    desc: "Organize calendar deadlines, file attachments, and notes.",
    icon: <ClipboardCheck className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-550"
  },
  {
    title: "Exam Planner",
    desc: "Generates study plans and revision stages dynamically.",
    icon: <Calendar className="h-5 w-5 text-amber-500" />,
    color: "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-550"
  },
  {
    title: "Resume Builder",
    desc: "Build ATS-friendly resume drafts and get audits on keywords.",
    icon: <Award className="h-5 w-5 text-purple-500" />,
    color: "bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30 text-purple-550"
  },
  {
    title: "CGPA Calculator",
    desc: "Multi-semester GPA predictor and record evaluator.",
    icon: <GraduationCap className="h-5 w-5 text-sky-500" />,
    color: "bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/30 text-sky-550"
  },
  {
    title: "Coding Tracker",
    desc: "Track solved problems streak across multiple coding portals.",
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    color: "bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 text-orange-500"
  },
  {
    title: "Expense Tracker",
    desc: "Logs student expenses and categories with digital receipt uploads.",
    icon: <Wallet className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-500"
  },
  {
    title: "Student Community",
    desc: "Collaborative community forums and real-time audio channels.",
    icon: <Users className="h-5 w-5 text-indigo-500" />,
    color: "bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-indigo-500"
  },
  {
    title: "Notes Manager",
    desc: "Personal vault for categorizing and uploading resource documents.",
    icon: <Layers className="h-5 w-5 text-violet-500" />,
    color: "bg-violet-50 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30 text-violet-500"
  }
];

const coreValuesList = [
  {
    title: "Innovation",
    desc: "Using generative AI and cloud architectures to solve student problems.",
    icon: <Cpu className="h-5.5 w-5.5" />
  },
  {
    title: "Student First",
    desc: "Building a user interface tailored around student workflows and timelines.",
    icon: <Users className="h-5.5 w-5.5" />
  },
  {
    title: "Productivity",
    desc: "Focusing on pomodoros, calendar syncs, and streak multipliers.",
    icon: <Clock className="h-5.5 w-5.5" />
  },
  {
    title: "Continuous Learning",
    desc: "Upgrading resources, resume parameters, and tech stacks.",
    icon: <GraduationCap className="h-5.5 w-5.5" />
  }
];

const techList = [
  { name: "React.js", category: "Frontend", icon: <Globe className="h-8 w-8" /> },
  { name: "Node.js", category: "Runtime", icon: <Cpu className="h-8 w-8" /> },
  { name: "Express.js", category: "Web Server", icon: <Server className="h-8 w-8" /> },
  { name: "MongoDB", category: "Database", icon: <Database className="h-8 w-8" /> },
  { name: "Redux Toolkit", category: "State Management", icon: <Layers className="h-8 w-8" /> },
  { name: "Tailwind CSS", category: "Styling", icon: <Code className="h-8 w-8" /> },
  { name: "JWT Auth", category: "Security", icon: <Lock className="h-8 w-8" /> },
  { name: "Cloudinary", category: "Media Storage", icon: <Database className="h-8 w-8" /> },
  { name: "Render", category: "Backend Host", icon: <Server className="h-8 w-8" /> },
  { name: "Vercel", category: "Frontend Host", icon: <Globe className="h-8 w-8" /> }
];

const benefitsList = [
  { title: "Single Platform", desc: "Replaces Notion, Excel, LeetCode sheets, and group chats in one MERN web ecosystem." },
  { title: "AI Powered", desc: "Integrates OpenAI/Cloudinary resources for smart summaries and resume ATS analysis." },
  { title: "Modern UI", desc: "Beautiful dark mode, responsive dashboards, and micro-interactions." },
  { title: "Fast Performance", desc: "Optimized queries, Redux cached states, and lightweight bundles." },
  { title: "Secure Authentication", desc: "Passport authentication, Google OAuth, and secure JWT verification." },
  { title: "Cloud Ready", desc: "All files, attachments, and profile images securely stored on Cloudinary." },
  { title: "Responsive Design", desc: "Perfect scaling from small mobile displays up to 4K resolution screens." },
  { title: "Student Focused", desc: "Includes unique widgets like CGPA predictors, Pomodoro timers, and Streak trackers." }
];

const statsList = [
  { num: "17+", title: "Active Modules", desc: "From planners to builders" },
  { num: "100%", title: "Responsive", desc: "Mobile to 4K desktop scaling" },
  { num: "AI", title: "Integrated", desc: "Audits, summaries & study plans" },
  { num: "MERN", title: "Architecture", desc: "React, Express, Mongo, Node" },
  { num: "Real-Time", title: "Experience", desc: "Real-time forum discussions" }
];

const roadmapList = [
  { phase: "Phase 1 - AI Career Coach", title: "AI Career Counselor", desc: "Personal AI bot to guide students through career roadmaps and module tracking." },
  { phase: "Phase 2 - AI Mock Interview", title: "AI Mock Interviews", desc: "Voice-to-text live mock interviews with real-time feedback on technical questions." },
  { phase: "Phase 3 - AI Resume Analyzer", title: "AI Resume Analyzer", desc: "Compare your resume directly against specific Job Descriptions to calculate matching percentage." },
  { phase: "Phase 4 - Scholarship & Jobs", title: "Scholarship & Job Portal", desc: "Integrated scrapers finding matching global scholarships and SDE job postings." },
  { phase: "Phase 5 - Real-Time Chat", title: "Real-Time Direct Messaging", desc: "Interactive student-to-student private chat portal utilizing Socket.io." }
];

const testimonialsList = [
  {
    content: "StudentSphere AI completely transformed how I manage my studies. I went from juggling 5 apps to tracking everything in one visual portal.",
    name: "Aarav Mehta",
    role: "Computer Science Sophomore",
    avatar: "AM"
  },
  {
    content: "The Resume Builder and Exam Planner are amazing. The ATS audit highlighted keyword issues that helped me secure my software engineering internship.",
    name: "Sneha Patel",
    role: "Senior Engineering Student",
    avatar: "SP"
  },
  {
    content: "Everything I need exists in one platform. Tracking my coding streaks alongside my semester CGPA calculations is an absolute game-changer.",
    name: "Rohit Verma",
    role: "Information Technology Junior",
    avatar: "RV"
  }
];

export default About;
