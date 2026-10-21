// 打卡与每日统计
import { addDays } from './date.ts'

export interface DayRecord {
  date: string
  cards: number // 完成卡片数
  seconds: number // 学习时长
  kinds: Record<string, number> // 各类卡片完成数
}

export function emptyDay(date: string): DayRecord {
  return { date, cards: 0, seconds: 0, kinds: {} }
}

export function addCard(r: DayRecord, kind: string, seconds: number): DayRecord {
  return {
    ...r,
    cards: r.cards + 1,
    seconds: r.seconds + Math.max(0, Math.round(seconds)),
    kinds: { ...r.kinds, [kind]: (r.kinds[kind] ?? 0) + 1 },
  }
}

/**
 * 连续打卡天数。今天还没学不会打断连续记录（从昨天往前数）
 */
export function streak(records: Map<string, DayRecord>, today: string): number {
  let day = (records.get(today)?.cards ?? 0) > 0 ? today : addDays(today, -1)
  let n = 0
  while ((records.get(day)?.cards ?? 0) > 0) {
    n++
    day = addDays(day, -1)
  }
  return n
}
