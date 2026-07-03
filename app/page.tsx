"use client";
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import WorkspaceLayout from './components/WorkspaceLayout';
import { Project, UserProfile } from './types';
import { PenTool } from 'lucide-react';

const STORAGE_KEY = 'storyforge_projects_v2';
const AUTH_KEY = 'storyforge_auth_v2';
const PROFILE_KEY = 'storyforge_profile_v2';

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  penName: "",
  email: "",
  bio: ""
};

const DEFAULT_PROJECTS: Project[] = [];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

  // Login Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPenName, setLoginPenName] = useState("");
  const [loginError, setLoginError] = useState("");

  // Load from local storage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    const savedAuth = localStorage.getItem(AUTH_KEY);
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    const savedTheme = localStorage.getItem('storyforge_theme_v2');

    const activeTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    let initialProjects = DEFAULT_PROJECTS;
    if (savedProjects) {
      try {
        initialProjects = JSON.parse(savedProjects);
      } catch {
        // ignore
      }
    }

    let initialProfile = DEFAULT_PROFILE;
    if (savedProfile) {
      try {
        initialProfile = JSON.parse(savedProfile);
      } catch {
        // ignore
      }
    }

    let loggedInStatus = false;
    if (savedAuth) {
      loggedInStatus = savedAuth === 'true';
    }

    const timer = setTimeout(() => {
      setProjects(initialProjects);
      setProfile(initialProfile);
      setIsLoggedIn(loggedInStatus);
      setTheme(activeTheme);
      
      // Pre-populate login form with profile values
      setLoginName(initialProfile.name);
      setLoginPenName(initialProfile.penName);
      setLoginEmail(initialProfile.email);
      
      setIsLoaded(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('storyforge_theme_v2', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Save projects to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, isLoaded]);

  // Save profile and auth to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(AUTH_KEY, isLoggedIn ? 'true' : 'false');
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  }, [isLoggedIn, profile, isLoaded]);

  const handleUpdateProject = (updatedProj: Project) => {
    setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  const handleAddProject = (newProj: Project) => {
    setProjects([newProj, ...projects]);
  };

  const handleDeleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    const title = proj ? proj.title : "this project";
    if (!confirm(`Are you sure you want to delete the project "${title}"?`)) return;
    if (!confirm(`WARNING: All writing in "${title}" will be permanently erased. Are you 100% sure?`)) return;
    setProjects(projects.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim() || !loginPenName.trim() || !loginEmail.trim()) {
      setLoginError("Please fill out all profile fields to register/login.");
      return;
    }
    setLoginError("");
    setProfile({
      name: loginName.trim(),
      penName: loginPenName.trim(),
      email: loginEmail.trim(),
      bio: profile.bio || "Speculative fiction writer."
    });
    setIsSwitchingProfile(false);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveProjectId(null);
  };

  const handleSwitchProfile = () => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(DEFAULT_PROFILE);
    setLoginName("");
    setLoginPenName("");
    setLoginEmail("");
    setIsSwitchingProfile(true);
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide">Initializing StoryForge...</span>
        </div>
      </div>
    );
  }

  // SIMULATED LOGIN PAGE
  if (!isLoggedIn) {
    const hasExistingProfile = profile.name && profile.name.trim().length > 0;
    
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans select-none transition-colors duration-200">
        {/* Neon Background mesh */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
              <PenTool className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 to-violet-400 bg-clip-text text-transparent">StoryForge</h1>
            <p className="text-slate-400 text-xs mt-1.5 font-medium uppercase tracking-widest">Where masterpieces are forged</p>
          </div>

          {hasExistingProfile && !isSwitchingProfile ? (
            /* Welcome Back Card */
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold uppercase shadow-md shadow-indigo-550/20">
                  {profile.penName.substring(0, 2) || "W"}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-400">Welcome Back</h2>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">{profile.penName}</p>
                  <span className="text-[10px] text-slate-500 font-medium">{profile.email}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-550/10 cursor-pointer block text-center"
                >
                  Enter Writing Studio
                </button>
                <button
                  onClick={handleSwitchProfile}
                  className="w-full bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer block text-center"
                >
                  Sign in as another writer
                </button>
              </div>
            </div>
          ) : (
            /* Sign Up Registration Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Your Real Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Samuel Clemens"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Pen Name (Pseudonym)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mark Twain"
                  value={loginPenName}
                  onChange={(e) => setLoginPenName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. mark@twain.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                  required
                />
              </div>

              {loginError && (
                <p className="text-[10px] text-rose-500 font-semibold">{loginError}</p>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 pt-3 cursor-pointer"
              >
                Create Writer Profile
              </button>

              {hasExistingProfile && (
                <button
                  type="button"
                  onClick={() => setIsSwitchingProfile(false)}
                  className="w-full text-center text-[10px] font-semibold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer pt-2"
                >
                  Go Back
                </button>
              )}
            </form>
          )}

        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <Dashboard 
        projects={projects}
        onSelectProject={(project) => setActiveProjectId(project.id)}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <WorkspaceLayout 
      project={activeProject} 
      onUpdateProject={handleUpdateProject}
      onBackToDashboard={() => setActiveProjectId(null)}
      userProfile={profile}
      onUpdateUserProfile={setProfile}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    />
  );
}