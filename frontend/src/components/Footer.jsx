import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Github, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md mt-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">StudentSphere AI</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Empowering students through AI-driven productivity, smart academic planners, career builders, and a cohesive collaborative community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li>
                <Link to="/dashboard" className="text-slate-600 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-600 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <a href="https://github.com/sonugupta13" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                  About Developer
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Connect</h4>
            <div className="flex gap-4 mb-4">
              <a href="https://github.com/sonugupta13/studentsphere-ai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-650 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors" aria-label="GitHub Repository">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-650 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:support@studentsphere.ai" className="text-slate-400 hover:text-indigo-650 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors" aria-label="Email Support">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <ul className="space-y-2 text-xs text-slate-550 dark:text-slate-400 font-medium">
              <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:underline">Terms</Link></li>
              <li><a href="mailto:support@studentsphere.ai" className="hover:underline">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-450 font-medium">
          <p>© 2026 StudentSphere AI. All Rights Reserved.</p>
          <p className="flex items-center gap-1 font-semibold text-slate-400">
            Made for Students, by Students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
