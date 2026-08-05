export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DocumentRecord = {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  page_count: number | null;
  created_at: string;
};

export type StudyActivity = {
  id: string;
  user_id: string;
  document_id: string | null;
  type: "summary" | "flashcards" | "quiz" | "chat";
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ChapterSummary = {
  chapter: string;
  summary: string;
  keyPoints: string[];
};

export type SummaryResult = {
  overview: string;
  chapters: ChapterSummary[];
};

export type Flashcard = {
  front: string;
  back: string;
};

export type FlashcardResult = {
  cards: Flashcard[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type QuizResult = {
  questions: QuizQuestion[];
};
