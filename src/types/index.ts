export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export type ProfileRecord = {
  user_id: string;
  display_name?: string | null;
  learning_level: LearningLevel;
  goal?: string | null;
  created_at: string;
  updated_at: string;
};

export type TextSource = "pdf" | "ocr" | "scanned";

export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type DocumentRecord = {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  page_count: number | null;
  created_at: string;
  text_source?: TextSource | null;
  is_ocr_ready?: boolean | null;
  processing_status?: ProcessingStatus | null;
  processing_error?: string | null;
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

export type NoteSection =
  | { kind: "definition"; text: string }
  | { kind: "remember"; text: string }
  | { kind: "trick"; text: string }
  | { kind: "equation"; text: string }
  | { kind: "examQuestions"; items: string[] }
  | { kind: "fiveMarkAnswer"; text: string }
  | { kind: "oneLineRevision"; text: string };

export type StudyNote = {
  chapter: string;
  sections: NoteSection[];
};

export type NotesResult = {
  overview: string;
  notes: StudyNote[];
};

export type Flashcard = {
  front: string;
  back: string;
};

export type FlashcardResult = {
  cards: Flashcard[];
};

export type QuizQuestionType = "mcq" | "truefalse" | "fillblank" | "short";

export type QuizQuestion = {
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation?: string;
};

export type QuizResult = {
  questions: QuizQuestion[];
};

export type MindMapNode = { label: string; children?: MindMapNode[] };
