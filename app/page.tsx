"use client";
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import WorkspaceLayout from './components/WorkspaceLayout';
import { Project, UserProfile } from './types';
import { PenTool, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  penName: "",
  email: "",
  bio: ""
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Login Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPenName, setLoginPenName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Load theme and session on mount
  useEffect(() => {
    // 1. Sync Theme from Local Storage
    const savedTheme = localStorage.getItem('storyforge_theme_v2');
    const activeTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const themeTimer = setTimeout(() => {
      setTheme(activeTheme);
    }, 0);

    const migrateLegacyProjects = async (userId: string) => {
      const savedProjects = localStorage.getItem('storyforge_projects_v2');
      if (!savedProjects) return;

      try {
        const legacyProjects: Project[] = JSON.parse(savedProjects);
        if (legacyProjects.length === 0) return;

        const confirmMigration = confirm(
          `Welcome to StoryForge Cloud!\n\n` +
          `We detected ${legacyProjects.length} legacy project(s) saved in this browser's local storage.\n\n` +
          `Would you like to import them to your new Supabase database account?`
        );

        if (!confirmMigration) return;

        for (const proj of legacyProjects) {
          await supabase.from('storyforge_projects').insert({
            user_id: userId,
            title: proj.title,
            type: proj.type,
            word_goal: proj.wordGoal,
            daily_goal: proj.dailyGoal,
            chapters: proj.chapters,
            characters: proj.characters,
            plot_beats: proj.plotBeats,
            research_notes: proj.researchNotes
          });
        }

        // Clean up legacy key
        localStorage.removeItem('storyforge_projects_v2');
        
        // Reload project list
        const { data: refreshed } = await supabase
          .from('storyforge_projects')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (refreshed) {
          const mappedProjects: Project[] = refreshed.map(p => ({
            id: p.id,
            title: p.title,
            type: p.type as 'Book' | 'Article',
            updatedAt: new Date(p.updated_at).toLocaleDateString(),
            wordGoal: p.word_goal,
            dailyGoal: p.daily_goal,
            chapters: p.chapters || [],
            characters: p.characters || [],
            plotBeats: p.plot_beats || [],
            researchNotes: p.research_notes || [],
            scratchpad: p.scratchpad || "",
            dumpster: p.dumpster || []
          }));
          setProjects(mappedProjects);
        }

        alert("Local projects migrated successfully to Supabase!");
      } catch (err) {
        console.error("Migration error", err);
      }
    };

    const loadProfileAndProjects = async (userObj: User) => {
      try {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('storyforge_profiles')
          .select('*')
          .eq('id', userObj.id)
          .single();

        if (profileData) {
          setProfile({
            name: profileData.name,
            penName: profileData.pen_name,
            email: profileData.email,
            bio: profileData.bio || ""
          });
        } else {
          // Create user profile row automatically for Google signups
          const tempName = userObj.user_metadata?.full_name || userObj.email?.split('@')[0] || "Author";
          const { error: profileErr } = await supabase
            .from('storyforge_profiles')
            .insert({
              id: userObj.id,
              name: tempName,
              pen_name: tempName,
              email: userObj.email || "",
              bio: "Speculative fiction writer."
            });

          if (!profileErr) {
            setProfile({
              name: tempName,
              penName: tempName,
              email: userObj.email || "",
              bio: "Speculative fiction writer."
            });
          } else {
            console.error("Failed to automatically create OAuth profile", profileErr);
            setProfile({
              name: tempName,
              penName: tempName,
              email: userObj.email || "",
              bio: "Speculative fiction writer."
            });
          }
        }

        // 2. Fetch Projects
        const { data: projectsData } = await supabase
          .from('storyforge_projects')
          .select('*')
          .eq('user_id', userObj.id)
          .order('updated_at', { ascending: false });

        if (projectsData) {
          const mappedProjects: Project[] = projectsData.map(p => ({
            id: p.id,
            title: p.title,
            type: p.type as 'Book' | 'Article',
            updatedAt: new Date(p.updated_at).toLocaleDateString(),
            wordGoal: p.word_goal,
            dailyGoal: p.daily_goal,
            chapters: p.chapters || [],
            characters: p.characters || [],
            plotBeats: p.plot_beats || [],
            researchNotes: p.research_notes || [],
            scratchpad: p.scratchpad || "",
            dumpster: p.dumpster || []
          }));
          setProjects(mappedProjects);
        }

        setIsLoggedIn(true);
        
        // 3. Check for legacy Local Storage migrations
        setTimeout(() => {
          migrateLegacyProjects(userObj.id);
        }, 500);

      } catch (err) {
        console.error("Error loading account details", err);
      } finally {
        setIsLoaded(true);
      }
    };

    // 2. Fetch session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        loadProfileAndProjects(session.user);
      } else {
        setIsLoaded(true);
      }
    });

    // 3. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentUser(session.user);
        loadProfileAndProjects(session.user);
      } else {
        setCurrentUser(null);
        setProfile(DEFAULT_PROFILE);
        setProjects([]);
        setIsLoggedIn(false);
        setIsLoaded(true);
      }
    });

    return () => {
      clearTimeout(themeTimer);
      subscription.unsubscribe();
    };
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

  const handleUpdateProject = async (updatedProj: Project) => {
    if (!currentUser) return;
    
    // Optimistic UI updates
    setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));

    const { error } = await supabase
      .from('storyforge_projects')
      .update({
        title: updatedProj.title,
        word_goal: updatedProj.wordGoal,
        daily_goal: updatedProj.dailyGoal,
        chapters: updatedProj.chapters,
        characters: updatedProj.characters,
        plot_beats: updatedProj.plotBeats,
        research_notes: updatedProj.researchNotes,
        scratchpad: updatedProj.scratchpad || "",
        dumpster: updatedProj.dumpster || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', updatedProj.id);

    if (error) {
      console.error("Error updating project in Supabase", error);
    }
  };

  const handleAddProject = async (newProj: Project) => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('storyforge_projects')
      .insert({
        user_id: currentUser.id,
        title: newProj.title,
        type: newProj.type,
        word_goal: newProj.wordGoal,
        daily_goal: newProj.dailyGoal,
        chapters: newProj.chapters,
        characters: newProj.characters,
        plot_beats: newProj.plotBeats,
        research_notes: newProj.researchNotes,
        scratchpad: "",
        dumpster: []
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project in Supabase", error);
      alert("Failed to save project. Ensure your database connection settings are correct.");
      return;
    }

    if (data) {
      const mappedProj: Project = {
        id: data.id,
        title: data.title,
        type: data.type as 'Book' | 'Article',
        updatedAt: 'Just now',
        wordGoal: data.word_goal,
        dailyGoal: data.daily_goal,
        chapters: data.chapters || [],
        characters: data.characters || [],
        plotBeats: data.plot_beats || [],
        researchNotes: data.research_notes || [],
        scratchpad: data.scratchpad || "",
        dumpster: data.dumpster || []
      };
      setProjects([mappedProj, ...projects]);
      setActiveProjectId(mappedProj.id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!currentUser) return;
    const proj = projects.find(p => p.id === id);
    const title = proj ? proj.title : "this project";
    if (!confirm(`Are you sure you want to delete the project "${title}"?`)) return;
    if (!confirm(`WARNING: All writing in "${title}" will be permanently erased from the cloud. Are you 100% sure?`)) return;

    setProjects(projects.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }

    const { error } = await supabase
      .from('storyforge_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting project in Supabase", error);
      alert("Failed to delete project from database.");
    }
  };

  const handleUpdateUserProfile = async (updatedProfile: UserProfile) => {
    if (!currentUser) return;
    setProfile(updatedProfile);

    const { error } = await supabase
      .from('storyforge_profiles')
      .update({
        name: updatedProfile.name,
        pen_name: updatedProfile.penName,
        bio: updatedProfile.bio || ""
      })
      .eq('id', currentUser.id);

    if (error) {
      console.error("Error updating profile in Supabase", error);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setLoginError(error.message);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword
    });

    if (error) {
      setLoginError(error.message);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword || !loginName.trim() || !loginPenName.trim()) {
      setLoginError("Please fill out all registration parameters.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: loginEmail.trim(),
      password: loginPassword
    });

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (data.user) {
      // Create user profile row
      const { error: profileErr } = await supabase
        .from('storyforge_profiles')
        .insert({
          id: data.user.id,
          name: loginName.trim(),
          pen_name: loginPenName.trim(),
          email: loginEmail.trim(),
          bio: "Speculative fiction writer."
        });

      if (profileErr) {
        setLoginError("Account created, but profile failed: " + profileErr.message);
      } else {
        alert("Writer account successfully registered!");
      }
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out", error);
    }
    setActiveProjectId(null);
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide">Connecting to StoryForge Cloud...</span>
        </div>
      </div>
    );
  }

  // SUPABASE LOGIN PAGE
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
        {/* Neon Background mesh */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
              <PenTool className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 to-violet-400 bg-clip-text text-transparent">StoryForge</h1>
            <p className="text-slate-400 text-xs mt-1.5 font-medium uppercase tracking-widest">Cloud manuscript studio</p>
          </div>

          <form onSubmit={isSignUpMode ? handleSignUpSubmit : handleLoginSubmit} className="space-y-4">
            
            {/* Google OAuth button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 1 12 1 7.37 1 3.4 3.75 1.58 7.74l3.87 3C6.38 7.76 9 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.68-5.02 3.68-8.64z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.45 14.76c-.25-.74-.39-1.53-.39-2.36s.14-1.62.39-2.36l-3.87-3C.83 8.52 0 10.18 0 12s.83 3.48 2.58 4.96l2.87-2.2z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.77-2.92c-1.1.74-2.52 1.18-4.19 1.18-3 0-5.62-2.72-6.55-5.7l-3.87 3C3.4 20.25 7.37 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            {isSignUpMode && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Real Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Samuel Clemens"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Pen Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mark Twain"
                    value={loginPenName}
                    onChange={(e) => setLoginPenName(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
              <input 
                type="email" 
                placeholder="writer@storyforge.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                required
              />
            </div>

            {loginError && (
              <p className="text-[10px] text-rose-500 font-semibold leading-normal">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 pt-3 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{isSignUpMode ? "Register Account" : "Sign In to Studio"}</span>
            </button>

            <button
              type="button"
              onClick={() => { setIsSignUpMode(!isSignUpMode); setLoginError(""); }}
              className="w-full text-center text-[10px] font-semibold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer pt-2"
            >
              {isSignUpMode ? "Already have an account? Log In" : "New to StoryForge? Create a Writer Account"}
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
        onUpdateProject={handleUpdateProject}
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
      onUpdateUserProfile={handleUpdateUserProfile}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    />
  );
}