"use client";
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, FileText, Trash2, Edit3, Check, X, Plus, PenTool } from 'lucide-react';
import { Project, Chapter } from '../types';

interface DragDropProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onWriteChapter: (chapterId: string) => void;
}

export function DragDropOrganizer({ project, onUpdateProject, onWriteChapter }: DragDropProps) {
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Modal states for creating chapter
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(project.chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onUpdateProject({
      ...project,
      chapters: items
    });
  };

  const handleAddChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const title = newTitle.trim();
    const newChap: Chapter = {
      id: `chap-${Date.now()}`,
      title,
      words: 0,
      content: `<h1>${title}</h1><p>Start writing here...</p>`
    };
    
    onUpdateProject({
      ...project,
      chapters: [...project.chapters, newChap]
    });

    setIsAddModalOpen(false);
    setNewTitle("");
  };

  const deleteChapter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chap = project.chapters.find(c => c.id === id);
    const title = chap ? chap.title : "this chapter";
    if (!confirm(`Are you sure you want to delete the chapter "${title}"?`)) return;
    if (!confirm(`WARNING: All your writing in "${title}" will be permanently erased. Are you 100% sure?`)) return;
    
    const updatedDumpster = [
      ...(project.dumpster || []),
      {
        id: `dump-${Date.now()}`,
        title: chap?.title || "Deleted Chapter",
        content: chap?.content || "",
        type: "Chapter",
        date: new Date().toLocaleDateString()
      }
    ];

    onUpdateProject({
      ...project,
      chapters: project.chapters.filter(c => c.id !== id),
      dumpster: updatedDumpster
    });
  };

  const startRename = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChapterId(chapter.id);
    setEditTitle(chapter.title);
  };

  const saveRename = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    
    onUpdateProject({
      ...project,
      chapters: project.chapters.map(c => 
        c.id === chapterId ? { ...c, title: editTitle.trim() } : c
      )
    });
    setEditingChapterId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChapterId(null);
  };

  const totalWords = project.chapters.reduce((sum, c) => sum + (c.words || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Metrics Card */}
      <div className="grid grid-cols-3 gap-4 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 mb-8 shadow-xs select-none">
        <div className="text-center p-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Chapters</span>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{project.chapters.length}</span>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-800 p-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Words</span>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalWords.toLocaleString()}</span>
        </div>
        <div className="text-center p-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Target</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round((totalWords / project.wordGoal) * 100)}%
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Manuscript Organizer</h2>
          <p className="text-xs text-slate-500 mt-0.5">Drag and drop chapters to structure your narrative timeline.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 dark:shadow-none cursor-pointer"
        >
          <Plus size={14} /> Add Chapter
        </button>
      </div>

      {project.chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/50 p-6 text-center shadow-xs select-none">
          <FileText size={36} className="text-slate-400 mb-2 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350">No chapters mapped yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">Get started by building your first chapter using the add button above.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="chapters-list">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="space-y-3"
              >
                {project.chapters.map((chapter, index) => (
                  <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center bg-white dark:bg-slate-900 border rounded-2xl p-4.5 transition-all group/item ${
                          snapshot.isDragging 
                            ? 'shadow-lg border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-950/20' 
                            : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-800 shadow-xs'
                        }`}
                      >
                        {/* Drag Handle */}
                        <div 
                          {...provided.dragHandleProps} 
                          className="text-slate-350 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 mr-3.5 cursor-grab p-1"
                        >
                          <GripVertical size={16} />
                        </div>
                        
                        <FileText size={18} className="text-indigo-500 mr-3.5 shrink-0" />
                        
                        {/* Chapter Details / Inline Rename */}
                        <div className="flex-1 min-w-0 mr-4">
                          {editingChapterId === chapter.id ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input 
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button 
                                onClick={(e) => saveRename(chapter.id, e)}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/60 transition-colors"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={cancelRename}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 truncate leading-snug flex items-center gap-2">
                                {chapter.title}
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                  #{index + 1}
                                </span>
                              </h3>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{(chapter.words || 0).toLocaleString()} words</p>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        {editingChapterId !== chapter.id && (
                          <div className="flex items-center gap-1.5 transition-all">
                            <button
                              onClick={(e) => startRename(chapter, e)}
                              className="p-1.5 text-slate-450 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-lg transition-all"
                              title="Rename Chapter"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={(e) => deleteChapter(chapter.id, e)}
                              className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                              title="Delete Chapter"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              onClick={() => onWriteChapter(chapter.id)}
                              className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-lg transition-all border border-indigo-100/50 dark:border-indigo-950/20"
                            >
                              <PenTool size={12} />
                              <span>Write</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* ADD CHAPTER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddChapterSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Chapter</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Chapter Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 1: The Gathering Storm"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-all hover:bg-slate-250 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Add Chapter
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}