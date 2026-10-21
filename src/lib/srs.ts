// 简化版 SM-2 间隔重复
import { addDays } from './date.ts'

export type Grade = 'know' | 'fuzzy' | 'forgot'

export interface SrsState {
  id: string // 单词 id
  interval: number // 当前间隔（天），0 表示当天需再复习
  due: string // 下次复习日期 YYYY-MM-DD
  reps: number // 累计复习次数
  lapses: number // 忘记次数
  introduced: string // 首次学习日期
}

export function newState(id: string, today: string): SrsState {
  return { id, interval: 0, due: today, reps: 0, lapses: 0, introduced: today }
}

export function review(s: SrsState, grade: Grade, today: string): SrsState {
  let interval: number
  if (grade === 'forgot') {
    interval = 0
  } else if (grade === 'fuzzy') {
    interval = s.interval === 0 ? 1 : Math.max(1, Math.round(s.interval * 1.2))
  } else {
    interval = s.interval === 0 ? 1 : Math.round(s.interval * 2.5)
  }
  interval = Math.min(interval, 180)
  return {
    ...s,
    interval,
    due: addDays(today, interval),
    reps: s.reps + 1,
    lapses: s.lapses + (grade === 'forgot' ? 1 : 0),
  }
}

export function isDue(s: SrsState, today: string): boolean {
  return s.due <= today
}
