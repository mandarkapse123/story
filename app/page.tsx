"use client";
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import WorkspaceLayout from './components/WorkspaceLayout';
import { Project, UserProfile } from './types';
import { PenTool, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'storyforge_projects_v2';
const AUTH_KEY = 'storyforge_auth_v2';
const PROFILE_KEY = 'storyforge_profile_v2';

const DEFAULT_PROFILE: UserProfile = {
  name: "Alex Mercer",
  penName: "A. M. Crimson",
  email: "alex@storyforge.com",
  bio: "Creative writer exploring speculative sci-fi and tech-thrillers."
};

const DEFAULT_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'The Quantum Paradox',
    type: 'Book',
    updatedAt: '2 hours ago',
    wordGoal: 50000,
    dailyGoal: 1000,
    chapters: [
      { 
        id: 'chap-1', 
        title: 'The Awakening', 
        words: 2450, 
        content: `<h1>Chapter 1: The Awakening</h1>
<p>The stellar engine hummed with a low, rhythmic vibration. Elena adjusted the dials on her console, her eyes strained by the neon glare of the warp core sensors.</p>
<p>Suddenly, the proximity warning flashed red. A distress signal was piercing through the static of the empty sector, carrying a digital signature she hadn't seen in a decade.</p>
<p>"Vance," she muttered, tapping her com-link. "We have a problem."</p>` 
      },
      { 
        id: 'chap-2', 
        title: 'A Meeting in the Dark', 
        words: 1120, 
        content: `<h1>Chapter 2: A Meeting in the Dark</h1>
<p>Captain Vance was waiting in the galley, holding a mug of lukewarm synth-coffee. Jax sat opposite him, looking tense and keeping a hand close to his holster.</p>
<p>"She says it's an old signal," Vance said, his voice gravelly. "From the derelict sector. We're heading in."</p>` 
      },
      { 
        id: 'chap-3', 
        title: 'Echoes of the Past', 
        words: 890, 
        content: `<h1>Chapter 3: Echoes of the Past</h1>
<p>The derelict ship loomed outside the viewport, a silent monument to the war. Lyra checked the life support readings, her fingers flying across the auxiliary controls.</p>` 
      }
    ],
    characters: [
      { id: 'c-1', name: 'Elena', role: 'Protagonist', description: 'A brilliant but cynical starship engineer.', avatarColor: 'bg-emerald-500', bio: 'Born on the outer rim, Elena spent her childhood repairing junked skiffs. She trusts machines more than people.', archetype: 'The Specialist' },
      { id: 'c-2', name: 'Jax', role: 'Antagonist', description: 'Ruthless commander of the opposing fleet.', avatarColor: 'bg-rose-500', bio: 'A decorated veteran who believes the ends justify the means. Seeking the anomaly at all costs.', archetype: 'The Zealot' },
      { id: 'c-3', name: 'Captain Vance', role: 'Supporting', description: 'World-weary captain of the starship Wanderer.', avatarColor: 'bg-amber-500', bio: 'A former naval officer who went rogue to protect his crew. Has a soft spot for Elena.', archetype: 'The Veteran' }
    ],
    plotBeats: [
      { id: 'pb-1', title: 'The Distress Signal', type: 'Inciting Incident', description: 'Elena receives a strange transmission from the edge of the galaxy.' },
      { id: 'pb-2', title: 'Assembling the Crew', type: 'Act 1', description: 'They must find a pilot crazy enough to fly into the anomaly.' }
    ],
    researchNotes: [
      { id: 'r-1', topic: 'Warp Anomaly Theory', note: 'Based on Alcubierre metrics. Requires negative energy density. In-universe, the anomaly bends time and space.', source: 'Space Academy Database', date: '2026-06-25' },
      { id: 'r-2', topic: 'Derelict Ship Layout', note: 'Visual references: Gothic industrial arches, rusted hydraulic piping, and high-ceiling vaulted storage bays.', source: 'Salvager Logistics Log', date: '2026-06-28' }
    ]
  },
  {
    id: '2',
    title: 'Building SaaS in 2026',
    type: 'Article',
    updatedAt: '2 days ago',
    wordGoal: 2500,
    dailyGoal: 500,
    chapters: [
      { 
        id: 'chap-2-1', 
        title: 'Introduction', 
        words: 650, 
        content: `<h1>Building SaaS in 2026</h1>
<p>In 2026, building a software-as-a-service application is faster yet more competitive than ever. Developers are leveraging AI agents, serverless edge architectures, and real-time database syncing to build complex features in hours rather than months.</p>
<p>In this article, we outline the primary pillars of modern SaaS development and how to position your application for visual excellence and optimal performance.</p>` 
      }
    ],
    characters: [],
    plotBeats: [],
    researchNotes: []
  }
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

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
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveProjectId(null);
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
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Neon Background mesh */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
              <PenTool className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-205 to-violet-400 bg-clip-text text-transparent">StoryForge</h1>
            <p className="text-slate-400 text-xs mt-1.5 font-medium uppercase tracking-widest">Where masterpieces are forged</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Your Real Name</label>
              <input 
                type="text" 
                placeholder="e.g. Alex Mercer"
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
                placeholder="e.g. A. M. Crimson"
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
                placeholder="e.g. alex@storyforge.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                required
              />
            </div>

            {loginError && (
              <p className="text-[10px] font-bold text-rose-500 mt-1 select-none">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer mt-2 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} /> Enter Writer Studio
            </button>
          </form>

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