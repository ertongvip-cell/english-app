export const PRIVATE_COURSE_VERSION = 1 as const

export type SourceType = 'nce' | 'audio' | 'video' | 'article' | 'work' | 'custom'
export type SceneType = 'travel' | 'daily' | 'work' | 'general'

export interface SpeechNote {
  type: 'linking' | 'weak-form' | 'stress' | 'sound'
  text: string
  note: string
}

export interface CourseSentence {
  id: string
  text: string
  paraphraseEn?: string
  zh?: string
  startMs?: number
  endMs?: number
  speechNotes?: SpeechNote[]
}

export interface ConceptCheck {
  id: string
  prompt: string
  options: string[]
  answer: number
  sentenceIds?: string[]
}

export interface CourseWord {
  id: string
  word: string
  definitionEn: string
  zh?: string
  collocations: string[]
  examples: string[]
  sentenceIds?: string[]
}

export interface GrammarNote {
  id: string
  title: string
  explanationEn: string
  explanationZh?: string
  examples: string[]
}

export interface ReactionChunk {
  id: string
  chunk: string
  meaningEn: string
  scenario: string
  acceptableAnswers: string[]
  keywords?: string[]
  targetMs: number
  grammarId?: string
}

export interface RetellTask {
  id: string
  prompt: string
  keywords: string[]
  reference?: string
  targetSeconds: number
}

export interface TransferTask {
  id: string
  scene: SceneType
  role: string
  situation: string
  opening?: string
  acceptableAnswers: string[]
  keywords: string[]
}

export interface PrivateLesson {
  schemaVersion: typeof PRIVATE_COURSE_VERSION
  id: string
  source: {
    type: SourceType
    title: string
    book?: string
    lesson?: string
    language: string
  }
  sentences: CourseSentence[]
  concepts: ConceptCheck[]
  vocabulary: CourseWord[]
  grammar: GrammarNote[]
  chunks: ReactionChunk[]
  retell: RetellTask[]
  transfers: TransferTask[]
  media?: {
    fileName: string
    checksum?: string
    durationMs?: number
  }
  generatedAt: string
}

export interface LearningPlan {
  schemaVersion: typeof PRIVATE_COURSE_VERSION
  id: string
  title: string
  lessonIds: string[]
  startLessonId: string
  createdAt: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
