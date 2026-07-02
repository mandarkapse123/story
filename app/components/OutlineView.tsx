"use client";
import React, { useState } from 'react';
import { Plus, Flag, Trash2, Edit3, Check, X, MoveUp, MoveDown } from 'lucide-react';
import { Project, PlotBeat } from '../types';

interface OutlineViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const BEAT_TYPES = [
  'Inciting Incident', 'Plot Point 1', 'Pinch Point 1', 'Midpoint',
  'Pinch Point 2', 'Plot Point 2', 'Climax', 'Resolution', 'Act 1', 'Act 2', 'Act 3'
];

export default function OutlineView({ project, onUpdateProject }: OutlineViewProps) {
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  
  // Form states for inline editing
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Modal states for creating beat
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Inciting Incident");
  const [newDescription, setNewDescription] = useState("");

  const startEdit = (beat: PlotBeat) => {
    setEditingBeatId(beat.id);
    setEditTitle(beat.title);
    setEditType(beat.type);
    setEditDescription(beat.description);
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;

    const updatedBeats = project.plotBeats.map(pb => 
      pb.id === id 
        ? { ...pb, title: editTitle.trim(), type: editType, description: editDescription.trim() } 
        : pb
    );

    onUpdateProject({
      ...project,
      plotBeats: updatedBeats
    });
    setEditingBeatId(null);
  };

  const deleteBeat = (id: string) => {
    const beat = project.plotBeats.find(b => b.id === id);
    const title = beat ? beat.title : "this plot beat";
    if (!confirm(`Are you sure you want to delete the plot beat "${title}"?`)) return;
    if (!confirm(`Confirming deletion of "${title}". Are you absolutely sure?`)) return;

    onUpdateProject({
      ...project,
      plotBeats: project.plotBeats.filter(pb => pb.id !== id)
    });
  };

  const handleAddBeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newBeat: PlotBeat = {
      id: `beat-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      description: newDescription.trim() || "Describe what happens in this narrative beat...",
    };
    
    onUpdateProject({
      ...project,
      plotBeats: [...project.plotBeats, newBeat]
    });

    setIsAddModalOpen(false);
    setNewTitle("");
    setNewType("Inciting Incident");
    setNewDescription("");
  };

  const moveBeat = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.plotBeats.length) return;

    const reorderedBeats = Array.from(project.plotBeats);
    const [movedBeat] = reorderedBeats.splice(index, 1);
    reorderedBeats.splice(targetIndex, 0, movedBeat);

    onUpdateProject({
      ...project,
      plotBeats: reorderedBeats
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header section */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Plot Outline</h2>
          <p className="text-xs text-slate-500 mt-0.5">Map out the major structural beats and narrative arc of your story.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer border border-transparent"
        >
          <Plus size={14} /> Add Plot Beat
        </button>
      </div>

      {project.plotBeats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 p-6 text-center select-none">
          <Flag size={32} className="text-slate-400 mb-2 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350">No plot beats mapped</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">Get started by creating your first structural plot point above.</p>
        </div>
      ) : (
        /* Timeline Grid */
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 sm:ml-6 space-y-8 pb-8">
          {project.plotBeats.map((point, index) => (
            <div key={point.id} className="relative pl-8 sm:pl-10 group">
              
              {/* Timeline dot and connecting dot rings */}
              <div className="absolute w-4.5 h-4.5 bg-indigo-500 rounded-full -left-[10px] top-4 ring-4 ring-white dark:ring-slate-950 shadow-sm transition-transform duration-200 group-hover:scale-115 flex items-center justify-center text-[9px] text-white font-bold">
                {index + 1}
              </div>
              
              {/* Card Container */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-800 transition-all duration-205">
                
                {editingBeatId === point.id ? (
                  /* Edit State */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase block mb-1">Beat Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 px-2 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          {BEAT_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                          <option value="Scene Beat">Scene Beat</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase block mb-1">Beat Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase block mb-1">Beat Summary</label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-770 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-normal resize-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingBeatId(null)}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <X size={13} /> Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(point.id)}
                        className="flex items-center gap-1 text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 px-3.5 py-2 rounded-lg transition-colors border border-indigo-100/50 dark:border-indigo-950/20 cursor-pointer"
                      >
                        <Check size={13} /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display State */
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-md border border-indigo-100/50 dark:border-indigo-900/30 select-none">
                          <Flag size={10} /> {point.type}
                        </span>
                        <span className="text-xs text-slate-400 font-medium select-none">Beat {index + 1}</span>
                      </div>

                      {/* Action Menu */}
                      <div className="flex items-center gap-1 transition-all">
                        <button
                          disabled={index === 0}
                          onClick={() => moveBeat(index, 'up')}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Move Beat Up"
                        >
                          <MoveUp size={12} />
                        </button>
                        <button
                          disabled={index === project.plotBeats.length - 1}
                          onClick={() => moveBeat(index, 'down')}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Move Beat Down"
                        >
                          <MoveDown size={12} />
                        </button>
                        <button
                          onClick={() => startEdit(point)}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                          title="Edit Beat"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => deleteBeat(point.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                          title="Delete Beat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 mb-1 leading-snug">{point.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{point.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD PLOT BEAT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddBeatSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div className="flex items-center gap-2">
                <Flag size={18} className="text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add Plot Beat</h3>
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
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Beat Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. The Betrayal"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Beat Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 px-2 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {BEAT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="Scene Beat">Scene Beat</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Beat Summary (Description)</label>
                <textarea 
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the main action or revelation that takes place here..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-750 dark:text-slate-250 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
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
                className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Add Beat
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}