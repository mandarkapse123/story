"use client";
import React, { useState } from 'react';
import { 
  Plus, BookOpen, FileText, Award, Sparkles, Trash2, 
  Sun, Moon, X, Target, PenTool
} from 'lucide-react';
import { Project } from '../types';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onAddProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject?: (project: Project) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Dashboard({ 
  projects, 
  onSelectProject, 
  onAddProject, 
  onDeleteProject,
  onUpdateProject,
  theme,
  onToggleTheme
}: DashboardProps) {
  // Modal states for creating project
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<'Book' | 'Article'>('Book');
  const [newWordGoal, setNewWordGoal] = useState<number>(50000);
  const [newDailyGoal, setNewDailyGoal] = useState<number>(1000);

  // Rename states
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingProjectId, setRenamingProjectId] = useState("");
  const [renamingProjectTitle, setRenamingProjectTitle] = useState("");

  const handleRenameClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingProjectId(project.id);
    setRenamingProjectTitle(project.title);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingProjectTitle.trim()) return;

    const proj = projects.find(p => p.id === renamingProjectId);
    if (proj && onUpdateProject) {
      onUpdateProject({
        ...proj,
        title: renamingProjectTitle.trim()
      });
    }
    setIsRenameModalOpen(false);
    setRenamingProjectId("");
    setRenamingProjectTitle("");
  };

  const handleTypeChange = (type: 'Book' | 'Article') => {
    setNewType(type);
    if (type === 'Book') {
      setNewWordGoal(50000);
      setNewDailyGoal(1000);
    } else {
      setNewWordGoal(2500);
      setNewDailyGoal(500);
    }
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProj: Project = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      type: newType,
      updatedAt: 'Just now',
      wordGoal: newWordGoal,
      dailyGoal: newDailyGoal,
      chapters: [
        { 
          id: `chap-${Date.now()}-1`, 
          title: 'Introduction', 
          words: 0, 
          content: '<h1>Introduction</h1><p>Start writing your masterpiece here...</p>' 
        }
      ],
      characters: [],
      plotBeats: [],
      researchNotes: []
    };
    
    onAddProject(newProj);
    setIsCreateModalOpen(false);
    setNewTitle("");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteProject(id);
  };

  // Stats summaries
  const totalAllWords = projects.reduce((total, p) => {
    return total + p.chapters.reduce((sum, c) => sum + (c.words || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-14 px-6 select-none font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        
        {/* Studio Welcome & Stats Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-750 to-violet-750 rounded-3xl p-8 mb-10 text-white shadow-xl shadow-indigo-100 dark:shadow-none border border-indigo-500/20">
          <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pointer-events-none pr-10">
            <BookOpen size={220} />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/40 text-indigo-200 border border-indigo-450/20 px-3 py-1 rounded-full">
              Writing Studio v1.2
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-white">Welcome back, Author</h1>
            <p className="text-indigo-100/90 text-sm mt-1.5 leading-relaxed font-medium">
              Create a new literary project or open an existing draft. Your characters, manuscripts, outlines, and notes are synced dynamically.
            </p>
            
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
                <span>Total Words: <strong className="text-white font-extrabold">{totalAllWords.toLocaleString()}</strong> written</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-200" />
                <span>Active Drafts: <strong className="text-white font-extrabold">{projects.length}</strong> project{projects.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-indigo-200" />
                <span>Streak: <strong className="text-white font-extrabold">🔥 5 days</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Projects</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select a draft to write or configure details.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={onToggleTheme}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-900"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
            >
              <Plus size={14} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Project Cards Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50 p-6 text-center shadow-xs">
            <BookOpen size={36} className="text-slate-400 mb-2 animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350">No manuscripts created yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">Get started by creating your first speculative fiction Book or Article drafts above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-800 transition-all duration-200 cursor-pointer flex flex-col justify-between group h-48 relative overflow-hidden shadow-xs"
              >
                {/* Hover Left Stripe Accent */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${
                      project.type === 'Book' 
                        ? 'bg-indigo-50/10 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100/30 dark:border-indigo-900/30' 
                        : 'bg-purple-50/10 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-100/30 dark:border-purple-900/30'
                    }`}>
                      {project.type}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleRenameClick(project, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-all"
                        title="Rename Project Draft"
                      >
                        <PenTool size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-all"
                        title="Delete Project Draft"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                    {project.title}
                  </h3>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-800/60 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span>{(project.chapters || []).length} chapter{(project.chapters || []).length !== 1 ? 's' : ''}</span>
                  <span>{project.chapters.reduce((sum, c) => sum + (c.words || 0), 0).toLocaleString()} words</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmitProject}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Create New Project</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Project Manuscript Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chronicles of the Warp Drive"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Project Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Book')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      newType === 'Book'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    📖 Book / Novel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Article')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      newType === 'Article'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    📰 Article / Essay
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Target Word Count</label>
                  <input 
                    type="number"
                    value={newWordGoal}
                    onChange={(e) => setNewWordGoal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Daily Goal (Words)</label>
                  <input 
                    type="number"
                    value={newDailyGoal}
                    onChange={(e) => setNewDailyGoal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-all hover:bg-slate-250 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENAME PROJECT MODAL */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRenameSubmit} className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <PenTool size={16} className="text-indigo-500" />
                <span>Rename Draft</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-1 mb-5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">New Title</label>
              <input 
                type="text" 
                value={renamingProjectTitle}
                onChange={(e) => setRenamingProjectTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 cursor-pointer rounded-xl font-bold text-xs py-2"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}