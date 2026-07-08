"use client";
import React, { useState } from 'react';
import { Plus, Users, Trash2, X, User } from 'lucide-react';
import { Project, Character } from '../types';

interface CharactersViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 
  'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-sky-500'
];

export default function CharactersView({ project, onUpdateProject }: CharactersViewProps) {
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editArchetype, setEditArchetype] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBio, setEditBio] = useState("");

  // Modal states for creating character
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Protagonist");
  const [newArchetype, setNewArchetype] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBio, setNewBio] = useState("");

  const handleOpenProfile = (char: Character) => {
    setSelectedChar(char);
    setEditName(char.name);
    setEditRole(char.role);
    setEditArchetype(char.archetype || "");
    setEditDescription(char.description);
    setEditBio(char.bio || "");
  };

  const handleSaveProfile = () => {
    if (!selectedChar || !editName.trim()) return;

    const updatedChars = project.characters.map(c => 
      c.id === selectedChar.id 
        ? {
            ...c,
            name: editName.trim(),
            role: editRole,
            archetype: editArchetype.trim(),
            description: editDescription.trim(),
            bio: editBio.trim()
          }
        : c
    );

    onUpdateProject({
      ...project,
      characters: updatedChars
    });

    setSelectedChar(null);
  };

  const handleDeleteCharacter = (id: string) => {
    const char = project.characters.find(c => c.id === id);
    const name = char ? char.name : "this character";
    if (!confirm(`Are you sure you want to delete the character profile of "${name}"?`)) return;
    if (!confirm(`WARNING: This action is permanent. Are you absolutely certain you want to erase "${name}" from your cast?`)) return;

    const updatedDumpster = [
      ...(project.dumpster || []),
      {
        id: `dump-${Date.now()}`,
        title: char?.name || "Deleted Character",
        content: `Role: ${char?.role || ""}\nDescription: ${char?.description || ""}\nBio: ${char?.bio || ""}`,
        type: "Character",
        date: new Date().toLocaleDateString()
      }
    ];

    onUpdateProject({
      ...project,
      characters: project.characters.filter(c => c.id !== id),
      dumpster: updatedDumpster
    });

    setSelectedChar(null);
  };

  const handleAddCharacterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      description: newDescription.trim() || "Brief summary of character role or personality...",
      avatarColor: randomColor,
      bio: newBio.trim() || "Detailed backstory, motivations, relationships...",
      archetype: newArchetype.trim() || "Archetype (e.g. The Rebel, The Mentor)"
    };
    
    onUpdateProject({
      ...project,
      characters: [...project.characters, newChar]
    });

    setIsAddModalOpen(false);
    setNewName("");
    setNewRole("Protagonist");
    setNewArchetype("");
    setNewDescription("");
    setNewBio("");
  };

  const filteredCharacters = project.characters.filter(char => 
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (char.archetype || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-6 relative h-[calc(100vh-140px)]">
      
      {/* Left side: Search & Cast List */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs select-none">
          <div>
            <h2 className="text-lg font-bold text-slate-905 dark:text-slate-100">Cast of Characters</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define your cast, plot arcs, and character profiles.</p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search character sheet..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-60 bg-white dark:bg-slate-900 shadow-xs"
              />
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer border border-transparent"
            >
              <Plus size={14} /> Add Character
            </button>
          </div>
        </div>

        {filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 p-6 text-center select-none shadow-xs">
            <Users size={32} className="text-slate-400 mb-2 animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350">No characters created</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">Get started by building your narrative cast above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCharacters.map((char) => (
              <div 
                key={char.id} 
                onClick={() => handleOpenProfile(char)}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-800 transition-all duration-200 cursor-pointer flex flex-col justify-between group h-52 relative overflow-hidden ${
                  selectedChar?.id === char.id ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200/80 dark:border-slate-800/80 shadow-xs'
                }`}
              >
                {/* Glowing border accent on hover */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`h-11 w-11 ${char.avatarColor || 'bg-indigo-500'} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm uppercase`}>
                      {char.name.substring(0, 2)}
                    </div>
                    
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border select-none ${
                      char.role === 'Protagonist' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-150 dark:border-indigo-900/30' 
                        : char.role === 'Antagonist'
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border border-rose-150 dark:border-rose-900/30'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {char.role}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{char.name}</h3>
                  {char.archetype && (
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold block mt-0.5">{char.archetype}</span>
                  )}
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {char.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Detailed Profile Drawer */}
      {selectedChar && (
        <div className="w-full xl:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-y-auto flex flex-col justify-between shrink-0 h-full animate-in slide-in-from-right-8 duration-200">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5 select-none">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Character Sheet</h3>
              <button 
                onClick={() => setSelectedChar(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Character Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Cast Role</label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 px-2 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option>Protagonist</option>
                    <option>Antagonist</option>
                    <option>Supporting</option>
                    <option>Mentor</option>
                    <option>Deuteragonist</option>
                    <option>Foil</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Archetype</label>
                  <input 
                    type="text" 
                    value={editArchetype}
                    placeholder="e.g. The Rebel"
                    onChange={(e) => setEditArchetype(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Short Description</label>
                <textarea 
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-750 dark:text-slate-250 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-normal resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Backstory & Bio Notes</label>
                <textarea 
                  rows={6}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-750 dark:text-slate-250 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button 
              onClick={() => handleDeleteCharacter(selectedChar.id)}
              className="p-2.5 text-rose-500 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer"
              title="Delete Character Profile"
            >
              <Trash2 size={15} />
            </button>
            
            <button 
              onClick={handleSaveProfile}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* ADD CHARACTER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddCharacterSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div className="flex items-center gap-2">
                <User size={18} className="text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add Cast Character</h3>
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
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Character Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jax Sterling"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Cast Role</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 px-2 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option>Protagonist</option>
                    <option>Antagonist</option>
                    <option>Supporting</option>
                    <option>Mentor</option>
                    <option>Deuteragonist</option>
                    <option>Foil</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Archetype</label>
                  <input 
                    type="text" 
                    value={newArchetype}
                    placeholder="e.g. The Maverick"
                    onChange={(e) => setNewArchetype(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Brief Description</label>
                <textarea 
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain character's core features or narrative purpose..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-750 dark:text-slate-250 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-normal resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Motivations & Backstory Notes</label>
                <textarea 
                  rows={3}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Flesh out backstory details, motivation triggers, or relationships..."
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Add Character
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}