"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, LayoutDashboard, Users, Map, Target, FlaskConical, Lightbulb, 
  ChevronRight, Home, Menu, ChevronLeft, Sparkles, 
  Trash2, Plus, Calendar, Award, LogOut, Settings, User, X, Globe, Sun, Moon, PenTool,
  Clipboard
} from 'lucide-react';
import { DragDropOrganizer } from './DragDropOrganizer';
import RichTextEditor from './RichTextEditor';
import CharactersView from './CharactersView';
import OutlineView from './OutlineView';
import { Project, UserProfile, ResearchNote, Chapter, Character, PlotBeat, DumpsterItem } from '../types';

interface ExtendedWindow extends Window {
  pdfjsLib?: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    getDocument: (args: { data: ArrayBuffer }) => {
      promise: Promise<{
        numPages: number;
        getPage: (num: number) => Promise<{
          getTextContent: () => Promise<{
            items: Array<{ str: string }>;
          }>;
        }>;
      }>;
    };
  };
}

function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

interface WorkspaceProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onBackToDashboard: () => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function WorkspaceLayout({ 
  project, 
  onUpdateProject, 
  onBackToDashboard, 
  userProfile, 
  onUpdateUserProfile, 
  onLogout,
  theme,
  onToggleTheme
}: WorkspaceProps) {
  const [currentView, setCurrentView] = useState('write');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState('');

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(project.title);

  // Scratchpad state
  const [scratchpadText, setScratchpadText] = useState(project.scratchpad || "");
  const scratchpadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep state synced when switching projects
  useEffect(() => {
    const timer = setTimeout(() => {
      setScratchpadText(project.scratchpad || "");
      setEditedTitle(project.title);
    }, 0);
    return () => clearTimeout(timer);
  }, [project.id, project.scratchpad, project.title]);

  const saveProjectTitle = () => {
    if (editedTitle.trim() && editedTitle.trim() !== project.title) {
      onUpdateProject({
        ...project,
        title: editedTitle.trim()
      });
    }
    setIsEditingTitle(false);
  };

  const debouncedSaveScratchpad = (text: string) => {
    if (scratchpadTimeoutRef.current) {
      clearTimeout(scratchpadTimeoutRef.current);
    }
    scratchpadTimeoutRef.current = setTimeout(() => {
      onUpdateProject({
        ...project,
        scratchpad: text
      });
    }, 800);
  };
  
  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profilePenName, setProfilePenName] = useState(userProfile.penName);
  const [profileEmail, setProfileEmail] = useState(userProfile.email);
  const [profileBio, setProfileBio] = useState(userProfile.bio || "");

  // Mobile Options Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ideas Tab State
  const [ideas, setIdeas] = useState<Array<{ id: string; text: string; color: string }>>([
    { id: '1', text: 'What if Jax is actually Elena\'s half-brother? Connect this to the warp core accident flashback.', color: 'bg-amber-500' },
    { id: '2', text: 'Elena\'s tool belt should have a customized sonic wrench with a cracked amber crystal.', color: 'bg-indigo-500' },
  ]);
  const [newIdeaText, setNewIdeaText] = useState("");

  // Research note form states
  const [newResearchTopic, setNewResearchTopic] = useState("");
  const [newResearchSource, setNewResearchSource] = useState("");
  const [newResearchDate, setNewResearchDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newResearchText, setNewResearchText] = useState("");

  const currentActiveChapterId = project.chapters.some(c => c.id === activeChapterId)
    ? activeChapterId
    : (project.chapters[0]?.id || '');

  // Sidebar Menu split: Primary tools on top, Stats/Goals on bottom
  const primaryMenuItems = [
    { id: 'write', icon: Book, label: 'Write' },
    { id: 'organize', icon: LayoutDashboard, label: 'Organizer' },
    { id: 'characters', icon: Users, label: 'Characters' },
    { id: 'outline', icon: Map, label: 'Outline' },
    { id: 'scratchpad', icon: Clipboard, label: 'Scratchpad' },
    { id: 'research', icon: FlaskConical, label: 'Research Notes' },
    { id: 'ideas', icon: Lightbulb, label: 'Brainstorm' },
    { id: 'dumpster', icon: Trash2, label: 'Dumpster' },
  ];

  const bottomMenuItems = [
    { id: 'goals', icon: Target, label: 'Goals & Stats' }
  ];

  // Dumpster state and helpers
  const [isCreatingRejectedIdea, setIsCreatingRejectedIdea] = useState(false);
  const [rejectedTitle, setRejectedTitle] = useState("");
  const [rejectedContent, setRejectedContent] = useState("");

  const handleSaveRejectedIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectedTitle.trim() || !rejectedContent.trim()) return;

    const newItem = {
      id: generateUniqueId('dump'),
      title: rejectedTitle.trim(),
      content: rejectedContent.trim(),
      type: "Idea",
      date: new Date().toLocaleDateString()
    };

    onUpdateProject({
      ...project,
      dumpster: [...(project.dumpster || []), newItem]
    });

    setRejectedTitle("");
    setRejectedContent("");
    setIsCreatingRejectedIdea(false);
  };

  const restoreDumpsterItem = (item: DumpsterItem) => {
    if (!confirm(`Are you sure you want to restore "${item.title}"?`)) return;

    const filteredDumpster = (project.dumpster || []).filter(d => d.id !== item.id);

    if (item.type === "Chapter") {
      const restoredChapter: Chapter = {
        id: generateUniqueId('chap'),
        title: item.title,
        words: item.content.split(/\s+/).filter(Boolean).length || 0,
        content: item.content
      };
      onUpdateProject({
        ...project,
        chapters: [...project.chapters, restoredChapter],
        dumpster: filteredDumpster
      });
      alert(`Restored "${item.title}" as a new chapter!`);
    } else if (item.type === "Character") {
      const descMatch = item.content.match(/Description:\s*(.*?)\n/);
      const bioMatch = item.content.match(/Bio:\s*(.*)/);
      const restoredChar: Character = {
        id: generateUniqueId('char'),
        name: item.title,
        role: "Supporting",
        description: descMatch ? descMatch[1] : "",
        avatarColor: "bg-teal-500",
        bio: bioMatch ? bioMatch[1] : ""
      };
      onUpdateProject({
        ...project,
        characters: [...project.characters, restoredChar],
        dumpster: filteredDumpster
      });
      alert(`Restored "${item.title}" to your Characters cast!`);
    } else if (item.type === "Plot Beat") {
      const descMatch = item.content.match(/Description:\s*(.*)/);
      const typeMatch = item.content.match(/Type:\s*(.*?)\n/);
      const restoredBeat: PlotBeat = {
        id: generateUniqueId('beat'),
        title: item.title,
        type: typeMatch ? typeMatch[1] : "Act 1",
        description: descMatch ? descMatch[1] : item.content
      };
      onUpdateProject({
        ...project,
        plotBeats: [...project.plotBeats, restoredBeat],
        dumpster: filteredDumpster
      });
      alert(`Restored "${item.title}" to your Outline beats!`);
    } else {
      const restoredNote: ResearchNote = {
        id: generateUniqueId('note'),
        topic: item.title,
        note: item.content,
        source: "Restored from Dumpster",
        date: new Date().toLocaleDateString()
      };
      onUpdateProject({
        ...project,
        researchNotes: [...project.researchNotes, restoredNote],
        dumpster: filteredDumpster
      });
      alert(`Restored "${item.title}" as a new Research Note!`);
    }
  };

  const permanentlyDeleteDumpsterItem = (itemId: string) => {
    if (!confirm("Are you sure you want to permanently erase this item?")) return;
    if (!confirm("WARNING: This cannot be undone. Erase forever?")) return;

    onUpdateProject({
      ...project,
      dumpster: (project.dumpster || []).filter(d => d.id !== itemId)
    });
  };

  // Callback to update chapter content in project state
  const handleUpdateChapterContent = (chapterId: string, content: string, wordCount: number) => {
    const updatedChapters = project.chapters.map(c => 
      c.id === chapterId ? { ...c, content, words: wordCount } : c
    );
    onUpdateProject({
      ...project,
      chapters: updatedChapters
    });
  };

  const handleWriteChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setCurrentView('write');
  };

  const totalWords = project.chapters.reduce((sum, c) => sum + (c.words || 0), 0);

  // Add Brainstorm Idea
  const addIdea = () => {
    if (!newIdeaText.trim()) return;
    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setIdeas([{ id: Date.now().toString(), text: newIdeaText.trim(), color: randomColor }, ...ideas]);
    setNewIdeaText("");
  };

  const deleteIdea = (id: string) => {
    const idea = ideas.find(i => i.id === id);
    const textSnippet = idea ? idea.text.substring(0, 30) + "..." : "this idea";
    if (!confirm(`Are you sure you want to delete the brainstorm sketch: "${textSnippet}"?`)) return;
    if (!confirm(`WARNING: This brainstorm sketch will be lost. Are you absolutely sure?`)) return;
    setIdeas(ideas.filter(idea => idea.id !== id));
  };

  // Add Research Note (Central state!)
  const addResearchNote = () => {
    if (!newResearchTopic.trim() || !newResearchText.trim()) return;
    
    const newNoteObj: ResearchNote = {
      id: generateUniqueId('res'),
      topic: newResearchTopic.trim(),
      note: newResearchText.trim(),
      source: newResearchSource.trim() || "Unspecified Source",
      date: newResearchDate
    };

    onUpdateProject({
      ...project,
      researchNotes: [newNoteObj, ...(project.researchNotes || [])]
    });

    setNewResearchTopic("");
    setNewResearchSource("");
    setNewResearchText("");
  };

  const deleteResearchNote = (id: string) => {
    const note = (project.researchNotes || []).find(n => n.id === id);
    const topic = note ? note.topic : "this research note";
    if (!confirm(`Are you sure you want to delete the research note "${topic}"?`)) return;
    if (!confirm(`Confirming deletion of "${topic}". This action is permanent. Are you sure?`)) return;
    
    // Add to dumpster before deletion
    const updatedDumpster = [
      ...(project.dumpster || []),
      {
        id: generateUniqueId('dump'),
        title: note?.topic || "Deleted Research Note",
        content: `Source: ${note?.source || ""}\nNote: ${note?.note || ""}`,
        type: "Research Note",
        date: new Date().toLocaleDateString()
      }
    ];

    onUpdateProject({
      ...project,
      researchNotes: (project.researchNotes || []).filter(n => n.id !== id),
      dumpster: updatedDumpster
    });
  };

  // Research Edit states and helpers
  const [isEditingResearch, setIsEditingResearch] = useState(false);
  const [editingResearchId, setEditingResearchId] = useState("");
  const [editingResearchTopic, setEditingResearchTopic] = useState("");
  const [editingResearchSource, setEditingResearchSource] = useState("");
  const [editingResearchNote, setEditingResearchNote] = useState("");

  const handleStartEditResearch = (note: ResearchNote) => {
    setEditingResearchId(note.id);
    setEditingResearchTopic(note.topic);
    setEditingResearchSource(note.source);
    setEditingResearchNote(note.note);
    setIsEditingResearch(true);
  };

  const handleSaveEditResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResearchTopic.trim() || !editingResearchNote.trim()) return;

    const updatedNotes = project.researchNotes.map(n => 
      n.id === editingResearchId 
        ? { 
            ...n, 
            topic: editingResearchTopic.trim(), 
            source: editingResearchSource.trim() || "Web",
            note: editingResearchNote.trim() 
          } 
        : n
    );

    onUpdateProject({
      ...project,
      researchNotes: updatedNotes
    });

    setIsEditingResearch(false);
    setEditingResearchId("");
    setEditingResearchTopic("");
    setEditingResearchSource("");
    setEditingResearchNote("");
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string) as Partial<Project>;
          
          const mergedChapters = [...project.chapters];
          if (Array.isArray(importedData.chapters)) {
            importedData.chapters.forEach((importChap: Chapter) => {
              const existsIdx = mergedChapters.findIndex(c => c.id === importChap.id || c.title.toLowerCase() === importChap.title.toLowerCase());
              if (existsIdx > -1) {
                mergedChapters[existsIdx] = {
                  ...mergedChapters[existsIdx],
                  content: importChap.content || mergedChapters[existsIdx].content,
                  words: importChap.words || mergedChapters[existsIdx].words
                };
              } else {
                mergedChapters.push({
                  id: importChap.id || `chap-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  title: importChap.title || "Untitled Imported Chapter",
                  words: importChap.words || 0,
                  content: importChap.content || "<p></p>"
                });
              }
            });
          }

          const mergedCharacters = [...project.characters];
          if (Array.isArray(importedData.characters)) {
            importedData.characters.forEach((importChar: Character) => {
              const existsIdx = mergedCharacters.findIndex(c => c.id === importChar.id || c.name.toLowerCase() === importChar.name.toLowerCase());
              if (existsIdx > -1) {
                mergedCharacters[existsIdx] = { ...mergedCharacters[existsIdx], ...importChar };
              } else {
                mergedCharacters.push({
                  id: importChar.id || `char-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  name: importChar.name || "Unknown Character",
                  role: importChar.role || "Supporting",
                  description: importChar.description || "",
                  avatarColor: importChar.avatarColor || "bg-indigo-500",
                  bio: importChar.bio || "",
                  archetype: importChar.archetype || ""
                });
              }
            });
          }

          const mergedBeats = [...project.plotBeats];
          if (Array.isArray(importedData.plotBeats)) {
            importedData.plotBeats.forEach((importBeat: PlotBeat) => {
              const existsIdx = mergedBeats.findIndex(b => b.id === importBeat.id || b.title.toLowerCase() === importBeat.title.toLowerCase());
              if (existsIdx > -1) {
                mergedBeats[existsIdx] = { ...mergedBeats[existsIdx], ...importBeat };
              } else {
                mergedBeats.push({
                  id: importBeat.id || `beat-import-${Date.now()}`,
                  title: importBeat.title || "Untitled Beat",
                  type: importBeat.type || "Scene",
                  description: importBeat.description || ""
                });
              }
            });
          }

          const mergedResearch = [...(project.researchNotes || [])];
          if (Array.isArray(importedData.researchNotes)) {
            importedData.researchNotes.forEach((importRes: ResearchNote) => {
              const existsIdx = mergedResearch.findIndex(r => r.id === importRes.id || r.topic.toLowerCase() === importRes.topic.toLowerCase());
              if (existsIdx > -1) {
                mergedResearch[existsIdx] = { ...mergedResearch[existsIdx], ...importRes };
              } else {
                mergedResearch.push({
                  id: importRes.id || `res-import-${Date.now()}`,
                  topic: importRes.topic || "Untitled Research",
                  note: importRes.note || "",
                  source: importRes.source || "Imported",
                  date: importRes.date || new Date().toISOString().split('T')[0]
                });
              }
            });
          }

          onUpdateProject({
            ...project,
            chapters: mergedChapters,
            characters: mergedCharacters,
            plotBeats: mergedBeats,
            researchNotes: mergedResearch
          });
          alert("JSON manuscript data successfully merged into your current workspace!");
        } catch (err) {
          console.error("JSON parsing error", err);
          alert("Failed to parse JSON file. Please ensure it matches StoryForge layout format.");
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const extendedWindow = window as unknown as ExtendedWindow;
          
          if (!extendedWindow.pdfjsLib) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            document.head.appendChild(script);
            await new Promise((resolve) => {
              script.onload = resolve;
            });
            const loadedLib = (window as unknown as ExtendedWindow).pdfjsLib;
            if (loadedLib) {
              loadedLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            }
          }

          const pdfjsLib = extendedWindow.pdfjsLib;
          if (!pdfjsLib) {
            alert("Failed to load PDF reading engine.");
            return;
          }
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let extractedText = "";
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
             const page = await pdf.getPage(pageNum);
             const textContent = await page.getTextContent();
             const pageText = textContent.items.map((item: { str: string }) => item.str).join(" ");
             extractedText += pageText + "\n\n";
          }

          if (!extractedText.trim()) {
            alert("We couldn't extract any readable text from this PDF file.");
            return;
          }

          const choice = confirm("PDF text extracted successfully!\n\nClick OK to add this as a new Chapter,\nor click Cancel to add it as a new Research Note.");
          
          if (choice) {
             const cleanTitle = file.name.replace(/\.pdf$/i, '');
             const cleanContent = extractedText.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('\n');
             const newChap = {
               id: `chap-pdf-${Date.now()}`,
               title: cleanTitle,
               words: extractedText.split(/\s+/).filter(Boolean).length,
               content: `<h1>${cleanTitle}</h1>\n${cleanContent}`
             };
             onUpdateProject({
               ...project,
               chapters: [...project.chapters, newChap]
             });
             alert(`PDF text imported as a new chapter: "${cleanTitle}"!`);
          } else {
             const cleanTitle = file.name.replace(/\.pdf$/i, '');
             const newNoteObj = {
               id: `res-pdf-${Date.now()}`,
               topic: `${cleanTitle} (PDF Import)`,
               note: extractedText,
               source: `Imported PDF: ${file.name}`,
               date: new Date().toISOString().split('T')[0]
             };
             onUpdateProject({
               ...project,
               researchNotes: [newNoteObj, ...(project.researchNotes || [])]
             });
             alert(`PDF text imported as a new research note: "${cleanTitle}"!`);
          }
        } catch (err) {
          console.error("PDF load error", err);
          alert("Failed to load PDF. Please make sure the PDF has extractable text content.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const saveProfileSettings = () => {
    if (!profileName.trim() || !profilePenName.trim()) return;
    onUpdateUserProfile({
      name: profileName.trim(),
      penName: profilePenName.trim(),
      email: profileEmail.trim(),
      bio: profileBio.trim()
    });
    setIsProfileModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-805 dark:text-slate-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`hidden md:flex border-r border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/50 backdrop-blur-xl h-screen flex-col justify-between shrink-0 transition-all duration-300 relative z-20 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Top brand & Main links */}
        <div className="flex flex-col gap-1.5 p-4 overflow-y-auto flex-1">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-3 py-2.5 mb-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border border-indigo-100/40 dark:border-indigo-900/10 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-indigo-200 dark:shadow-none">
              SF
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="text-xs font-bold text-indigo-750 dark:text-indigo-400 block tracking-wider uppercase">StoryForge</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate block max-w-[130px]">{project.title}</span>
              </div>
            )}
          </div>

          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-3 px-3 py-2.5 mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer"
          >
            <Home size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
            {!isSidebarCollapsed && <span>Back to Dashboard</span>}
          </button>
          
          <div className="h-px bg-slate-100 dark:bg-slate-800/50 mb-3" />

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            {primaryMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                  currentView === item.id 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100 dark:shadow-none font-extrabold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <item.icon size={16} className={currentView === item.id ? "text-white shrink-0" : "text-slate-400 dark:text-slate-500 shrink-0"} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
                {currentView === item.id && !isSidebarCollapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Sidebar Content (Secondary menus + Profile Settings Card) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3">
          
          {/* Secondary Menus (Goals moved here!) */}
          <div className="space-y-1">
            {bottomMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                  currentView === item.id 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                    : 'text-slate-600 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <item.icon size={16} className={currentView === item.id ? "text-white shrink-0" : "text-slate-400 dark:text-slate-500 shrink-0"} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-850/60" />

          {/* User Profile Info Card */}
          <div className="flex items-center justify-between gap-2.5">
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 p-1.5 rounded-xl transition-colors cursor-pointer"
              title="Edit Profile Settings"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xs shrink-0 shadow-inner">
                {userProfile.penName.substring(0, 2).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{userProfile.name}</h4>
                  <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold truncate mt-0.5 leading-none">@{userProfile.penName}</p>
                </div>
              )}
            </div>

            {/* Profile Action Buttons */}
            {!isSidebarCollapsed && (
              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  title="Profile Settings"
                >
                  <Settings size={14} />
                </button>
                <button 
                  onClick={onLogout}
                  className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all border border-transparent hover:border-rose-200/40"
                  title="Logout Studio"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Collapse & Theme Toggle Button */}
          <div className="h-px bg-slate-200 dark:bg-slate-800/60" />
          <div className="flex gap-1.5 w-full">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="flex-1 flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <Menu size={15} /> : <ChevronLeft size={15} />}
            </button>
            <button 
              onClick={onToggleTheme}
              className="flex-1 flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </aside>
      
      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-850 bg-white/70 dark:bg-slate-900/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 select-none">
            <button onClick={onBackToDashboard} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-semibold">Dashboard</button>
            <ChevronRight size={12} />
            <div className="flex items-center gap-1.5 group">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={saveProjectTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveProjectTitle();
                    if (e.key === 'Escape') {
                      setEditedTitle(project.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded border border-indigo-500 font-semibold focus:outline-none text-[11px] w-28 sm:w-40"
                  autoFocus
                />
              ) : (
                <>
                  <span 
                    onClick={() => { setEditedTitle(project.title); setIsEditingTitle(true); }}
                    className="font-semibold text-slate-700 dark:text-slate-300 max-w-[140px] truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 border-b border-dashed border-slate-355 dark:border-slate-700 hover:border-indigo-600 transition-all"
                    title="Click to rename"
                  >
                    {project.title}
                  </span>
                  <PenTool 
                    size={10} 
                    onClick={() => { setEditedTitle(project.title); setIsEditingTitle(true); }}
                    className="text-slate-400 hover:text-indigo-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" 
                  />
                </>
              )}
            </div>
            <ChevronRight size={12} />
            <span className="capitalize text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/30 dark:border-indigo-900/10">{currentView}</span>
          </div>

          {/* Quick overall status count + Import button */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => document.getElementById('import-file-input')?.click()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer border border-transparent"
              title="Import JSON Backup or PDF Manuscript"
            >
              <span>Import Document</span>
            </button>
            <input 
              type="file" 
              id="import-file-input" 
              className="hidden" 
              accept=".json,.pdf" 
              onChange={handleFileImport}
            />

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-450 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 px-3 py-1.5 rounded-xl select-none">
              <span className="flex items-center gap-1"><Sparkles size={12} className="text-indigo-500 animate-pulse" /> {totalWords.toLocaleString()} / {project.wordGoal.toLocaleString()} words</span>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
              <span>{project.chapters.length} chapters</span>
            </div>
          </div>
        </header>

        {/* Workspace Canvas */}
        <div className="flex-1 overflow-y-auto p-3 md:p-8 bg-slate-50/50 dark:bg-slate-950/40">
          
          {currentView === 'write' && (
            <RichTextEditor 
              project={project} 
              activeChapterId={currentActiveChapterId}
              onSelectChapter={setActiveChapterId}
              onUpdateChapterContent={handleUpdateChapterContent}
              onUpdateProject={onUpdateProject}
            />
          )}

          {currentView === 'organize' && (
            <DragDropOrganizer 
              project={project} 
              onUpdateProject={onUpdateProject}
              onWriteChapter={handleWriteChapter}
            />
          )}

          {currentView === 'characters' && (
            <CharactersView 
              project={project} 
              onUpdateProject={onUpdateProject}
            />
          )}

          {currentView === 'outline' && (
            <OutlineView 
              project={project} 
              onUpdateProject={onUpdateProject}
            />
          )}

          {/* Goals & Stats Tab (EDITABLE GOALS!) */}
          {currentView === 'goals' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Goals & Stats</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Track your typing targets, streak calendar, and edit targets.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Word Count Goal card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Project Goal</span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{(project.wordGoal).toLocaleString()} words</h3>
                    <p className="text-xs text-slate-400 mt-1">Completed {totalWords.toLocaleString()} words so far.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                      <span>Progress:</span>
                      <span>{Math.round((totalWords / project.wordGoal) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (totalWords / project.wordGoal) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Writing Streak Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Writing Streak</span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      🔥 5 Days
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Keep it up! Write daily to maintain your focus momentum.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs text-slate-500 font-semibold">
                    <span>Next milestone:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Award size={12} /> 7 Days Badge</span>
                  </div>
                </div>

                {/* Writing Pace Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Writing Pace</span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">450 words/hr</h3>
                    <p className="text-xs text-slate-400 mt-1">Average session output calculated over the past 7 days.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs text-slate-500 font-semibold">
                    <span>Est. completion:</span>
                    <span className="text-slate-700 dark:text-slate-300">August 12, 2026</span>
                  </div>
                </div>
              </div>

              {/* Targets Editor Form (Brand New!) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Edit Writing Targets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Project Target Goal (Total Words)</label>
                    <input 
                      type="number"
                      value={project.wordGoal}
                      onChange={(e) => onUpdateProject({ ...project, wordGoal: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Daily Session Goal (Words / Day)</label>
                    <input 
                      type="number"
                      value={project.dailyGoal}
                      onChange={(e) => onUpdateProject({ ...project, dailyGoal: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Analytics Calendar grid */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" /> Daily Contribution Activity
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const intensities = ['bg-slate-100 dark:bg-slate-800', 'bg-indigo-100 dark:bg-indigo-950/40', 'bg-indigo-300 dark:bg-indigo-800/60', 'bg-indigo-500 dark:bg-indigo-600', 'bg-indigo-600 dark:bg-indigo-500'];
                    const randIntensity = idx % 5 === 0 ? intensities[0] : intensities[Math.floor((idx * 3) % intensities.length)];
                    return (
                      <div 
                        key={idx} 
                        className={`h-7 w-7 rounded-md cursor-pointer transition-all hover:scale-110 ${randIntensity}`}
                        title={`Day ${idx + 1}: ${Math.floor(idx * 85)} words`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-105 dark:border-slate-800/60">
                  <span>Less active</span>
                  <div className="flex gap-1">
                    <span className="h-3.5 w-3.5 rounded bg-slate-100 dark:bg-slate-800" />
                    <span className="h-3.5 w-3.5 rounded bg-indigo-200 dark:bg-indigo-900" />
                    <span className="h-3.5 w-3.5 rounded bg-indigo-400 dark:bg-indigo-700" />
                    <span className="h-3.5 w-3.5 rounded bg-indigo-600 dark:bg-indigo-500" />
                  </div>
                  <span>More active</span>
                </div>
              </div>
            </div>
          )}

          {/* Scratchpad Tab (New!) */}
          {currentView === 'scratchpad' && (
            <div className="max-w-4xl mx-auto flex flex-col space-y-4">
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 animate-fade-in">
                    <Clipboard size={18} className="text-indigo-500" />
                    <span>Temporary Scratchpad</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">A temporary clipboard area to dump writing snippets, links, or notes. Saved automatically.</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col shadow-xs min-h-[480px]">
                <textarea
                  className="w-full h-full min-h-[420px] bg-transparent resize-none text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none leading-relaxed font-sans placeholder-slate-400 dark:placeholder-slate-600"
                  placeholder="Paste temporary draft paragraphs, links, character details, or outline ideas here..."
                  value={scratchpadText}
                  onChange={(e) => {
                    setScratchpadText(e.target.value);
                    debouncedSaveScratchpad(e.target.value);
                  }}
                />
              </div>
            </div>
          )}

          {/* Research Notes Tab (REFORMS!) */}
          {currentView === 'research' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Research & Reference Library</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Collect references, paste long article briefs, and document origins.</p>
                </div>
              </div>

              {/* Research Form input */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Add Reference Material</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Topic / Heading</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Warp Field Equations"
                      value={newResearchTopic}
                      onChange={(e) => setNewResearchTopic(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Research Date</label>
                    <input 
                      type="date"
                      value={newResearchDate}
                      onChange={(e) => setNewResearchDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Source / Origin (Where is this from? Book, URL, Paper)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Journal of Astrophysics, Vol. 12 or https://wikipedia.org/..."
                    value={newResearchSource}
                    onChange={(e) => setNewResearchSource(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Research Note Content (Pasted Data / Notes)</label>
                  <textarea 
                    rows={6}
                    placeholder="Paste article clips, bibliography details, or long research summaries here..."
                    value={newResearchText}
                    onChange={(e) => setNewResearchText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-750 dark:text-slate-200 px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/40">
                  <button 
                    onClick={addResearchNote}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm shadow-indigo-100 dark:shadow-none transition-all"
                  >
                    <Plus size={14} /> Save Reference
                  </button>
                </div>
              </div>

              {/* Research List (Custom scroll view cards for long text) */}
              <div className="space-y-4">
                {(project.researchNotes || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-250 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 p-6 text-center">
                    <FlaskConical size={32} className="text-slate-400 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350">No reference notes saved</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">Fill out the form above to add research to your library.</p>
                  </div>
                ) : (
                  project.researchNotes.map((note) => (
                    <div key={note.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex justify-between items-start transition-all duration-200">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1">
                            <Calendar size={10} /> {note.date}
                          </span>
                          
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/20 flex items-center gap-1 max-w-[200px] truncate" title={note.source}>
                            <Globe size={10} className="shrink-0" /> Source: {note.source}
                          </span>
                        </div>
                        
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-150">{note.topic}</h4>
                        
                        {/* Scrollable Container for Long Text */}
                        <div className="mt-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-xl max-h-56 overflow-y-auto shadow-inner text-xs text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {note.note}
                        </div>
                      </div>
                      
                      {/* Actions edit and delete buttons */}
                      <div className="flex gap-1.5 shrink-0 ml-4">
                        <button 
                          onClick={() => handleStartEditResearch(note)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg transition-all shrink-0 border border-slate-100 dark:border-slate-800 cursor-pointer"
                          title="Edit Research Note"
                        >
                          <PenTool size={14} />
                        </button>
                        <button 
                          onClick={() => deleteResearchNote(note.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all shrink-0 border border-slate-100 dark:border-slate-800 cursor-pointer"
                          title="Delete Research Note"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* EDIT RESEARCH NOTE MODAL */}
              {isEditingResearch && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form onSubmit={handleSaveEditResearch} className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                      <div className="flex items-center gap-2">
                        <FlaskConical size={18} className="text-indigo-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Research Note</h3>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsEditingResearch(false)}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4 mb-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Topic / Heading</label>
                          <input 
                            type="text" 
                            value={editingResearchTopic}
                            onChange={(e) => setEditingResearchTopic(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Reference Origin / URL</label>
                          <input 
                            type="text" 
                            value={editingResearchSource}
                            onChange={(e) => setEditingResearchSource(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Research Note Content</label>
                        <textarea 
                          value={editingResearchNote}
                          onChange={(e) => setEditingResearchNote(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-slate-100 h-44 resize-none leading-relaxed"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingResearch(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 cursor-pointer rounded-xl font-bold text-xs py-2"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
                      >
                        Save Reference
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Brainstorm Ideas Tab */}
          {currentView === 'ideas' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Brainstorm Board</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Jot down flash inspirations, hypothetical plot twists, and random ideas.</p>
                </div>
              </div>

              {/* Input section */}
              <div className="flex gap-2.5">
                <input 
                  type="text" 
                  placeholder="Type an idea sketch and press Enter..."
                  value={newIdeaText}
                  onChange={(e) => setNewIdeaText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addIdea(); }}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
                <button 
                  onClick={addIdea}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Post Idea
                </button>
              </div>

              {/* Stickies Grid (trash cans always visible!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {ideas.map((idea) => (
                  <div 
                    key={idea.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-44 relative group/sticky overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${idea.color}`} />
                    <p className="text-xs text-slate-700 dark:text-slate-250 leading-relaxed font-medium mt-1">&ldquo;{idea.text}&rdquo;</p>
                    
                    <div className="flex justify-end mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40">
                      <button 
                        onClick={() => deleteIdea(idea.id)}
                        className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer border border-slate-200/40"
                        title="Delete Idea"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dumpster Tab (New!) */}
          {currentView === 'dumpster' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 animate-fade-in">
                    <Trash2 size={18} className="text-indigo-500" />
                    <span>Ideas Dumpster</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">A safe holding place for deleted chapters, characters, or rejected brainstorm concepts. Restore them anytime.</p>
                </div>
                <button
                  onClick={() => setIsCreatingRejectedIdea(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer border border-transparent"
                >
                  <Plus size={13} />
                  <span>Dump Concept</span>
                </button>
              </div>

              {/* Add rejected idea inline form modal */}
              {isCreatingRejectedIdea && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form onSubmit={handleSaveRejectedIdea} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dump Rejected Concept</h3>
                      <button 
                        type="button"
                        onClick={() => setIsCreatingRejectedIdea(false)}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-4 mb-5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1">Concept Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Jax dies in Act 2" 
                          value={rejectedTitle}
                          onChange={(e) => setRejectedTitle(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1">Concept Details</label>
                        <textarea 
                          placeholder="Why this was rejected, or what it was. We keep it here in case you want to restore it later." 
                          value={rejectedContent}
                          onChange={(e) => setRejectedContent(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 h-28 resize-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5">
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingRejectedIdea(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm shadow-indigo-100 dark:shadow-none cursor-pointer"
                      >
                        Save to Dumpster
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List of dumpster items */}
              <div className="space-y-4">
                {(project.dumpster || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 p-6 text-center select-none">
                    <Trash2 size={36} className="text-slate-400 dark:text-slate-600 mb-2 animate-bounce" />
                    <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dumpster is currently empty</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Deleted items will be automatically backed up here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {(project.dumpster || []).map((item) => (
                      <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-800 transition-all duration-200 flex flex-col justify-between group">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">{item.type}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{item.date}</span>
                          </div>
                          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">{item.title}</h3>
                          <p 
                            className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: item.content.substring(0, 300) }}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => restoreDumpsterItem(item)}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Restore
                          </button>
                          <span className="text-slate-300 dark:text-slate-800">|</span>
                          <button
                            onClick={() => permanentlyDeleteDumpsterItem(item.id)}
                            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            Erase Permanently
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* USER PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div className="flex items-center gap-2">
                <User size={18} className="text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1">Pen Name (Alias)</label>
                <input 
                  type="text" 
                  value={profilePenName}
                  onChange={(e) => setProfilePenName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Author Bio</label>
                <textarea 
                  rows={4}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-750 dark:text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={saveProfileSettings}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden shrink-0 h-16 border-t border-slate-200 dark:border-slate-850 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-around px-4 pb-safe z-30 select-none">
        <button 
          onClick={() => setCurrentView('write')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
            currentView === 'write' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <PenTool size={16} />
          <span className="text-[9px] font-bold">Write</span>
        </button>
        <button 
          onClick={() => setCurrentView('organize')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
            currentView === 'organize' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Book size={16} />
          <span className="text-[9px] font-bold">Chapters</span>
        </button>
        <button 
          onClick={() => setCurrentView('outline')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
            currentView === 'outline' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Map size={16} />
          <span className="text-[9px] font-bold">Outline</span>
        </button>
        <button 
          onClick={() => setCurrentView('characters')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
            currentView === 'characters' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Users size={16} />
          <span className="text-[9px] font-bold">Cast</span>
        </button>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all text-slate-450 dark:text-slate-500"
        >
          <Menu size={16} />
          <span className="text-[9px] font-bold">More</span>
        </button>
      </nav>

      {/* MOBILE MENU MODAL DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden flex items-end justify-center">
          <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">More Studio Options</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setCurrentView('brainstorm'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-all text-left"
              >
                <Lightbulb size={16} className="text-indigo-500 shrink-0" />
                <span>Brainstorm</span>
              </button>
              <button
                onClick={() => { setCurrentView('research'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-all text-left"
              >
                <FlaskConical size={16} className="text-indigo-500 shrink-0" />
                <span>Research Notes</span>
              </button>
              <button
                onClick={() => { setCurrentView('goals'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-all text-left"
              >
                <Target size={16} className="text-indigo-500 shrink-0" />
                <span>Goals & Target</span>
              </button>
              <button
                onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-all text-left"
              >
                <User size={16} className="text-indigo-500 shrink-0" />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2" />

            <div className="flex gap-2.5">
              <button
                onClick={onToggleTheme}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-transparent transition-all"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={() => { onBackToDashboard(); setIsMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-transparent transition-all"
              >
                <Home size={15} />
                <span>Dashboard</span>
              </button>
            </div>

            <button
              onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100/65 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl border border-rose-100/30 dark:border-rose-900/10 transition-all mt-1"
            >
              <LogOut size={15} />
              <span>Logout Writer Session</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}