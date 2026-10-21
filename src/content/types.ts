export interface Word {
  id: string
  en: string
  zh: string
  example: string
  exampleZh: string
}

export interface Drill {
  zh: string // 给出中文
  answers: string[] // 可接受的英文说法
  keywords?: string[] // 必须说出的关键表达（用于检查语法点）
}

export interface Grammar {
  id: string
  title: string
  summary: string // 一句话要点
  explain: string[] // 讲解要点
  examples: { en: string; zh: string }[]
  drills: Drill[]
}

export type Turn =
  | { role: 'app'; en: string; zh: string }
  | { role: 'user'; zh: string; answers: string[]; keywords?: string[] }

export interface Dialogue {
  id: string
  scene: 'travel' | 'daily' | 'work'
  title: string
  roleName: string // App 扮演的角色
  intro: string // 情景说明（中文）
  turns: Turn[]
  betterSay: { en: string; zh: string }[] // 更地道的说法
}

export interface Question {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface Lesson {
  id: string
  week: number
  title: string
  titleZh: string
  sentences: string[]
  zh: string[] // 逐句翻译
  questions: Question[]
  words: string[] // Word id
  grammarId: string
  dialogueId: string
}
