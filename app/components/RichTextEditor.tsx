"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import CharacterCount from '@tiptap/extension-character-count';
import suggestion, { mentionSuggestions } from './suggestion';
import { Project } from '../types';

// CRITICAL: This CSS is required for the @ mention dropdown to become visible!
import 'tippy.js/dist/tippy.css'; 

import { Maximize2, Minimize2, Target, Info, ChevronDown, Download, Sparkles, BookOpen, PenTool, Type } from 'lucide-react';

interface RichTextEditorProps {
  project: Project;
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onUpdateChapterContent: (chapterId: string, content: string, wordCount: number) => void;
}

export default function RichTextEditor({ 
  project, 
  activeChapterId, 
  onSelectChapter, 
  onUpdateChapterContent 
}: RichTextEditorProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [sessionStartWordCount, setSessionStartWordCount] = useState<number | null>(null);
  const [fontFamily, setFontFamily] = useState<string>('serif');

  const activeChapter = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];

  // Keep track of the active chapter content ref to avoid re-render cycles
  const activeChapterIdRef = useRef(activeChapterId);
  useEffect(() => {
    activeChapterIdRef.current = activeChapterId;
  }, [activeChapterId]);

  // Sync characters list with mention suggestions
  useEffect(() => {
    if (project.characters) {
      mentionSuggestions.characters = project.characters.map(c => c.name);
    }
  }, [project.characters]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Placeholder.configure({
        placeholder: 'The blank page awaits. Type @ to mention a character, and write your story...',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-900 cursor-pointer border border-indigo-200/50 dark:border-indigo-850',
        },
        suggestion,
      })
    ],
    content: activeChapter ? activeChapter.content : '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg dark:prose-invert prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300 focus:outline-none min-h-[60vh] max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const words = editor.storage.characterCount.words();
      setWordCount(words);
      
      const html = editor.getHTML();
      onUpdateChapterContent(activeChapterIdRef.current, html, words);
    },
  });

  // Track initial word count of the chapter to calculate session words written
  useEffect(() => {
    if (activeChapter) {
      const currentWords = activeChapter.words || 0;
      const timer = setTimeout(() => {
        setWordCount(currentWords);
        setSessionStartWordCount(currentWords);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeChapterId, activeChapter]);

  // Sync editor content when changing active chapter
  useEffect(() => {
    if (editor && activeChapter) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== activeChapter.content) {
        editor.commands.setContent(activeChapter.content, { emitUpdate: false });
      }
    }
  }, [activeChapterId, editor, activeChapter]);

  // Calculate session word count
  const sessionWritten = sessionStartWordCount !== null ? Math.max(0, wordCount - sessionStartWordCount) : 0;
  const progressPercentage = Math.min((wordCount / project.dailyGoal) * 100, 100);

  // Simple Markdown Exporter
  const exportAsMarkdown = () => {
    const markdown = project.chapters.map(chap => {
      // Create a temporary div to parse HTML nodes into Markdown
      if (typeof document === 'undefined') return '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = chap.content;
      
      let text = `# ${chap.title}\n\n`;
      tempDiv.childNodes.forEach(node => {
        if (node.nodeName === 'P') {
          text += `${node.textContent}\n\n`;
        } else if (node.nodeName.startsWith('H')) {
          const level = node.nodeName.substring(1);
          const hashes = '#'.repeat(parseInt(level) || 2);
          text += `${hashes} ${node.textContent}\n\n`;
        }
      });
      return text;
    }).join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.title.toLowerCase().replace(/\s+/g, '_')}_manuscript.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!activeChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 p-6 text-center">
        <PenTool size={36} className="text-slate-400 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Chapters Yet</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">Create your first chapter in the Organizer to begin writing.</p>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${isFocusMode ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 md:p-16 flex flex-col items-center' : 'h-full flex flex-col xl:flex-row gap-6'}`}>
      
      {/* WRITER CANVAS CONTAINER */}
      <div className={`flex-1 w-full max-w-4xl ${isFocusMode ? 'mx-auto flex flex-col justify-between min-h-screen' : ''}`}>
        
        {/* Context Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white dark:bg-slate-900/60 backdrop-blur-md p-4 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm w-full">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Chapter Selector */}
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={activeChapterId}
                onChange={(e) => onSelectChapter(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl pl-3 pr-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                {project.chapters.map(chap => (
                  <option key={chap.id} value={chap.id}>{chap.title}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 px-2.5 py-2 rounded-xl">
              <BookOpen size={12} className="text-indigo-500" />
              <span className="font-semibold text-slate-600 dark:text-slate-350">{project.type} Studio</span>
            </div>
          </div>

          {/* Tools & Focus */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Font Selector */}
            <div className="relative">
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 text-slate-650 dark:text-slate-300 text-xs font-semibold rounded-xl pl-3.5 pr-8.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                title="Change Editor Font"
              >
                <option value="serif">Serif (Classic)</option>
                <option value="sans">Sans-Serif (Modern)</option>
                <option value="mono">Monospace (Draft)</option>
                <option value="dyslexic">Dyslexic-Friendly</option>
                <option value="elegant">Elegant (Palatino)</option>
                <option value="garamond">Editorial (Garamond)</option>
              </select>
              <Type size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none" />
            </div>

            <button 
              onClick={exportAsMarkdown}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-650 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 px-3.5 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700/50 cursor-pointer"
              title="Export Full Manuscript"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 px-3.5 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700/50 cursor-pointer"
              title="Toggle Focus Mode"
            >
              {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFocusMode ? 'Exit Focus' : 'Focus'}</span>
            </button>
          </div>
        </div>

        {/* The Writing Paper Canvas */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl transition-all duration-300 ${
          isFocusMode 
            ? 'p-8 md:p-20 shadow-2xl flex-1 max-w-3xl w-full border-indigo-100/50 dark:border-indigo-950/30' 
            : 'p-8 md:p-14 shadow-sm'
        } ${
          fontFamily === 'sans' 
            ? '[&_.ProseMirror]:font-sans [&_.ProseMirror_p]:font-sans [&_.ProseMirror_h1]:font-sans [&_.ProseMirror_h2]:font-sans [&_.ProseMirror_h3]:font-sans font-sans' 
            : fontFamily === 'mono' 
            ? '[&_.ProseMirror]:font-mono [&_.ProseMirror_p]:font-mono [&_.ProseMirror_h1]:font-mono [&_.ProseMirror_h2]:font-mono [&_.ProseMirror_h3]:font-mono font-mono'
            : fontFamily === 'dyslexic'
            ? '[&_.ProseMirror]:font-[\'Comic_Sans_MS\',\'Comic_Neue\',sans-serif] [&_.ProseMirror_p]:font-[\'Comic_Sans_MS\',\'Comic_Neue\',sans-serif] [&_.ProseMirror_h1]:font-[\'Comic_Sans_MS\',\'Comic_Neue\',sans-serif] [&_.ProseMirror_h2]:font-[\'Comic_Sans_MS\',\'Comic_Neue\',sans-serif] [&_.ProseMirror_h3]:font-[\'Comic_Sans_MS\',\'Comic_Neue\',sans-serif] font-[\'Comic_Sans_MS\',\'Comic_Neue\',sans-serif]'
            : fontFamily === 'elegant'
            ? '[&_.ProseMirror]:font-[Palatino,\'Palatino_Linotype\',Georgia,serif] [&_.ProseMirror_p]:font-[Palatino,\'Palatino_Linotype\',Georgia,serif] [&_.ProseMirror_h1]:font-[Palatino,\'Palatino_Linotype\',Georgia,serif] [&_.ProseMirror_h2]:font-[Palatino,\'Palatino_Linotype\',Georgia,serif] [&_.ProseMirror_h3]:font-[Palatino,\'Palatino_Linotype\',Georgia,serif] font-[Palatino,\'Palatino_Linotype\',Georgia,serif]'
            : fontFamily === 'garamond'
            ? '[&_.ProseMirror]:font-[Garamond,\'EB_Garamond\',Georgia,serif] [&_.ProseMirror_p]:font-[Garamond,\'EB_Garamond\',Georgia,serif] [&_.ProseMirror_h1]:font-[Garamond,\'EB_Garamond\',Georgia,serif] [&_.ProseMirror_h2]:font-[Garamond,\'EB_Garamond\',Georgia,serif] [&_.ProseMirror_h3]:font-[Garamond,\'EB_Garamond\',Georgia,serif] font-[Garamond,\'EB_Garamond\',Georgia,serif]'
            : '[&_.ProseMirror]:font-serif [&_.ProseMirror_p]:font-serif [&_.ProseMirror_h1]:font-serif [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h3]:font-serif font-serif'
        }`}>
          <div className="max-w-none">
            <EditorContent editor={editor} />
          </div>
        </div>
        
        {/* Focus Mode Tiny Footer Info */}
        {isFocusMode && (
          <div className="w-full max-w-3xl flex justify-between items-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 select-none">
            <span className="font-medium">Chapter: {activeChapter.title}</span>
            <div className="flex gap-4">
              <span>Session: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{sessionWritten}</strong> words</span>
              <span>Total: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{wordCount}</strong> words</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: PANEL INSPECTOR (Hides in Focus Mode) */}
      {!isFocusMode && (
        <div className="hidden xl:flex w-full xl:w-76 shrink-0 flex-col gap-6">
          
          {/* Goal Tracker Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                <Target size={14} className="text-indigo-500"/> Word Goal
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                {wordCount} / {project.dailyGoal}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-3">
              <span>Session words:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-305 flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-500 animate-pulse" /> {sessionWritten}
              </span>
            </div>
          </div>

          {/* Dynamic Scene / Chapter Context Inspector */}
          <div className="bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <Info size={14} className="text-indigo-500"/> Plot & Characters
            </h3>
            
            <div className="space-y-4 text-xs flex-1 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 p-3.5 border border-slate-250/50 dark:border-slate-800 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Active Chapter</span>
                <h4 className="font-bold text-slate-850 dark:text-slate-150 mb-1">{activeChapter.title}</h4>
                <p className="text-slate-450 dark:text-slate-400 leading-normal">
                  You are editing this chapter. Tip: Use `@` to tag characters so they link to your world-building profiles.
                </p>
              </div>

              {project.characters.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-3.5 border border-slate-250/50 dark:border-slate-800 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest block mb-2">Available Cast</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.characters.map(char => (
                      <span 
                        key={char.id}
                        className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-650 dark:text-slate-300 font-medium"
                      >
                        @{char.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.plotBeats.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-3.5 border border-slate-250/50 dark:border-slate-800 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-2">Narrative Beats</span>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {project.plotBeats.map((beat) => (
                      <div key={beat.id} className="border-l-2 border-slate-200 dark:border-slate-800 pl-2">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">{beat.type}</span>
                        <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{beat.title}</h5>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{beat.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}