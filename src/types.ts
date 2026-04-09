export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
  category: string;
  core: 1 | 2;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export type QuizState = 'idle' | 'quiz' | 'review';
