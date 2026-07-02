export interface Scene {
  id: string;
  title: string;
  summary: string;
}

export interface Chapter {
  id: string;
  title: string;
  words: number;
  content: string; // HTML format for TipTap
}

export interface Character {
  id: string;
  name: string;
  role: string; // 'Protagonist' | 'Antagonist' | 'Supporting' | etc.
  description: string;
  avatarColor: string; // Tailwind background class or hex
  bio?: string;
  archetype?: string;
}

export interface PlotBeat {
  id: string;
  title: string;
  type: string; // 'Inciting Incident' | 'Act 1' | etc.
  description: string;
}

export interface ResearchNote {
  id: string;
  topic: string;
  note: string;
  source: string;
  date: string;
}

export interface UserProfile {
  name: string;
  penName: string;
  email: string;
  bio?: string;
}

export interface Project {
  id: string;
  title: string;
  type: 'Book' | 'Article';
  updatedAt: string;
  chapters: Chapter[];
  characters: Character[];
  plotBeats: PlotBeat[];
  researchNotes: ResearchNote[];
  wordGoal: number; // e.g. 50,000 for novel, 2,000 for article
  dailyGoal: number; // e.g. 500 words/day
}
